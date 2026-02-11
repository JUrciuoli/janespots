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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
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
    }));

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

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.kanbanColumn}>
      <View style={styles.kanbanColumnHeader}>
        <Text style={styles.kanbanColumnTitle}>{section.title.toLowerCase()}</Text>
        <View style={styles.kanbanBadge}>
          <Text style={styles.kanbanBadgeText}>{section.data.length}</Text>
        </View>
      </View>
      <View style={styles.kanbanCards}>
        {section.data.length === 0 ? (
          <View style={styles.emptyColumn}>
            <Text style={styles.emptyColumnText}>No pieces</Text>
          </View>
        ) : (
          section.data.map((piece) => (
            <TouchableOpacity
              key={piece.id}
              style={styles.kanbanCard}
              onPress={() => {
                setSelectedPiece(piece);
                setShowStageModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.kanbanCardTitle}>{piece.title}</Text>
              {piece.description ? (
                <Text style={styles.kanbanCardDescription} numberOfLines={2}>
                  {piece.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </View>
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
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

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

  const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('piece-photos')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('piece-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Media library permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    if (!piece) return;

    setAddingPhoto(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(uri);
      if (!uploadedUrl) throw new Error('Failed to upload image');

      const isFirstPhoto = photos.length === 0;

      const { error } = await supabase.from('photos').insert([
        {
          piece_id: piece.id,
          url: uploadedUrl,
          is_primary: isFirstPhoto,
        },
      ]);

      if (error) throw error;

      setShowPhotoInput(false);
      fetchPhotos();
    } catch (error) {
      console.error('Error adding photo:', error);
      alert('Failed to add photo. Please try again.');
    } finally {
      setAddingPhoto(false);
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

  const handleCompleteWithDevicePhoto = async (uri: string) => {
    if (!piece) return;

    setAddingPhoto(true);
    try {
      const uploadedUrl = await uploadImageToSupabase(uri);
      if (uploadedUrl) {
        const isFirstPhoto = photos.length === 0;

        const { error } = await supabase.from('photos').insert([
          {
            piece_id: piece.id,
            url: uploadedUrl,
            is_primary: isFirstPhoto,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error adding photo:', error);
    } finally {
      setAddingPhoto(false);
    }

    onUpdateStage(piece.id, 'completed');
    setShowCompletePrompt(false);
  };

  const handleTakePhotoForComplete = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleCompleteWithDevicePhoto(result.assets[0].uri);
    }
  };

  const handlePickImageForComplete = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Media library permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleCompleteWithDevicePhoto(result.assets[0].uri);
    }
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
                    <TouchableOpacity
                      key={photo.id}
                      onPress={() => setSelectedPhoto(photo)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photoThumbnail}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {showPhotoInput ? (
              <View style={styles.photoInputSection}>
                <Text style={styles.sectionTitle}>Add Photo</Text>
                <View style={styles.photoOptionsRow}>
                  <TouchableOpacity
                    style={styles.photoOptionButton}
                    onPress={handleTakePhoto}
                    disabled={addingPhoto}
                  >
                    <Camera size={24} color={colors.clay} />
                    <Text style={styles.photoOptionText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoOptionButton}
                    onPress={handlePickImage}
                    disabled={addingPhoto}
                  >
                    <ImageIcon size={24} color={colors.clay} />
                    <Text style={styles.photoOptionText}>From Library</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.orDivider}>or</Text>
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
                    disabled={addingPhoto}
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
                      <Text style={styles.modalButtonTextPrimary}>Add URL</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {addingPhoto && (
                  <View style={styles.uploadingIndicator}>
                    <ActivityIndicator color={colors.clay} />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
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
                <View style={styles.photoOptionsRow}>
                  <TouchableOpacity
                    style={styles.photoOptionButton}
                    onPress={handleTakePhotoForComplete}
                    disabled={addingPhoto}
                  >
                    <Camera size={24} color={colors.clay} />
                    <Text style={styles.photoOptionText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoOptionButton}
                    onPress={handlePickImageForComplete}
                    disabled={addingPhoto}
                  >
                    <ImageIcon size={24} color={colors.clay} />
                    <Text style={styles.photoOptionText}>From Library</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.orDivider}>or</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter image URL"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                />
                {addingPhoto && (
                  <View style={styles.uploadingIndicator}>
                    <ActivityIndicator color={colors.clay} />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setShowCompletePrompt(false);
                      setPhotoUrl('');
                    }}
                    disabled={addingPhoto}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleCompleteWithPhoto}
                    disabled={addingPhoto}
                  >
                    <Text style={styles.modalButtonTextPrimary}>
                      {photoUrl.trim() ? 'Complete with URL' : 'Skip & Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      <FullscreenImageModal
        visible={!!selectedPhoto}
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={() => {
          setSelectedPhoto(null);
          fetchPhotos();
        }}
      />
    </Modal>
  );
}

function FullscreenImageModal({
  visible,
  photo,
  onClose,
  onDelete,
}: {
  visible: boolean;
  photo: any;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { width, height } = Dimensions.get('window');

  const handleDelete = async () => {
    if (!photo) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);

      if (error) throw error;

      onDelete();
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.fullscreenOverlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <X size={28} color={colors.surface} />
        </TouchableOpacity>

        <Image
          source={{ uri: photo.url }}
          style={[styles.fullscreenImage, { width, height: height * 0.8 }]}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Trash2 size={20} color={colors.surface} />
              <Text style={styles.deleteButtonText}>Delete Photo</Text>
            </>
          )}
        </TouchableOpacity>
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
  kanbanColumn: {
    marginBottom: spacing.lg,
  },
  kanbanColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  kanbanColumnTitle: {
    ...typography.heading,
    fontStyle: 'italic',
    color: colors.clay,
    fontSize: 20,
  },
  kanbanBadge: {
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    minWidth: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  kanbanBadgeText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.clay,
  },
  kanbanCards: {
    gap: spacing.sm,
  },
  kanbanCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  kanbanCardTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  kanbanCardDescription: {
    ...typography.caption,
    lineHeight: 18,
  },
  emptyColumn: {
    backgroundColor: colors.sand,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyColumnText: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.textSubtle,
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
  photoOptionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoOptionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  photoOptionText: {
    ...typography.caption,
    color: colors.clay,
    fontWeight: '500',
  },
  orDivider: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSubtle,
    marginBottom: spacing.md,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  uploadingText: {
    ...typography.caption,
    color: colors.clay,
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
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadows.medium,
    minWidth: 160,
  },
  deleteButtonText: {
    ...typography.bodyMedium,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
});
