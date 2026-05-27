import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useStatsStore } from '../stores/statsStore';
import { useTimerStore } from '../stores/timerStore';
import { C, T, MONO } from '../theme';

type BreakdownTab = 'tag' | 'task';

export default function StatisticsScreen() {
  const {
    view, setView,
    completedCount, abandonedCount, extraFocusMinutes,
    tagBreakdown, taskBreakdown,
    loadStats,
  } = useStatsStore();

  const { extraFocusEnabled, setExtraFocusEnabled } = useTimerStore();

  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>('tag');
  const [refreshing,   setRefreshing]   = useState(false);

  useEffect(() => { loadStats(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={C.muted}
        />
      }
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <Text style={styles.wordmark}>Statistics</Text>
      <View style={styles.hairline} />

      {/* ── Extra focus toggle ─────────────────────────────────────────── */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelGroup}>
          <Text style={styles.toggleLabel}>Extra Focus Mode</Text>
          <Text style={styles.toggleDesc}>
            Timer continues silently after expiry
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

      {/* ── Today / Week tabs ──────────────────────────────────────────── */}
      <View style={styles.viewTabRow}>
        {(['today', 'week'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.viewTab}
            onPress={() => setView(v)}
          >
            <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>
              {v === 'today' ? 'Today' : 'This Week'}
            </Text>
            {view === v && <View style={styles.viewTabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.hairline} />

      {/* ── Summary numbers ────────────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: C.accent }]}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: C.muted }]}>{abandonedCount}</Text>
          <Text style={styles.summaryLabel}>Abandoned</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: C.body }]}>{extraFocusMinutes}</Text>
          <Text style={styles.summaryLabel}>Extra Min</Text>
        </View>
      </View>

      <View style={styles.hairline} />

      {/* ── Breakdown tabs ─────────────────────────────────────────────── */}
      <View style={styles.breakdownTabRow}>
        {(['tag', 'task'] as const).map((bt) => (
          <TouchableOpacity
            key={bt}
            style={styles.viewTab}
            onPress={() => setBreakdownTab(bt)}
          >
            <Text style={[styles.viewTabText, breakdownTab === bt && styles.viewTabTextActive]}>
              {bt === 'tag' ? 'By Tag' : 'By Task'}
            </Text>
            {breakdownTab === bt && <View style={styles.viewTabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.hairline} />

      {/* ── Breakdown list ─────────────────────────────────────────────── */}
      {breakdownTab === 'tag' && (
        <>
          {tagBreakdown.length === 0 ? (
            <Text style={styles.emptyText}>No sessions in this period</Text>
          ) : (
            tagBreakdown.map((item, idx) => (
              <View
                key={item.tag_id}
                style={[
                  styles.breakdownRow,
                  idx < tagBreakdown.length - 1 && styles.breakdownRowBorder,
                ]}
              >
                <View style={[styles.tagAccent, { backgroundColor: item.tag_color }]} />
                <Text style={styles.breakdownName}>{item.tag_name}</Text>
                <Text style={styles.breakdownCount}>{item.completed_count}</Text>
              </View>
            ))
          )}
        </>
      )}

      {breakdownTab === 'task' && (
        <>
          {taskBreakdown.length === 0 ? (
            <Text style={styles.emptyText}>No completed sessions in this period</Text>
          ) : (
            taskBreakdown.map((item, idx) => (
              <View
                key={item.task_id}
                style={[
                  styles.breakdownRow,
                  idx < taskBreakdown.length - 1 && styles.breakdownRowBorder,
                ]}
              >
                <Text style={styles.breakdownName}>{item.task_title}</Text>
                <Text style={styles.breakdownCount}>{item.completed_count}</Text>
              </View>
            ))
          )}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.canvas },
  content: { paddingTop: 56, paddingBottom: 60 },

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
  },

  // ── Extra focus toggle ──
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  toggleLabelGroup: { flex: 1 },
  toggleLabel: { ...T.bodyMD, color: C.onDark },
  toggleDesc: { ...T.bodySM, marginTop: 2 },

  toggle: {
    borderWidth: 1,
    borderColor: C.hairlineStrong,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleOn: { borderColor: C.onDark },
  toggleText: { ...T.button, color: C.muted },
  toggleTextOn: { color: C.onDark },

  // ── View tabs ──
  viewTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  breakdownTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  viewTab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    position: 'relative',
  },
  viewTabText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.muted,
  },
  viewTabTextActive: { color: C.onDark },
  viewTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: C.onDark,
  },

  // ── Summary ──
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: {
    fontFamily: MONO,
    fontSize: 40,
    fontWeight: '400',
    letterSpacing: 2,
    lineHeight: 48,
  },
  summaryLabel: { ...T.caption, marginTop: 6 },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: C.hairline,
  },

  // ── Breakdown ──
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  breakdownRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  tagAccent: {
    width: 3,
    height: 24,
    marginRight: 16,
  },
  breakdownName: { flex: 1, ...T.bodyMD, color: C.body },
  breakdownCount: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
    color: C.onDark,
  },
  emptyText: {
    ...T.caption,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
