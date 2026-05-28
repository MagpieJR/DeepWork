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
import { C, T, MONO } from '../theme';

type BreakdownTab = 'tag' | 'task';

export default function StatisticsScreen() {
  const {
    view, setView,
    completedCount, abandonedCount, extraFocusMinutes,
    tagBreakdown, taskBreakdown,
    loadStats,
  } = useStatsStore();

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
      <Text style={styles.wordmark}>統計</Text>
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
              {v === 'today' ? '今日' : '本週'}
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
          <Text style={styles.summaryLabel}>完成</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: C.muted }]}>{abandonedCount}</Text>
          <Text style={styles.summaryLabel}>放棄</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: C.body }]}>{extraFocusMinutes}</Text>
          <Text style={styles.summaryLabel}>延伸分</Text>
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
              {bt === 'tag' ? '按標籤' : '按任務'}
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
            <Text style={styles.emptyText}>此期間無專注記錄</Text>
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
            <Text style={styles.emptyText}>此期間無完成記錄</Text>
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
  content: { paddingTop: 80, paddingBottom: 60 },

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
