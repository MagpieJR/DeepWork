import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';

// ─── Track definitions ────────────────────────────────────────────────────────

export type TrackKey = 'rain' | 'cafe' | 'ocean' | 'forest' | 'whitenoise';

export interface TrackInfo {
  key: TrackKey;
  label: string;
  /** Bundled asset. null until assets are loaded. */
  source: ReturnType<typeof require> | null;
}

export const TRACK_SOURCES: Record<TrackKey, ReturnType<typeof require>> = {
  rain: require('../../assets/audio/rain.mp3'),
  cafe: require('../../assets/audio/cafe.mp3'),
  ocean: require('../../assets/audio/ocean.mp3'),
  forest: require('../../assets/audio/forest.mp3'),
  whitenoise: require('../../assets/audio/whitenoise.mp3'),
};

export const TRACK_LABELS: Record<TrackKey, string> = {
  rain: 'Rain',
  cafe: 'Café',
  ocean: 'Ocean',
  forest: 'Forest',
  whitenoise: 'White Noise',
};

export const ALL_TRACKS: TrackKey[] = ['rain', 'cafe', 'ocean', 'forest', 'whitenoise'];

// ─── Store ───────────────────────────────────────────────────────────────────

/** Volume 0–100 per track. */
type VolumeMap = Record<TrackKey, number>;
/** Loaded Audio.Sound objects per track (null when not loaded). */
type SoundMap = Record<TrackKey, Audio.Sound | null>;

interface AudioState {
  volumes: VolumeMap;
  sounds: SoundMap;

  /**
   * Set the volume for a single track (0–100).
   * - Volume 0 → stop playing and unload the sound to release resources.
   * - Volume >0 → play (or resume) the track at the given level.
   */
  setVolume: (track: TrackKey, volume: number) => Promise<void>;

  /**
   * Stop all playing tracks immediately.
   * Called when a focus session ends (completion or abandon).
   */
  stopAll: () => Promise<void>;
}

function makeDefaultVolumes(): VolumeMap {
  return { rain: 0, cafe: 0, ocean: 0, forest: 0, whitenoise: 0 };
}

function makeDefaultSounds(): SoundMap {
  return { rain: null, cafe: null, ocean: null, forest: null, whitenoise: null };
}

export const useAudioStore = create<AudioState>()((set, get) => ({
  volumes: makeDefaultVolumes(),
  sounds: makeDefaultSounds(),

  setVolume: async (track, volume) => {
    const clampedVol = Math.max(0, Math.min(100, Math.round(volume)));
    const { sounds, volumes } = get();

    if (clampedVol === 0) {
      // Unload and release resource.
      const sound = sounds[track];
      if (sound) {
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
      }
      set({
        volumes: { ...volumes, [track]: 0 },
        sounds: { ...sounds, [track]: null },
      });
      return;
    }

    // Volume > 0: ensure the track is loaded and playing.
    let sound = sounds[track];
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        TRACK_SOURCES[track],
        { isLooping: true, volume: clampedVol / 100, shouldPlay: true },
      );
      sound = newSound;
    } else {
      // Already loaded — just update volume and ensure playing.
      await sound.setVolumeAsync(clampedVol / 100);
      const status: AVPlaybackStatus = await sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await sound.playAsync();
      }
    }

    set({
      volumes: { ...volumes, [track]: clampedVol },
      sounds: { ...get().sounds, [track]: sound },
    });
  },

  stopAll: async () => {
    const { sounds } = get();
    await Promise.all(
      ALL_TRACKS.map(async (key) => {
        const sound = sounds[key];
        if (sound) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
        }
      }),
    );
    set({ sounds: makeDefaultSounds() });
    // Volumes are intentionally preserved so they restore when user re-enables tracks.
  },
}));
