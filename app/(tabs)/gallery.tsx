import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { X, Edit2, Trash2, Camera } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import PhotoCapture from '@/components/PhotoCapture';
import SwipeableModal from '@/components/SwipeableModal';

interface Piece {
  id: string;
  title: string;
  description: string | null;
  completed_at: string;
}

interface Photo {
  id: string;
  url: string;
  is_primary: boolean;
}

interface PieceWithPhoto extends Piece {
  photos: Photo[];
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - spacing.lg * 2 - spacing.md * 2) / 3;

export default function GalleryScreen() {
  const [pieces, setPieces] = useState<PieceWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState<PieceWithPhoto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchCompletedPieces = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pieces')
        .select(`
          *,
          photos(*)
        `)
        .eq('stage', 'completed')
        .eq('is_graveyard', false)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setPieces(data || []);
    } catch (error) {
      console.error('Error fetching completed pieces:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCompletedPieces();
    }, [fetchCompletedPieces])
  );

  const renderGridItem = ({ item }: { item: PieceWithPhoto }) => {
    const primaryPhoto = item.photos?.find((p) => p.is_primary) || item.photos?.[0];

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          setSelectedPiece(item);
          setShowDetailModal(true);
        }}
      >
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.url }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Text style={styles.gridPlaceholderText}>{item.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Gallery</Text>
      </View>

      {pieces.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No completed pieces yet</Text>
          <Text style={styles.emptySubtext}>Finish a piece to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={pieces}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      <DetailModal
        visible={showDetailModal}
        piece={selectedPiece}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPiece(null);
        }}
        onUpdate={fetchCompletedPieces}
      />
    </SafeAreaView>
  );
}

function DetailModal({
  visible,
  piece,
  onClose,
  onUpdate,
}: {
  visible: boolean;
  piece: PieceWithPhoto | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  if (!piece) return null;

  const handleScrap = async () => {
    try {
      const { error } = await supabase
        .from('pieces')
        .update({ is_graveyard: true })
        .eq('id', piece.id);

      if (error) throw error;

      onClose();
      onUpdate();
    } catch (error) {
      console.error('Error scrapping piece:', error);
    }
  };

  const primaryPhoto = piece.photos?.find((p) => p.is_primary) || piece.photos?.[0];

  const handleEditDate = () => {
    const date = new Date(piece.completed_at);
    const formatted = date.toISOString().split('T')[0];
    setDateInput(formatted);
    setEditingDate(true);
  };

  const handleSaveDate = async () => {
    if (!dateInput) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pieces')
        .update({ completed_at: new Date(dateInput).toISOString() })
        .eq('id', piece.id);

      if (error) throw error;

      setEditingDate(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating date:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SwipeableModal visible={visible} animationType="fade" transparent onClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            {primaryPhoto ? (
              <TouchableOpacity onPress={() => setSelectedPhoto(primaryPhoto)} activeOpacity={0.9}>
                <Image source={{ uri: primaryPhoto.url }} style={styles.detailImage} />
              </TouchableOpacity>
            ) : (
              <View style={styles.detailPlaceholder}>
                <Text style={styles.detailPlaceholderText}>
                  {piece.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => setShowCamera(true)}
              activeOpacity={0.8}
            >
              <Camera size={24} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailInfo}>
            <Text style={styles.detailTitle}>{piece.title}</Text>
            {piece.description ? (
              <Text style={styles.detailDescription}>{piece.description}</Text>
            ) : null}

            {!editingDate ? (
              <TouchableOpacity style={styles.dateRow} onPress={handleEditDate}>
                <Text style={styles.detailDate}>
                  Completed {new Date(piece.completed_at).toLocaleDateString()}
                </Text>
                <Edit2 size={16} color={colors.textLight} />
              </TouchableOpacity>
            ) : (
              <View style={styles.dateEditContainer}>
                <TextInput
                  style={styles.dateInput}
                  value={dateInput}
                  onChangeText={setDateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSubtle}
                />
                <View style={styles.dateButtons}>
                  <TouchableOpacity
                    style={[styles.dateButton, styles.dateButtonSecondary]}
                    onPress={() => setEditingDate(false)}
                  >
                    <Text style={styles.dateButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateButton, styles.dateButtonPrimary]}
                    onPress={handleSaveDate}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.surface} size="small" />
                    ) : (
                      <Text style={styles.dateButtonTextPrimary}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.scrapButton}
              onPress={handleScrap}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={colors.error} />
              <Text style={styles.scrapText}>Scrap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FullscreenImageModal
        visible={!!selectedPhoto}
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={() => {
          setSelectedPhoto(null);
          onUpdate();
          onClose();
        }}
      />

      <PhotoCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onPhotoAdded={() => {
          setShowCamera(false);
          onUpdate();
        }}
        pieceId={piece.id}
      />
    </SwipeableModal>
  );
}

function FullscreenImageModal({
  visible,
  photo,
  onClose,
  onDelete,
}: {
  visible: boolean;
  photo: Photo | null;
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
    <SwipeableModal visible={visible} animationType="fade" transparent onClose={onClose}>
      <View style={styles.fullscreenOverlay}>
        <TouchableOpacity style={styles.fullscreenCloseButton} onPress={onClose} activeOpacity={0.8}>
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
    </SwipeableModal>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.title,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.subtle,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPlaceholderText: {
    ...typography.display,
    color: colors.clay,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMedium,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  imageContainer: {
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.clay,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  detailPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailPlaceholderText: {
    ...typography.display,
    fontSize: 72,
    color: colors.clay,
  },
  detailInfo: {
    padding: spacing.lg,
  },
  detailTitle: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  detailDescription: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  detailDate: {
    ...typography.caption,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateEditContainer: {
    marginTop: spacing.sm,
  },
  dateInput: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dateButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  dateButtonPrimary: {
    backgroundColor: colors.clay,
  },
  dateButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonTextPrimary: {
    ...typography.bodyMedium,
    color: colors.surface,
  },
  dateButtonTextSecondary: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  scrapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.sm,
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
  fullscreenCloseButton: {
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
