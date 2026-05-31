import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVATAR_URI = 'https://randomuser.me/api/portraits/men/32.jpg';

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

type Field = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad';
};

export function EditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fields, setFields] = useState<Field[]>([
    { key: 'name', label: 'Full name', icon: 'person', value: 'Ahmed Khan' },
    { key: 'email', label: 'Email', icon: 'mail', value: 'ahmed.khan@email.com', keyboard: 'email-address' },
    { key: 'phone', label: 'Phone number', icon: 'phone', value: '+92 300 1234567', keyboard: 'phone-pad' },
    { key: 'city', label: 'City', icon: 'location-city', value: 'Lahore' },
  ]);

  const update = (key: string, value: string) =>
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            <Pressable
              onPress={() =>
                Alert.alert('Change photo', 'Update your profile picture', [
                  { text: 'Take photo' },
                  { text: 'Choose from library' },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
              style={styles.cameraBtn}
              accessibilityRole="button"
              accessibilityLabel="Change photo">
              <MaterialIcons name="photo-camera" size={18} color={COLORS.onPrimaryFixed} />
            </Pressable>
          </View>
          <Text style={styles.changePhoto}>Change photo</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          {fields.map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name={f.icon} size={20} color={COLORS.outline} />
                <TextInput
                  value={f.value}
                  onChangeText={(text) => update(f.key, text)}
                  keyboardType={f.keyboard ?? 'default'}
                  placeholderTextColor={COLORS.outline}
                  style={styles.input}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.save, pressed && styles.savePressed]}
          accessibilityRole="button">
          <Text style={styles.saveText}>Save changes</Text>
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
  changePhoto: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
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
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
});
