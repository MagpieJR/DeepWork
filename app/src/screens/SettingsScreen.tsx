import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSettingsStore, NotificationType } from '../stores/settingsStore';
import { useTimerStore } from '../stores/timerStore';
import VolumeControls from '../components/VolumeControls';
import { C, T, MONO } from '../theme';

const NOTIFICATION_OPTIONS: { label: string; value: NotificationType }[] = [
  { label: 'Vibration',  value: 'vibration' },
  { label: 'Sound',      value: 'sound'     },
  { label: 'Both',       value: 'both'      },
];

export default function SettingsScreen() {
  const {
    loaded, loadSettings,
    global_duration, notification_type,
    updateSetting,
  } = useSettingsStore();

  const { extraFocusEnabled, setExtraFocusEnabled } = useTimerStore();

  const [durationInput, setDurationInput] = useState('');

  useEffect(() => {
    if (!loaded) loadSettings();
  }, []);

  useEffect(() => {
    setDurationInput(String(global_duration));
  }, [global_duration]);

  const handleDurationSave = async () => {
    const n = parseInt(durationInput, 10);
    if (isNaN(n) || n < 1) {
      Alert.alert('Invalid', 'Duration must be a positive number.');
      setDurationInput(String(global_duration));
      return;
    }
    await updateSetting('global_duration', n);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Text style={styles.wordmark}>Settings</Text>
      <View style={styles.hairline} />

      {/* ── Section: Timer ────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Timer</Text>

      {/* Global pomodoro duration */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>Default Duration</Text>
          <Text style={styles.rowDesc}>Used when no tag or task override is set</Text>
        </View>
        <View style={styles.durationInput}>
          <TextInput
            style={styles.numInput}
            value={durationInput}
            onChangeText={setDurationInput}
            keyboardType="numeric"
            returnKeyType="done"
            onEndEditing={handleDurationSave}
            onSubmitEditing={handleDurationSave}
          />
          <Text style={styles.unitLabel}>min</Text>
        </View>
      </View>

      <View style={styles.rowHairline} />

      {/* Extra focus mode */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>Extra Focus Mode</Text>
          <Text style={styles.rowDesc}>
            Timer continues counting up silently after expiry
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, extraFocusEnabled && styles.toggleOn]}
          onPress={() => setExtraFocusEnabled(!extraFocusEnabled)}
        >
          <Text style={[styles.toggleText, extraFocusEnabled && styles.toggleTextOn]}>
            {extraFocusEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hairline} />

      {/* ── Section: Notifications ────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Notifications</Text>

      <View style={styles.row}>
        <Text style={styles.rowTitle}>Session Completion</Text>
      </View>

      <View style={styles.optionGroup}>
        {NOTIFICATION_OPTIONS.map((opt) => {
          const active = notification_type === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionBtn, active && styles.optionBtnActive]}
              onPress={() => updateSetting('notification_type', opt.value)}
            >
              <Text style={[styles.optionBtnText, active && styles.optionBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.hairline} />

      {/* ── Section: Ambient Sound ────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>Ambient Sound</Text>

      <View style={styles.volumeBlock}>
        <VolumeControls />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.canvas },
  content: { paddingTop: 56, paddingBottom: 80 },

  wordmark: {
    ...T.wordmark,
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  hairline: {
    height: 1,
    backgroundColor: C.hairline,
    marginHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  rowHairline: {
    height: 1,
    backgroundColor: C.hairline,
    marginHorizontal: 24,
  },

  sectionLabel: {
    ...T.caption,
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  rowLeft: { flex: 1 },
  rowTitle: { ...T.bodyMD, color: C.onDark },
  rowDesc: { ...T.bodySM, marginTop: 3 },

  // Duration input
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  numInput: {
    fontFamily: MONO,
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 1,
    color: C.onDark,
    borderBottomWidth: 1,
    borderBottomColor: C.hairlineStrong,
    minWidth: 52,
    paddingVertical: 6,
    textAlign: 'center',
  },
  unitLabel: { ...T.caption, color: C.mutedSoft },

  // Toggle
  toggle: {
    borderWidth: 1,
    borderColor: C.hairlineStrong,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    minWidth: 56,
    alignItems: 'center',
  },
  toggleOn: { borderColor: C.onDark },
  toggleText: { ...T.button, color: C.muted },
  toggleTextOn: { color: C.onDark },

  // Notification options
  optionGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionBtnActive: { borderColor: C.onDark },
  optionBtnText: { ...T.button, color: C.muted },
  optionBtnTextActive: { color: C.onDark },

  // Volume block
  volumeBlock: {
    paddingHorizontal: 24,
  },
});
