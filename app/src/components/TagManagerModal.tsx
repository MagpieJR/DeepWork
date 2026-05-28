import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { Tag, useTagStore } from '../stores/tagStore';
import { C, T, MONO, BTN_PRIMARY, BTN_GHOST } from '../theme';

// ─── Preset tag colors ────────────────────────────────────────────────────────
// Kept functional (users need to distinguish tags visually).
const PRESET_COLORS = [
  '#cc5555', '#c48a3f', '#a8a83a', '#3aaa6e',
  '#3a7fb5', '#7b6cc4', '#b55c94', '#8a9ba8',
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TagManagerModal({ visible, onClose }: Props) {
  const { tags, loadTags, createTag, updateTag, deleteTag } = useTagStore();

  const [editingTag,    setEditingTag]   = useState<Tag | null>(null);
  const [isCreating,    setIsCreating]   = useState(false);
  const [formName,      setFormName]     = useState('');
  const [formColor,     setFormColor]    = useState(PRESET_COLORS[0]);
  const [formDuration,  setFormDuration] = useState('');
  const [error,         setError]        = useState('');

  useEffect(() => {
    if (visible) loadTags();
  }, [visible]);

  const resetForm = () => {
    setFormName('');
    setFormColor(PRESET_COLORS[0]);
    setFormDuration('');
    setError('');
    setEditingTag(null);
    setIsCreating(false);
  };

  const openCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormDuration(tag.default_duration != null ? String(tag.default_duration) : '');
    setError('');
    setIsCreating(false);
  };

  const handleSave = async () => {
    setError('');
    const trimmed = formName.trim();
    if (!trimmed) { setError('請輸入標籤名稱。'); return; }
    const dur = formDuration ? parseInt(formDuration, 10) : undefined;
    if (formDuration && (isNaN(dur!) || dur! < 1)) {
      setError('時長必須為正整數。');
      return;
    }
    try {
      if (editingTag) {
        await updateTag(editingTag.id, {
          name: trimmed,
          color: formColor,
          default_duration: dur ?? null,
        });
      } else {
        await createTag(trimmed, formColor, dur);
      }
      resetForm();
    } catch (e: any) {
      setError(e.message ?? '發生錯誤，請稍後再試。');
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert(
      '刪除標籤',
      `確定刪除「${tag.name}」？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除', style: 'destructive',
          onPress: async () => {
            try { await deleteTag(tag.id); }
            catch (e: any) { Alert.alert('無法刪除', e.message); }
          },
        },
      ],
    );
  };

  const showForm = isCreating || editingTag !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>

          {/* ── Tag list ─────────────────────────────────────────────── */}
          {!showForm && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>標籤</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.hairline} />

              <FlatList
                data={tags}
                keyExtractor={(t) => t.id}
                style={styles.list}
                renderItem={({ item, index }) => (
                  <View style={[
                    styles.row,
                    index < tags.length - 1 && styles.rowBorder,
                  ]}>
                    {/* Color accent strip */}
                    <View style={[styles.tagAccent, { backgroundColor: item.color }]} />

                    <View style={styles.rowContent}>
                      <Text style={styles.tagName}>{item.name}</Text>
                      {item.default_duration != null && (
                        <Text style={styles.tagDur}>{item.default_duration} min</Text>
                      )}
                    </View>

                    <TouchableOpacity onPress={() => openEdit(item)} style={styles.rowAction}>
                      <Text style={styles.rowActionText}>編輯</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.rowAction}>
                      <Text style={[styles.rowActionText, styles.rowActionDelete]}>刪除</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>尚無標籤</Text>
                }
              />

              <View style={styles.hairline} />
              <TouchableOpacity style={[BTN_PRIMARY, styles.newTagBtn]} onPress={openCreate}>
                <Text style={styles.newTagBtnText}>新增標籤</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Create / Edit form ───────────────────────────────────── */}
          {showForm && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingTag ? '編輯標籤' : '新增標籤'}
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.hairline} />

              <Text style={styles.fieldLabel}>名稱</Text>
              <TextInput
                style={styles.inputUnderline}
                placeholder="標籤名稱"
                placeholderTextColor={C.mutedSoft}
                value={formName}
                onChangeText={setFormName}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>顏色</Text>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      formColor === c && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setFormColor(c)}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>
                預設時長（分）  <Text style={styles.optional}>選填</Text>
              </Text>
              <TextInput
                style={styles.inputUnderline}
                placeholder="留空使用全域預設"
                placeholderTextColor={C.mutedSoft}
                value={formDuration}
                onChangeText={setFormDuration}
                keyboardType="numeric"
                returnKeyType="done"
              />

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.formBtns}>
                <TouchableOpacity style={[BTN_GHOST, styles.cancelBtn]} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[BTN_PRIMARY, styles.saveBtn]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>儲存</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    maxHeight: '80%',
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: { ...T.displaySM },
  closeBtn: { ...T.caption, color: C.mutedSoft, padding: 4 },

  hairline: {
    height: 1,
    backgroundColor: C.hairline,
    marginBottom: 20,
  },

  // ── Tag list ──
  list: { maxHeight: 280 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  tagAccent: {
    width: 3,
    height: 28,
    marginRight: 14,
  },
  rowContent: { flex: 1 },
  tagName: { ...T.bodyMD, color: C.onDark },
  tagDur: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: C.muted,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  rowAction: { paddingHorizontal: 10 },
  rowActionText: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.muted,
  },
  rowActionDelete: { color: C.danger },

  emptyText: {
    ...T.caption,
    textAlign: 'center',
    paddingVertical: 28,
  },

  newTagBtn: { marginTop: 4 },
  newTagBtnText: { ...T.button },

  // ── Form ──
  fieldLabel: { ...T.caption },
  optional: { color: C.mutedSoft },

  inputUnderline: {
    ...T.bodyMD,
    color: C.onDark,
    borderBottomWidth: 1,
    borderBottomColor: C.hairlineStrong,
    paddingVertical: 10,
    marginTop: 8,
  },

  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: C.onDark,
  },

  errorText: {
    ...T.caption,
    color: C.danger,
    marginTop: 16,
    textAlign: 'center',
  },

  formBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelBtn: { flex: 1 },
  cancelBtnText: { ...T.button, color: C.muted },
  saveBtn: { flex: 2 },
  saveBtnText: { ...T.button },
});
