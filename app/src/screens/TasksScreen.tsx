import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTaskStore, TaskType, CreateTaskInput } from '../stores/taskStore';
import { useTagStore, Task } from '../stores/tagStore';
import { C, T, MONO, BTN_PRIMARY, BTN_GHOST } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: TaskType; label: string }[] = [
  { key: 'daily',     label: '每日' },
  { key: 'scheduled', label: '排程' },
  { key: 'weekly',    label: '每週' },
];

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const TAB_LABELS: Record<TaskType, string> = { daily: '每日', scheduled: '排程', weekly: '每週' };

// ─── Form state ───────────────────────────────────────────────────────────────

interface TaskForm {
  title: string;
  tag_id: string;
  task_type: TaskType;
  custom_duration: string;
  scheduled_date: string;   // 'YYYY-MM-DD'
  scheduled_time: string;   // 'HH:MM'
  reminder_day: number | null;
  reminder_time: string;    // 'HH:MM'
}

function emptyForm(type: TaskType): TaskForm {
  return {
    title: '', tag_id: '', task_type: type,
    custom_duration: '', scheduled_date: '',
    scheduled_time: '', reminder_day: null, reminder_time: '',
  };
}

function formFromTask(task: Task): TaskForm {
  let scheduled_date = '', scheduled_time = '';
  if (task.scheduled_at) {
    const d = new Date(task.scheduled_at);
    scheduled_date = d.toISOString().slice(0, 10);
    scheduled_time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return {
    title: task.title,
    tag_id: task.tag_id,
    task_type: task.task_type,
    custom_duration: task.custom_duration != null ? String(task.custom_duration) : '',
    scheduled_date,
    scheduled_time,
    reminder_day: task.reminder_day,
    reminder_time: task.reminder_time ?? '',
  };
}

// ─── TasksScreen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const {
    tasks, loadTasks,
    createTask, updateTask, deleteTask,
    toggleComplete, getPastDueScheduled,
  } = useTaskStore();

  const { tags, loadTags } = useTagStore();

  const [activeTab,     setActiveTab]     = useState<TaskType>('daily');
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingTask,   setEditingTask]   = useState<Task | null>(null);
  const [form,          setForm]          = useState<TaskForm>(emptyForm('daily'));
  const [formError,     setFormError]     = useState('');
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    loadTasks();
    loadTags();
    checkPastDue();
  }, []);

  const checkPastDue = useCallback(async () => {
    const pastDue = await getPastDueScheduled();
    for (const task of pastDue) {
      Alert.alert(
        '逾期任務',
        `「${task.title}」已超過排程時間。`,
        [
          { text: '關閉', style: 'cancel' },
          { text: '標記未完成', onPress: () => toggleComplete(task.id, false) },
        ],
      );
    }
  }, [getPastDueScheduled, toggleComplete]);

  const visibleTasks = tasks.filter((t) => t.task_type === activeTab);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setEditingTask(null);
    setForm(emptyForm(activeTab));
    setFormError('');
    setModalVisible(true);
  }, [activeTab]);

  const openEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setForm(formFromTask(task));
    setFormError('');
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => setModalVisible(false), []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setFormError('');
    const title = form.title.trim();
    if (!title)       { setFormError('請輸入標題。');   return; }
    if (!form.tag_id) { setFormError('請選擇標籤。');   return; }

    let scheduled_at: string | undefined;
    if (form.task_type === 'scheduled') {
      if (!form.scheduled_date || !form.scheduled_time) {
        setFormError('排程任務需填入日期和時間。');
        return;
      }
      const d = new Date(`${form.scheduled_date}T${form.scheduled_time}:00`);
      if (isNaN(d.getTime())) {
        setFormError('日期/時間格式無效，請使用 YYYY-MM-DD 和 HH:MM。');
        return;
      }
      scheduled_at = d.toISOString();
    }

    let custom_duration: number | undefined;
    if (form.custom_duration) {
      custom_duration = parseInt(form.custom_duration, 10);
      if (isNaN(custom_duration) || custom_duration < 1) {
        setFormError('時長必須為正整數。');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: CreateTaskInput = {
        tag_id: form.tag_id,
        title,
        task_type: form.task_type,
        custom_duration,
        scheduled_at,
        reminder_day: form.reminder_day ?? undefined,
        reminder_time: form.reminder_time || undefined,
      };

      if (editingTask) {
        await updateTask(editingTask.id, {
          title: payload.title, tag_id: payload.tag_id,
          task_type: payload.task_type, custom_duration: payload.custom_duration,
          scheduled_at: payload.scheduled_at, reminder_day: payload.reminder_day,
          reminder_time: payload.reminder_time,
        });
      } else {
        await createTask(payload);
      }
      setModalVisible(false);
    } catch (e: any) {
      setFormError(e.message ?? '儲存任務失敗。');
    } finally {
      setSaving(false);
    }
  }, [form, editingTask, createTask, updateTask]);

  const handleDelete = useCallback((task: Task) => {
    Alert.alert(
      '刪除任務',
      `確定刪除「${task.title}」？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '刪除', style: 'destructive', onPress: () => deleteTask(task.id) },
      ],
    );
  }, [deleteTask]);

  const handleToggle = useCallback((task: Task) => {
    toggleComplete(task.id, task.is_completed === 0);
  }, [toggleComplete]);

  // ─────────────────────────────── RENDER ─────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>任務</Text>

        {/* Type tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.hairline} />
      </View>

      {/* ── Task list ───────────────────────────────────────────────────── */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {visibleTasks.length === 0 && (
          <Text style={styles.emptyText}>
            沒有{TAB_LABELS[activeTab]}任務 — 點下方新增
          </Text>
        )}

        {visibleTasks.map((task, idx) => {
          const tag  = tags.find((t) => t.id === task.tag_id);
          const done = task.is_completed === 1;

          return (
            <View
              key={task.id}
              style={[
                styles.taskRow,
                idx < visibleTasks.length - 1 && styles.taskRowBorder,
              ]}
            >
              {/* Checkbox — square */}
              <TouchableOpacity
                style={[styles.checkbox, done && styles.checkboxDone]}
                onPress={() => handleToggle(task)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {done && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              {/* Tag color accent */}
              <View style={[styles.tagAccent, { backgroundColor: tag?.color ?? C.hairline }]} />

              {/* Content */}
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>
                  {task.title}
                </Text>

                {task.task_type === 'scheduled' && task.scheduled_at && (
                  <Text style={styles.taskMeta}>
                    {new Date(task.scheduled_at).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                )}

                {task.task_type === 'weekly' && task.reminder_day != null && task.reminder_time && (
                  <Text style={styles.taskMeta}>
                    {DAYS[task.reminder_day]}  {task.reminder_time}
                  </Text>
                )}

                {task.missed_count > 0 && (
                  <Text style={styles.missedText}>
                    錯過 {task.missed_count} 次
                  </Text>
                )}
              </View>

              {/* Actions */}
              <TouchableOpacity
                onPress={() => openEdit(task)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                style={styles.iconBtn}
              >
                <Text style={styles.iconText}>✏</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(task)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                style={styles.iconBtn}
              >
                <Text style={[styles.iconText, styles.iconDelete]}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Add task ────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity style={[BTN_PRIMARY, styles.addBtn]} onPress={openAdd}>
          <Text style={styles.addBtnText}>新增任務</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} activeOpacity={1} />

          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editingTask ? '編輯任務' : '新增任務'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Title */}
              <Text style={styles.fieldLabel}>標題</Text>
              <TextInput
                style={styles.inputUnderline}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="要做什麼？"
                placeholderTextColor={C.mutedSoft}
                returnKeyType="next"
              />

              {/* Tag */}
              <Text style={styles.fieldLabel}>
                標籤  <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {tags.map((tag) => {
                  const sel = form.tag_id === tag.id;
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.chip, sel && { borderColor: tag.color }]}
                      onPress={() => setForm((f) => ({ ...f, tag_id: tag.id }))}
                    >
                      <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                      <Text style={[styles.chipText, sel && { color: C.onDark }]}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {tags.length === 0 && (
                  <Text style={styles.emptyText}>尚無標籤 — 請在計時頁面新增</Text>
                )}
              </ScrollView>

              {/* Task type */}
              <Text style={styles.fieldLabel}>類型</Text>
              <View style={styles.typeRow}>
                {TABS.map((tab) => {
                  const sel = form.task_type === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.typeBtn, sel && styles.typeBtnActive]}
                      onPress={() => setForm((f) => ({ ...f, task_type: tab.key }))}
                    >
                      <Text style={[styles.typeBtnText, sel && styles.typeBtnTextActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom duration */}
              <Text style={styles.fieldLabel}>
                自訂時長（分）  <Text style={styles.optional}>選填</Text>
              </Text>
              <TextInput
                style={styles.inputUnderline}
                value={form.custom_duration}
                onChangeText={(v) => setForm((f) => ({ ...f, custom_duration: v }))}
                placeholder="留空使用標籤或全域預設"
                placeholderTextColor={C.mutedSoft}
                keyboardType="numeric"
                returnKeyType="done"
              />

              {/* Scheduled fields */}
              {form.task_type === 'scheduled' && (
                <>
                  <Text style={styles.fieldLabel}>
                    日期  <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.inputUnderline}
                    value={form.scheduled_date}
                    onChangeText={(v) => setForm((f) => ({ ...f, scheduled_date: v }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.mutedSoft}
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={styles.fieldLabel}>
                    時間  <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.inputUnderline}
                    value={form.scheduled_time}
                    onChangeText={(v) => setForm((f) => ({ ...f, scheduled_time: v }))}
                    placeholder="HH:MM  (24h)"
                    placeholderTextColor={C.mutedSoft}
                    keyboardType="numbers-and-punctuation"
                  />
                </>
              )}

              {/* Weekly fields */}
              {form.task_type === 'weekly' && (
                <>
                  <Text style={styles.fieldLabel}>
                    提醒日  <Text style={styles.optional}>選填</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {DAYS.map((day, idx) => {
                      const sel = form.reminder_day === idx;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.dayBtn, sel && styles.typeBtnActive]}
                          onPress={() => setForm((f) => ({
                            ...f,
                            reminder_day: f.reminder_day === idx ? null : idx,
                          }))}
                        >
                          <Text style={[styles.typeBtnText, sel && styles.typeBtnTextActive]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.fieldLabel}>
                    提醒時間  <Text style={styles.optional}>選填</Text>
                  </Text>
                  <TextInput
                    style={styles.inputUnderline}
                    value={form.reminder_time}
                    onChangeText={(v) => setForm((f) => ({ ...f, reminder_time: v }))}
                    placeholder="HH:MM  (24h)"
                    placeholderTextColor={C.mutedSoft}
                    keyboardType="numbers-and-punctuation"
                  />
                </>
              )}

              {/* Error */}
              {!!formError && <Text style={styles.errorText}>{formError}</Text>}

              {/* Buttons */}
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[BTN_GHOST, styles.cancelBtn]} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[BTN_PRIMARY, styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? '儲存中' : '儲存'}</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.canvas },

  // ── Header ──
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: C.canvas,
  },
  title: { ...T.wordmark, marginBottom: 24 },

  tabRow: { flexDirection: 'row', marginBottom: 0 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    position: 'relative',
  },
  tabText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.muted,
  },
  tabTextActive: { color: C.onDark },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 1,
    backgroundColor: C.onDark,
  },
  hairline: { height: 1, backgroundColor: C.hairline },

  // ── List ──
  list: { flex: 1 },
  listContent: { paddingBottom: 120 },

  emptyText: {
    ...T.caption,
    textAlign: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },

  // ── Task row ──
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: C.canvas,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: C.hairlineStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxDone: { backgroundColor: C.accent, borderColor: C.accent },
  checkmark: { color: C.canvas, fontSize: 11, fontWeight: '400' },

  tagAccent: {
    width: 3,
    height: 36,
    marginRight: 14,
  },

  taskContent: { flex: 1 },
  taskTitle: { ...T.bodyMD, color: C.onDark },
  taskTitleDone: { textDecorationLine: 'line-through', color: C.mutedSoft },
  taskMeta: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: C.muted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  missedText: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: C.danger,
    marginTop: 4,
    textTransform: 'uppercase',
  },

  iconBtn: { paddingHorizontal: 8 },
  iconText: { ...T.caption, color: C.mutedSoft, fontSize: 13 },
  iconDelete: { color: C.danger },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.canvas,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  addBtn: { width: '100%' },
  addBtnText: { ...T.button },

  // ── Modal ──
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalSheet: {
    backgroundColor: C.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    maxHeight: '92%',
  },
  modalTitle: { ...T.displaySM, marginBottom: 24 },

  // ── Form ──
  fieldLabel: {
    ...T.caption,
    marginTop: 20,
    marginBottom: 8,
  },
  required: { color: C.danger },
  optional: { color: C.mutedSoft },

  inputUnderline: {
    ...T.bodyMD,
    color: C.onDark,
    borderBottomWidth: 1,
    borderBottomColor: C.hairlineStrong,
    paddingVertical: 10,
  },

  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.hairline,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipText: { ...T.caption, color: C.muted },
  tagDot: { width: 6, height: 6, borderRadius: 3 },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.hairline,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeBtnActive: { borderColor: C.onDark, backgroundColor: C.surfaceElevated },
  typeBtnText: { ...T.caption, color: C.muted },
  typeBtnTextActive: { color: C.onDark },

  dayBtn: {
    borderWidth: 1,
    borderColor: C.hairline,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 42,
  },

  errorText: {
    ...T.caption,
    color: C.danger,
    textAlign: 'center',
    marginTop: 16,
  },

  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1 },
  cancelBtnText: { ...T.button, color: C.muted },
  saveBtn: { flex: 2 },
  saveBtnText: { ...T.button },
  btnDisabled: { opacity: 0.3 },
});
