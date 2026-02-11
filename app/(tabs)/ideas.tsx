import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Plus, Sparkles, Play, Edit2, GripVertical, Trash2 } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface Idea {
  id: string;
  title: string;
  description: string | null;
  is_commission: boolean;
  priority: number | null;
  display_order: number;
  created_at: string;
}

export default function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .eq('stage', 'idea')
        .eq('is_graveyard', false)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newIdeas = [...ideas];
    const [movedItem] = newIdeas.splice(fromIndex, 1);
    newIdeas.splice(toIndex, 0, movedItem);

    setIdeas(newIdeas);

    try {
      const updates = newIdeas.map((idea, index) => ({
        id: idea.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('pieces')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error reordering ideas:', error);
      fetchIdeas();
    }
  };

  const startIdea = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from('pieces')
        .update({ stage: 'new' })
        .eq('id', ideaId);

      if (error) throw error;

      setShowDetailModal(false);
      setSelectedIdea(null);
      fetchIdeas();
    } catch (error) {
      console.error('Error starting idea:', error);
    }
  };

  const scrapIdea = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from('pieces')
        .update({ is_graveyard: true })
        .eq('id', ideaId);

      if (error) throw error;

      setShowDetailModal(false);
      setSelectedIdea(null);
      fetchIdeas();
    } catch (error) {
      console.error('Error scrapping idea:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.clay} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ideas</Text>
        </View>

        {ideas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No ideas yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first piece idea or commission
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} scrollEnabled={true}>
            {ideas.map((item, index) => (
              <DraggableItem
                key={item.id}
                item={item}
                index={index}
                onReorder={handleReorder}
                totalItems={ideas.length}
                onPress={() => {
                  setSelectedIdea(item);
                  setShowDetailModal(true);
                }}
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>

        <AddIdeaModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchIdeas}
        />

        <DetailModal
          visible={showDetailModal}
          idea={selectedIdea}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedIdea(null);
          }}
          onStart={startIdea}
          onScrap={scrapIdea}
          onUpdate={fetchIdeas}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function DraggableItem({
  item,
  index,
  onReorder,
  onPress,
  totalItems,
}: {
  item: Idea;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  totalItems: number;
}) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const ITEM_HEIGHT = 90;

  const handleReorderJS = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < totalItems && newIndex !== index) {
      onReorder(index, newIndex);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      const offset = Math.round(translateY.value / ITEM_HEIGHT);
      const newIndex = index + offset;

      if (offset !== 0 && newIndex >= 0 && newIndex < totalItems) {
        runOnJS(handleReorderJS)(newIndex);
      }

      translateY.value = withSpring(0);
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      zIndex: isDragging.value ? 100 : 0,
      opacity: isDragging.value ? 0.8 : 1,
    };
  });

  return (
    <Animated.View style={[styles.ideaCard, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.gripContainer}>
          <View style={styles.gripLines}>
            <View style={styles.gripLine} />
            <View style={styles.gripLine} />
            <View style={styles.gripLine} />
          </View>
        </View>
      </GestureDetector>
      <TouchableOpacity style={styles.ideaContent} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.ideaHeader}>
          <Text style={styles.ideaTitle}>{item.title}</Text>
          {item.is_commission ? (
            <View style={styles.commissionBadge}>
              <Sparkles size={14} color={colors.terracotta} />
              <Text style={styles.commissionText}>Commission</Text>
            </View>
          ) : null}
        </View>
        {item.description ? (
          <Text style={styles.ideaDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

function AddIdeaModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCommission, setIsCommission] = useState(false);
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('pieces').insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          stage: 'idea',
          is_commission: isCommission,
          priority: priority ? parseInt(priority, 10) : null,
        },
      ]);

      if (error) throw error;

      setTitle('');
      setDescription('');
      setIsCommission(false);
      setPriority('');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error adding idea:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Idea</Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textLight}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textLight}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Commission</Text>
            <Switch
              value={isCommission}
              onValueChange={setIsCommission}
              trackColor={{ false: colors.borderLight, true: colors.sand }}
              thumbColor={isCommission ? colors.terracotta : colors.surface}
            />
          </View>


          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleSubmit}
              disabled={loading || !title.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>Add Idea</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailModal({
  visible,
  idea,
  onClose,
  onStart,
  onScrap,
  onUpdate,
}: {
  visible: boolean;
  idea: Idea | null;
  onClose: () => void;
  onStart: (ideaId: string) => void;
  onScrap: (ideaId: string) => void;
  onUpdate: () => void;
}) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditDescription = () => {
    setDescriptionInput(idea?.description || '');
    setEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!idea) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pieces')
        .update({ description: descriptionInput.trim() || null })
        .eq('id', idea.id);

      if (error) throw error;

      setEditingDescription(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating description:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!idea) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalScrollContent}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>{idea.title}</Text>
              {idea.is_commission ? (
                <View style={styles.commissionBadge}>
                  <Sparkles size={14} color={colors.terracotta} />
                  <Text style={styles.commissionText}>Commission</Text>
                </View>
              ) : null}
            </View>

            {!editingDescription ? (
              <TouchableOpacity
                style={styles.descriptionRow}
                onPress={handleEditDescription}
                activeOpacity={0.7}
              >
                <View style={styles.descriptionContent}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  {idea.description ? (
                    <Text style={styles.detailDescription}>{idea.description}</Text>
                  ) : (
                    <Text style={styles.detailDescriptionPlaceholder}>Add a description</Text>
                  )}
                </View>
                <Edit2 size={16} color={colors.textLight} />
              </TouchableOpacity>
            ) : (
              <View style={styles.descriptionEditContainer}>
                <Text style={styles.sectionTitle}>Edit Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descriptionInput}
                  onChangeText={setDescriptionInput}
                  placeholder="Enter description"
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setEditingDescription(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleSaveDescription}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.surface} size="small" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { width: '100%', marginTop: spacing.xl }]}
              onPress={() => onStart(idea.id)}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.surface} />
              <Text style={[styles.modalButtonTextPrimary, { marginLeft: spacing.sm }]}>
                Create
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.scrapButton, { width: '100%' }]}
              onPress={() => onScrap(idea.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.modalButtonTextSecondary, styles.scrapText, { marginLeft: spacing.sm }]}>
                Scrap
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { width: '100%' }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonTextSecondary}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.title,
  },
  listContent: {
    padding: spacing.lg,
  },
  ideaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.subtle,
  },
  gripContainer: {
    padding: spacing.md,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gripLines: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gripLine: {
    width: 20,
    height: 2.5,
    backgroundColor: colors.clay,
    borderRadius: 2,
  },
  ideaContent: {
    flex: 1,
  },
  ideaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  ideaTitle: {
    ...typography.subheading,
    flex: 1,
  },
  ideaDescription: {
    ...typography.caption,
    color: colors.textMedium,
  },
  commissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  commissionText: {
    ...typography.label,
    color: colors.terracotta,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.heading,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMedium,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.clay,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 400,
  },
  modalTitle: {
    ...typography.title,
    flex: 1,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.bodyMedium,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  detailDescription: {
    ...typography.body,
    color: colors.textMedium,
  },
  detailDescriptionPlaceholder: {
    ...typography.body,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  descriptionContent: {
    flex: 1,
  },
  descriptionEditContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  photosSection: {
    marginBottom: spacing.lg,
  },
  photosList: {
    marginBottom: spacing.sm,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.sand,
    ...shadows.subtle,
  },
  photoInputSection: {
    marginBottom: spacing.md,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    ...typography.bodyMedium,
    color: colors.clay,
    marginLeft: spacing.sm,
  },
  modalScrollContent: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.clay,
    ...shadows.soft,
  },
  modalButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  modalButtonTextPrimary: {
    ...typography.bodyMedium,
    color: colors.surface,
  },
  modalButtonTextSecondary: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  scrapButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrapText: {
    color: colors.error,
  },
});
