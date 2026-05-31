import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type Address = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  address: string;
  isDefault?: boolean;
};

const ADDRESSES: Address[] = [
  { key: 'home', icon: 'home', label: 'Home', address: 'House 21, Street 4, DHA Phase 5, Lahore', isDefault: true },
  { key: 'work', icon: 'work', label: 'Work', address: 'Office 12, Gulberg III, Main Boulevard, Lahore' },
  { key: 'mom', icon: 'favorite', label: "Mom's House", address: 'Block C, Johar Town, Lahore' },
];

export function SavedAddresses() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Saved addresses</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {ADDRESSES.map((a) => (
          <View key={a.key} style={styles.card}>
            <View style={styles.cardIcon}>
              <MaterialIcons name={a.icon} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardText}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>{a.label}</Text>
                {a.isDefault ? (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>Default</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardAddress}>{a.address}</Text>
            </View>
            <Pressable
              hitSlop={8}
              style={styles.editBtn}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${a.label}`}>
              <MaterialIcons name="edit" size={20} color={COLORS.onSurfaceVariant} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Add */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.push('/address-picker')}
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          accessibilityRole="button">
          <MaterialIcons name="add" size={22} color={COLORS.onPrimaryFixed} />
          <Text style={styles.addText}>Add new address</Text>
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
    paddingTop: 20,
    gap: 14,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  defaultTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  defaultTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  cardAddress: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  add: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
  },
  addPressed: {
    transform: [{ scale: 0.98 }],
  },
  addText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
});
