import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronRight, Trash2 } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface Piece {
  id: string;
  title: string;
  description: string | null;
  stage: string;
  is_graveyard: boolean;
  created_at: string;
}

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'leather_hard', label: 'Leather Hard' },
  { value: 'bone_dry', label: 'Bone Dry' },
  { value: 'bisque_firing', label: 'Bisque Firing' },
  { value: 'glaze_firing', label: 'Glaze Firing' },
];

interface SectionData {
  title: string;
  data: Piece[];
}

export default function CurrentWorksScreen() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);

  useEffect(() => {
    fetchPieces();
  }, []);

  const fetchPieces = async () => {
    try {
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .neq('stage', 'idea')
        .neq('stage', 'completed')
        .eq('is_graveyard', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPieces(data || []);
    } catch (error) {
      console.error('Error fetching pieces:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionedPieces = (): SectionData[] => {
    const sections: SectionData[] = STAGES.map((stage) => ({
      title: stage.label,
      data: pieces.filter((p) => p.stage === stage.value),
    })).filter((section) => section.data.length > 0);

    return sections;
  };

  const updateStage = async (pieceId: string, newStage: string) => {
    try {
      const updates: any = { stage: newStage };

      if (newStage === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pieces')
        .update(updates)
        .eq('id', pieceId);

      if (error) throw error;

      setShowStageModal(false);
      setSelectedPiece(null);
      fetchPieces();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const renderPiece = ({ item }: { item: Piece }) => (
    <TouchableOpacity
      style={styles.pieceCard}
      onPress={() => {
        setSelectedPiece(item);
        setShowStageModal(true);
      }}
    >
      <View style={styles.pieceContent}>
        <Text style={styles.pieceTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.pieceDescription}>{item.description}</Text>
        ) : null}
      </View>
      <ChevronRight size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title.toLowerCase()}</Text>
      </View>
      {section.data.map((piece) => (
        <TouchableOpacity
          key={piece.id}
          style={styles.sectionPieceCard}
          onPress={() => {
            setSelectedPiece(piece);
            setShowStageModal(true);
          }}
        >
          <View style={styles.pieceContent}>
            <Text style={styles.pieceTitle}>{piece.title}</Text>
            {piece.description ? (
              <Text style={styles.pieceDescription}>{piece.description}</Text>
            ) : null}
          </View>
          <ChevronRight size={20} color={colors.textLight} />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.clay} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Current Works</Text>
      </View>

      {pieces.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pieces in progress</Text>
          <Text style={styles.emptySubtext}>Start tracking your first piece</Text>
        </View>
      ) : (
        <SectionList
          sections={getSectionedPieces()}
          renderItem={() => null}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>

      <AddPieceModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPieces}
      />

      <StageModal
        visible={showStageModal}
        piece={selectedPiece}
        onClose={() => {
          setShowStageModal(false);
          setSelectedPiece(null);
        }}
        onUpdateStage={updateStage}
      />
    </SafeAreaView>
  );
}

function AddPieceModal({
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
  const [stage, setStage] = useState('new');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('pieces').insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          stage,
        },
      ]);

      if (error) throw error;

      setTitle('');
      setDescription('');
      setStage('new');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error adding piece:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Piece</Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textSubtle}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>Starting Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageSelector}>
            {STAGES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.stageOption,
                  stage === s.value && styles.stageOptionActive,
                ]}
                onPress={() => setStage(s.value)}
              >
                <Text
                  style={[
                    styles.stageOptionText,
                    stage === s.value && styles.stageOptionTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleSubmit}
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>Add Piece</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StageModal({
  visible,
  piece,
  onClose,
  onUpdateStage,
}: {
  visible: boolean;
  piece: Piece | null;
  onClose: () => void;
  onUpdateStage: (pieceId: string, stage: string) => void;
}) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showCompletePrompt, setShowCompletePrompt] = useState(false);

  useEffect(() => {
    if (piece && visible) {
      fetchPhotos();
    }
  }, [piece, visible]);

  const handleScrap = async () => {
    if (!piece) return;

    try {
      const { error } = await supabase
        .from('pieces')
        .update({ is_graveyard: true })
        .eq('id', piece.id);

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Error scrapping piece:', error);
    }
  };

  const fetchPhotos = async () => {
    if (!piece) return;

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('piece_id', piece.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl.trim() || !piece) return;

    setAddingPhoto(true);
    try {
      const isFirstPhoto = photos.length === 0;

      const { error } = await supabase.from('photos').insert([
        {
          piece_id: piece.id,
          url: photoUrl.trim(),
          is_primary: isFirstPhoto,
        },
      ]);

      if (error) throw error;

      setPhotoUrl('');
      setShowPhotoInput(false);
      fetchPhotos();
    } catch (error) {
      console.error('Error adding photo:', error);
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleStageUpdate = (stage: string) => {
    if (stage === 'completed') {
      setShowCompletePrompt(true);
    } else {
      onUpdateStage(piece!.id, stage);
    }
  };

  const handleCompleteWithPhoto = async () => {
    if (!piece) return;

    if (photoUrl.trim()) {
      setAddingPhoto(true);
      try {
        const isFirstPhoto = photos.length === 0;

        const { error } = await supabase.from('photos').insert([
          {
            piece_id: piece.id,
            url: photoUrl.trim(),
            is_primary: isFirstPhoto,
          },
        ]);

        if (error) throw error;
      } catch (error) {
        console.error('Error adding photo:', error);
      } finally {
        setAddingPhoto(false);
      }
    }

    onUpdateStage(piece.id, 'completed');
    setShowCompletePrompt(false);
    setPhotoUrl('');
  };

  if (!piece) return null;

  const allStages = [...STAGES, { value: 'completed', label: 'Completed' }];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalScrollContent}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{piece.title}</Text>

            {photos.length > 0 && (
              <View style={styles.photosSection}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosList}>
                  {photos.map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.url }}
                      style={styles.photoThumbnail}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {showPhotoInput ? (
              <View style={styles.photoInputSection}>
                <Text style={styles.sectionTitle}>Add Photo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter image URL"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setShowPhotoInput(false);
                      setPhotoUrl('');
                    }}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleAddPhoto}
                    disabled={addingPhoto || !photoUrl.trim()}
                  >
                    {addingPhoto ? (
                      <ActivityIndicator color={colors.surface} />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Add</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addPhotoButton]}
                onPress={() => setShowPhotoInput(true)}
              >
                <Plus size={20} color={colors.clay} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}

            {!showCompletePrompt ? (
              <>
                <Text style={styles.sectionTitle}>Update Stage</Text>
                <View style={styles.stageList}>
                  {allStages.map((s) => (
                    <TouchableOpacity
                      key={s.value}
                      style={[
                        styles.stageListItem,
                        piece.stage === s.value && styles.stageListItemActive,
                      ]}
                      onPress={() => handleStageUpdate(s.value)}
                    >
                      <Text
                        style={[
                          styles.stageListText,
                          piece.stage === s.value && styles.stageListTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, styles.scrapButton, { width: '100%' }]}
                  onPress={handleScrap}
                  activeOpacity={0.7}
                >
                  <Trash2 size={20} color={colors.error} />
                  <Text style={[styles.scrapText, { marginLeft: spacing.sm }]}>Scrap</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, { width: '100%' }]}
                  onPress={onClose}
                >
                  <Text style={styles.modalButtonTextSecondary}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Add a Photo (Optional)</Text>
                <Text style={styles.modalSubtitle}>
                  Add a photo to celebrate completing this piece
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter image URL"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setShowCompletePrompt(false);
                      setPhotoUrl('');
                    }}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleCompleteWithPhoto}
                    disabled={addingPhoto}
                  >
                    {addingPhoto ? (
                      <ActivityIndicator color={colors.surface} />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Complete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  pieceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  pieceContent: {
    flex: 1,
  },
  pieceTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  pieceDescription: {
    ...typography.caption,
  },
  sectionContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionHeaderText: {
    ...typography.heading,
    fontStyle: 'italic',
    color: colors.clay,
  },
  sectionPieceCard: {
    backgroundColor: colors.sand,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.subheading,
    marginBottom: spacing.sm,
    color: colors.textMedium,
  },
  emptySubtext: {
    ...typography.caption,
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
    padding: spacing.xl,
    minHeight: 400,
  },
  modalTitle: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  modalSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
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
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    ...typography.label,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  stageSelector: {
    marginBottom: spacing.xl,
  },
  stageOption: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageOptionActive: {
    backgroundColor: colors.clay,
    borderColor: colors.clay,
  },
  stageOptionText: {
    ...typography.caption,
    color: colors.textMedium,
  },
  stageOptionTextActive: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '500',
  },
  stageList: {
    marginBottom: spacing.lg,
  },
  stageListItem: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageListItemActive: {
    backgroundColor: colors.sand,
    borderColor: colors.clay,
  },
  stageListText: {
    ...typography.body,
  },
  stageListTextActive: {
    ...typography.bodyMedium,
    color: colors.clay,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.clay,
    ...shadows.subtle,
  },
  modalButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonTextPrimary: {
    ...typography.bodyMedium,
    color: colors.surface,
  },
  modalButtonTextSecondary: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  modalScrollContent: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.subheading,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  photosSection: {
    marginBottom: spacing.md,
  },
  photosList: {
    marginBottom: spacing.sm,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.sand,
  },
  photoInputSection: {
    marginBottom: spacing.md,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    padding: spacing.md,
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
  scrapButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scrapText: {
    ...typography.bodyMedium,
    color: colors.error,
  },
});
