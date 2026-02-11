import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon, RotateCcw } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import SwipeableModal from './SwipeableModal';

interface PhotoCaptureProps {
  visible: boolean;
  onClose: () => void;
  onPhotoAdded: () => void;
  pieceId: string;
}

export default function PhotoCapture({ visible, onClose, onPhotoAdded, pieceId }: PhotoCaptureProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setUploading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (!photo || !photo.base64) {
        throw new Error('Failed to capture photo');
      }

      const filename = `${pieceId}/${Date.now()}.jpg`;
      const base64Data = photo.base64;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('piece-photos')
        .upload(filename, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('piece-photos')
        .getPublicUrl(filename);

      const { error: insertError } = await supabase.from('photos').insert({
        piece_id: pieceId,
        url: urlData.publicUrl,
        is_primary: false,
      });

      if (insertError) throw insertError;

      onPhotoAdded();
      onClose();
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <SwipeableModal visible={visible} animationType="slide" transparent onClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need your permission to use the camera
            </Text>
            <View style={styles.permissionButtons}>
              <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
                <Text style={styles.permissionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.permissionButton, styles.permissionButtonPrimary]}
                onPress={requestPermission}
              >
                <Text style={[styles.permissionButtonText, styles.permissionButtonTextPrimary]}>
                  Grant Permission
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SwipeableModal>
    );
  }

  return (
    <SwipeableModal visible={visible} animationType="slide" onClose={onClose}>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={28} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
              disabled={uploading}
            >
              <RotateCcw size={28} color={colors.surface} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, uploading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.surface} size="large" />
              ) : (
                <View style={styles.captureButtonInner}>
                  <CameraIcon size={32} color={colors.clay} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.flipButton} />
          </View>
        </CameraView>
      </View>
    </SwipeableModal>
  );
}

function decode(base64: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  permissionContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    maxWidth: 400,
    width: '100%',
    ...shadows.medium,
  },
  permissionTitle: {
    ...typography.title,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.textMedium,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  permissionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionButtonPrimary: {
    backgroundColor: colors.clay,
    borderColor: colors.clay,
  },
  permissionButtonText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  permissionButtonTextPrimary: {
    color: colors.surface,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
