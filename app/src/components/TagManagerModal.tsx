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
    if (!trimmed) { setError('Tag name is required.'); return; }
    const dur = formDuration ? parseInt(formDuration, 10) : undefined;
    if (formDuration && (isNaN(dur!) || dur! < 1)) {
      setError('Duration must be a positive number.');
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
      setError(e.message ?? 'An error occurred.');
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert(
      'Delete Tag',
      `Delete "${tag.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try { await deleteTag(tag.id); }
            catch (e: any) { Alert.alert('Cannot Delete', e.message); }
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
                <Text style={styles.sheetTitle}>Tags</Text>
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
                      <Text style={styles.rowActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.rowAction}>
                      <Text style={[styles.rowActionText, styles.rowActionDelete]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No tags yet</Text>
                }
              />

              <View style={styles.hairline} />
              <TouchableOpacity style={[BTN_PRIMARY, styles.newTagBtn]} onPress={openCreate}>
                <Text style={styles.newTagBtnText}>New Tag</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Create / Edit form ───────────────────────────────────── */}
          {showForm && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingTag ? 'Edit Tag' : 'New Tag'}
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.hairline} />

              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.inputUnderline}
                placeholder="Tag name"
                placeholderTextColor={C.mutedSoft}
                value={formName}
                onChangeText={setFormName}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Color</Text>
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
                Default Duration (min)  <Text style={styles.optional}>optional</Text>
              </Text>
              <TextInput
                style={styles.inputUnderline}
                placeholder="Leave blank to use global default"
                placeholderTextColor={C.mutedSoft}
                value={formDuration}
                onChangeText={setFormDuration}
                keyboardType="numeric"
                returnKeyType="done"
              />

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.formBtns}>
                <TouchableOpacity style={[BTN_GHOST, styles.cancelBtn]} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[BTN_PRIMARY, styles.saveBtn]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
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
