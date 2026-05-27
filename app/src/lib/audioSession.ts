import { Audio } from 'expo-av';

/**
 * Configure the audio session so that ambient white noise continues playing
 * when the app is backgrounded during an active focus session.
 *
 * Must be called once at app startup before any Audio.Sound is created.
 * Implements: white-noise spec "Background audio during focus session"
 */
export async function configureAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: false,
  });
}
