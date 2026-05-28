import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTagStore } from '../stores/tagStore';
import { useTaskStore } from '../stores/taskStore';
import { useTimerStore, TimerPhase } from '../stores/timerStore';
import TagManagerModal from '../components/TagManagerModal';
import { C, T, MONO, BTN_PRIMARY } from '../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── TimerScreen ──────────────────────────────────────────────────────────────

export default function TimerScreen() {
  const navigation = useNavigation<any>();

  const { tags, loadTags }   = useTagStore();
  const { tasks, loadTasks } = useTaskStore();

  const {
    phase,
    selectedTagId, selectedTaskId,
    lastUsedTagId,
    plannedSeconds, elapsedSeconds, extraSeconds,
    extraFocusEnabled, origin,
    setSelectedTag, setSelectedTask,
    startSession, tick, abandonSession,
    stopExtraFocus, resetToIdle,
  } = useTimerStore();

  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagPickerOpen,   setTagPickerOpen]   = useState(false);
  const [taskPickerOpen,  setTaskPickerOpen]  = useState(false);
  const [startError,      setStartError]      = useState('');

  // Long-press abandon animation
  const longPressProgress = useRef(new Animated.Value(0)).current;
  const longPressAnim     = useRef<Animated.CompositeAnimation | null>(null);
  const abandonTriggered  = useRef(false);

  // Tick
  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'extra') return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [phase, tick]);

  // Initial load
  useEffect(() => {
    loadTags();
    loadTasks();
  }, []);

  // Pre-fill last-used tag
  useEffect(() => {
    if (!selectedTagId && lastUsedTagId) setSelectedTag(lastUsedTagId);
  }, []);

  const visibleTasks = tasks.filter(
    (t) => t.tag_id === selectedTagId && t.is_free_focus === 0,
  );

  // ── Long-press abandon ────────────────────────────────────────────────────

  const onPressIn = useCallback(() => {
    if (phase !== 'countdown') return;
    abandonTriggered.current = false;
    longPressProgress.setValue(0);
    longPressAnim.current = Animated.timing(longPressProgress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    longPressAnim.current.start();
  }, [phase, longPressProgress]);

  const onPressOut = useCallback(() => {
    longPressAnim.current?.stop();
    longPressProgress.setValue(0);
  }, [longPressProgress]);

  const onLongPress = useCallback(async () => {
    if (phase !== 'countdown' || abandonTriggered.current) return;
    abandonTriggered.current = true;
    longPressProgress.setValue(0);
    await abandonSession();
    if (origin === 'Tasks') navigation.navigate('Tasks');
  }, [phase, abandonSession, origin, navigation, longPressProgress]);

  // ── Extra focus ───────────────────────────────────────────────────────────

  const onTapDuringExtra = useCallback(async () => {
    if (phase !== 'extra') return;
    await stopExtraFocus();
  }, [phase, stopExtraFocus]);

  // ── Completion ────────────────────────────────────────────────────────────

  const onTapCompletion = useCallback(() => {
    resetToIdle();
    if (origin === 'Tasks') navigation.navigate('Tasks');
  }, [resetToIdle, origin, navigation]);

  // ── Start ─────────────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    setStartError('');
    if (!selectedTagId) {
      setStartError('請先選擇標籤。');
      return;
    }
    try {
      await startSession('Timer');
    } catch (e: any) {
      Alert.alert('錯誤', e.message);
    }
  }, [selectedTagId, startSession]);

  // ─────────────────────────────── RENDER ─────────────────────────────────

  // ── Completion ────────────────────────────────────────────────────────────
  if (phase === 'completed') {
    const extraMin = Math.floor(extraSeconds / 60);
    return (
      <Pressable style={styles.fullscreen} onPress={onTapCompletion}>
        <Text style={styles.completionLabel}>專注完成</Text>
        {extraMin > 0 && (
          <Text style={styles.completionExtra}>+{extraMin} 分鐘延伸</Text>
        )}
        <View style={styles.hairline} />
        <Text style={styles.completionHint}>點任意處繼續</Text>
      </Pressable>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  if (phase === 'countdown' || phase === 'extra') {
    const remaining      = plannedSeconds - elapsedSeconds;
    const displaySeconds = phase === 'countdown' ? remaining : extraSeconds;

    const progressWidth = longPressProgress.interpolate({
      inputRange:  [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <Pressable
        style={styles.fullscreen}
        onPressIn={phase === 'countdown' ? onPressIn : undefined}
        onPressOut={phase === 'countdown' ? onPressOut : undefined}
        onLongPress={phase === 'countdown' ? onLongPress : undefined}
        onPress={phase === 'extra' ? onTapDuringExtra : undefined}
        delayLongPress={5000}
        android_disableSound
      >
        {/* Phase label */}
        <Text style={styles.activePhaseLabel}>
          {phase === 'countdown' ? '專注中' : '延伸專注'}
        </Text>

        {/* Timer */}
        <Text style={styles.timerDisplay}>{formatTime(displaySeconds)}</Text>

        {/* Abandon bar */}
        {phase === 'countdown' && (
          <View style={styles.abandonArea}>
            <Text style={styles.abandonHintText}>長按 5 秒放棄</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>
        )}

        {phase === 'extra' && (
          <Text style={styles.extraHint}>點任意處停止</Text>
        )}
      </Pressable>
    );
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  const selectedTag  = tags.find((t) => t.id === selectedTagId);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <View style={styles.idleContainer}>

      {/* Wordmark */}
      <Text style={styles.wordmark}>DeepWork</Text>

      <View style={styles.hairlineFull} />

      {/* ── Tag selector ─────────────────────────────────────────────────── */}
      <View style={styles.selectorBlock}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorLabel}>標籤</Text>
          <TouchableOpacity onPress={() => setTagModalVisible(true)}>
            <Text style={styles.manageLink}>管理</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.pickerRow}
          onPress={() => { setTagPickerOpen((v) => !v); setTaskPickerOpen(false); }}
        >
          {selectedTag ? (
            <View style={styles.pickerValue}>
              <View style={[styles.tagDot, { backgroundColor: selectedTag.color }]} />
              <Text style={styles.pickerText}>{selectedTag.name}</Text>
            </View>
          ) : (
            <Text style={styles.pickerPlaceholder}>選擇標籤</Text>
          )}
          <Text style={styles.chevron}>{tagPickerOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {tagPickerOpen && (
          <ScrollView style={styles.dropdown} nestedScrollEnabled>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedTag(tag.id);
                  setSelectedTask(null);
                  setTagPickerOpen(false);
                  setStartError('');
                }}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={styles.dropdownItemText}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
            {tags.length === 0 && (
              <Text style={styles.dropdownEmpty}>尚無標籤 — 點管理新增</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Task selector (optional) ──────────────────────────────────────── */}
      {selectedTagId && (
        <View style={styles.selectorBlock}>
          <Text style={styles.selectorLabel}>任務  <Text style={styles.optional}>選填</Text></Text>

          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => { setTaskPickerOpen((v) => !v); setTagPickerOpen(false); }}
          >
            <Text style={selectedTaskId ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedTaskId ? (selectedTask?.title ?? '自由專注') : '自由專注'}
            </Text>
            <Text style={styles.chevron}>{taskPickerOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {taskPickerOpen && (
            <ScrollView style={styles.dropdown} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setSelectedTask(null); setTaskPickerOpen(false); }}
              >
                <Text style={styles.dropdownItemText}>自由專注</Text>
              </TouchableOpacity>
              {visibleTasks.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedTask(t.id); setTaskPickerOpen(false); }}
                >
                  <Text style={styles.dropdownItemText}>{t.title}</Text>
                </TouchableOpacity>
              ))}
              {visibleTasks.length === 0 && (
                <Text style={styles.dropdownEmpty}>此標籤無任務</Text>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Error */}
      {!!startError && <Text style={styles.errorText}>{startError}</Text>}

      {/* Start button */}
      <TouchableOpacity
        style={[BTN_PRIMARY, styles.startBtn, !selectedTagId && styles.startBtnDisabled]}
        onPress={handleStart}
        disabled={!selectedTagId}
      >
        <Text style={styles.startBtnText}>開始專注</Text>
      </TouchableOpacity>

      {/* Tag modal */}
      <TagManagerModal
        visible={tagModalVisible}
        onClose={() => { setTagModalVisible(false); loadTags(); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shared ──
  fullscreen: {
    flex: 1,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  hairline: {
    width: 40,
    height: 1,
    backgroundColor: C.hairline,
    marginVertical: 24,
  },
  hairlineFull: {
    width: '100%',
    height: 1,
    backgroundColor: C.hairline,
    marginBottom: 32,
  },

  // ── Completion ──
  completionLabel: {
    ...T.displayLG,
    textAlign: 'center',
    marginBottom: 16,
  },
  completionExtra: {
    ...T.displaySM,
    color: C.accent,
    textAlign: 'center',
  },
  completionHint: {
    ...T.caption,
    textAlign: 'center',
  },

  // ── Active session ──
  activePhaseLabel: {
    ...T.caption,
    marginBottom: 20,
    letterSpacing: 4,
  },
  timerDisplay: {
    fontFamily: MONO,
    fontSize: 76,
    fontWeight: '400',
    color: C.onDark,
    letterSpacing: 6,
    marginBottom: 8,
  },
  abandonArea: {
    marginTop: 48,
    alignItems: 'center',
    width: '70%',
  },
  abandonHintText: {
    ...T.caption,
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 1,
    backgroundColor: C.hairline,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.onDark,
  },
  extraHint: {
    ...T.caption,
    marginTop: 48,
    color: C.accent,
  },

  // ── Idle ──
  idleContainer: {
    flex: 1,
    backgroundColor: C.canvas,
    paddingHorizontal: 28,
    paddingTop: 64,
  },
  wordmark: {
    ...T.wordmark,
    textAlign: 'center',
    marginBottom: 24,
  },

  selectorBlock: { marginBottom: 24 },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectorLabel: { ...T.caption },
  manageLink: {
    ...T.caption,
    color: C.body,
    letterSpacing: 1.5,
  },
  optional: {
    ...T.caption,
    color: C.mutedSoft,
    letterSpacing: 1.5,
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.hairlineStrong,
    paddingVertical: 12,
  },
  pickerValue: { flexDirection: 'row', alignItems: 'center' },
  pickerText: { ...T.bodyMD, color: C.onDark },
  pickerPlaceholder: { ...T.bodyMD, color: C.mutedSoft },
  chevron: { ...T.caption, color: C.mutedSoft },
  tagDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 10 },

  dropdown: {
    backgroundColor: C.surfaceCard,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.hairline,
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  dropdownItemText: { ...T.bodyMD, color: C.body },
  dropdownEmpty: { ...T.caption, padding: 16, textAlign: 'center' },

  errorText: {
    ...T.caption,
    color: C.danger,
    textAlign: 'center',
    marginBottom: 12,
  },

  startBtn: {
    marginTop: 16,
  },
  startBtnText: { ...T.button },
  startBtnDisabled: { opacity: 0.3 },
});
