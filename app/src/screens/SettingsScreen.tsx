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
  { label: '震動', value: 'vibration' },
  { label: '聲音', value: 'sound'     },
  { label: '兩者', value: 'both'      },
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
      Alert.alert('無效', '時長必須為正整數。');
      setDurationInput(String(global_duration));
      return;
    }
    await updateSetting('global_duration', n);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Text style={styles.wordmark}>設定</Text>
      <View style={styles.hairline} />

      {/* ── Section: Timer ────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>計時器</Text>

      {/* Global pomodoro duration */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>預設時長</Text>
          <Text style={styles.rowDesc}>未設定標籤或任務覆蓋時使用</Text>
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
          <Text style={styles.unitLabel}>分</Text>
        </View>
      </View>

      <View style={styles.rowHairline} />

      {/* Extra focus mode */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>延伸專注模式</Text>
          <Text style={styles.rowDesc}>
            計時結束後靜音繼續計時
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, extraFocusEnabled && styles.toggleOn]}
          onPress={() => setExtraFocusEnabled(!extraFocusEnabled)}
        >
          <Text style={[styles.toggleText, extraFocusEnabled && styles.toggleTextOn]}>
            {extraFocusEnabled ? '開' : '關'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hairline} />

      {/* ── Section: Notifications ────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>通知</Text>

      <View style={styles.row}>
        <Text style={styles.rowTitle}>專注完成</Text>
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
      <Text style={styles.sectionLabel}>環境音</Text>

      <View style={styles.volumeBlock}>
        <VolumeControls />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.canvas },
  content: { paddingTop: 80, paddingBottom: 80 },

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
