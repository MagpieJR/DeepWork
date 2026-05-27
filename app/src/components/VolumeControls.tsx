import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { ALL_TRACKS, TrackKey, TRACK_LABELS, useAudioStore } from '../stores/audioStore';
import { C, T, MONO } from '../theme';

export default function VolumeControls() {
  const { volumes, setVolume } = useAudioStore();

  return (
    <View style={styles.container}>
      {ALL_TRACKS.map((key: TrackKey, idx) => (
        <View
          key={key}
          style={[styles.row, idx < ALL_TRACKS.length - 1 && styles.rowBorder]}
        >
          <Text style={styles.trackLabel}>{TRACK_LABELS[key]}</Text>
          <Text style={styles.volumeValue}>{volumes[key]}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={volumes[key]}
            onValueChange={(v) => setVolume(key, v)}
            minimumTrackTintColor={C.onDark}
            maximumTrackTintColor={C.hairlineStrong}
            thumbTintColor={C.onDark}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },

  trackLabel: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.body,
    width: 80,
  },

  volumeValue: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1,
    color: C.mutedSoft,
    width: 32,
    textAlign: 'right',
  },

  slider: { flex: 1, marginLeft: 12 },
});
