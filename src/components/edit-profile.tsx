import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { useGoBack } from '@/hooks/use-go-back';
import { useProfile } from '@/hooks/use-profile';

const AVATAR_FALLBACK = 'https://randomuser.me/api/portraits/lego/1.jpg';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  onPrimaryFixed: '#211b00',
};

export function EditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const { profile, loading, latestChangeRequest, requestProfileChange, uploadAvatarFile } =
    useProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  // A photo picked this session but not yet submitted. Held locally so it only
  // previews here — it isn't uploaded or shown app-wide until an admin approves.
  const [pendingAvatar, setPendingAvatar] = useState<{ base64: string; mimeType: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // A change is awaiting admin review.
  const isPending = latestChangeRequest?.status === 'pending';
  // The 30-day window is still active (lock set at the last submission).
  const lockedUntil = profile?.profile_locked_until ? new Date(profile.profile_locked_until) : null;
  const isLocked =
    !!lockedUntil && !Number.isNaN(lockedUntil.getTime()) && lockedUntil.getTime() > Date.now();
  // The previous request was declined by an admin — show why, and let them retry.
  const wasRejected = latestChangeRequest?.status === 'rejected';
  // Editing is blocked while a request is pending or within the 30-day window.
  const editingDisabled = isPending || isLocked || saving || loading;

  // Hydrate the form once the profile loads.
  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? '');
    setPhone(profile.phone_number ?? '');
    setAvatarUri(profile.avatar_url ?? null);
  }, [profile]);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!asset.base64) return;
    // Preview only — defer the actual upload/save until the user taps Save.
    setAvatarUri(asset.uri);
    setPendingAvatar({ base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setSaving(true);

    // Upload the newly picked photo (if any) first, so its URL can be submitted
    // with the change request. The photo only goes live once an admin approves.
    let avatarUrl: string | undefined;
    if (pendingAvatar) {
      const { url, error } = await uploadAvatarFile(pendingAvatar.base64, pendingAvatar.mimeType);
      if (error || !url) {
        setSaving(false);
        Alert.alert('Upload failed', error ?? 'Could not upload your photo. Please try again.');
        return;
      }
      avatarUrl = url;
    }

    const err = await requestProfileChange({
      full_name: name.trim(),
      phone_number: phone.trim(),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    });
    setSaving(false);
    if (err) {
      Alert.alert('Could not submit', err);
      return;
    }
    setPendingAvatar(null);
    Alert.alert(
      'Submitted for approval',
      'Your profile changes have been sent to the admin for review. They will appear once approved.',
      [{ text: 'OK', onPress: () => goBack() }],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => goBack()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Approval / lock status banner */}
        {isPending ? (
          <View style={[styles.banner, styles.bannerPending]}>
            <MaterialIcons name="hourglass-top" size={20} color={COLORS.primary} />
            <Text style={styles.bannerText}>
              Your changes are awaiting admin approval. They will appear once reviewed.
            </Text>
          </View>
        ) : isLocked ? (
          <View style={[styles.banner, styles.bannerLocked]}>
            <MaterialIcons name="lock-clock" size={20} color={COLORS.onSurfaceVariant} />
            <Text style={styles.bannerText}>
              Profile changes are limited to once every 30 days. You can edit again on{' '}
              {lockedUntil?.toLocaleDateString()}.
            </Text>
          </View>
        ) : wasRejected ? (
          <View style={[styles.banner, styles.bannerRejected]}>
            <MaterialIcons name="error-outline" size={20} color="#ba1a1a" />
            <Text style={styles.bannerText}>
              Your last change was declined
              {latestChangeRequest?.rejection_reason
                ? `: ${latestChangeRequest.rejection_reason}`
                : '.'}{' '}
              You can submit a new change below.
            </Text>
          </View>
        ) : null}

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Image
              source={{ uri: avatarUri ?? AVATAR_FALLBACK }}
              style={styles.avatar}
              contentFit="cover"
            />
            {saving && pendingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={COLORS.onPrimaryFixed} />
              </View>
            )}
            <Pressable
              onPress={handlePickPhoto}
              disabled={editingDisabled}
              style={[styles.cameraBtn, editingDisabled && styles.cameraBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Change photo">
              <MaterialIcons name="photo-camera" size={18} color={COLORS.onPrimaryFixed} />
            </Pressable>
          </View>
          <Pressable onPress={handlePickPhoto} disabled={editingDisabled}>
            <Text style={[styles.changePhoto, editingDisabled && styles.changePhotoDisabled]}>
              {pendingAvatar ? 'Photo selected · tap to change' : 'Change photo'}
            </Text>
          </Pressable>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={[styles.inputRow, editingDisabled && styles.inputRowDisabled]}>
              <MaterialIcons name="person" size={20} color={COLORS.outline} />
              <TextInput
                value={name}
                onChangeText={setName}
                editable={!editingDisabled}
                placeholder="Full name"
                placeholderTextColor={COLORS.outline}
                style={[styles.input, editingDisabled && styles.inputDisabled]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputRow, styles.inputRowDisabled]}>
              <MaterialIcons name="mail" size={20} color={COLORS.outline} />
              <TextInput
                value={profile?.email ?? ''}
                editable={false}
                style={[styles.input, styles.inputDisabled]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={[styles.inputRow, editingDisabled && styles.inputRowDisabled]}>
              <MaterialIcons name="phone" size={20} color={COLORS.outline} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                editable={!editingDisabled}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor={COLORS.outline}
                style={[styles.input, editingDisabled && styles.inputDisabled]}
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Save */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleSave}
          disabled={editingDisabled}
          style={({ pressed }) => [
            styles.save,
            editingDisabled && styles.saveDisabled,
            pressed && !editingDisabled && styles.savePressed,
          ]}
          accessibilityRole="button">
          {saving ? (
            <ActivityIndicator color={COLORS.onPrimaryContainer} />
          ) : (
            <Text style={styles.saveText}>
              {isPending ? 'Awaiting approval' : isLocked ? 'Editing locked' : 'Submit for approval'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerPending: {
    backgroundColor: 'rgba(253, 224, 71, 0.18)',
    borderColor: COLORS.primaryContainer,
  },
  bannerLocked: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderColor: COLORS.outlineVariant,
  },
  bannerRejected: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.4)',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurface,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: COLORS.primaryContainer,
    padding: 4,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    margin: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 3,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnDisabled: {
    opacity: 0.5,
  },
  changePhoto: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  changePhotoDisabled: {
    color: COLORS.secondary,
  },
  fields: {
    gap: 18,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  inputRowDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputDisabled: {
    color: COLORS.secondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  save: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePressed: {
    transform: [{ scale: 0.98 }],
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
});
