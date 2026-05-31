import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHigh: '#eae7eb',
  surfaceContainerHighest: '#e4e1e6',
  surfaceDim: '#dcd9dd',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  onPrimary: '#ffffff',
};

const AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCriDfFx-vxCPc-BDu-vC6OjNMOEL4x4eZpTMtd9Y_3DyKUCeu6U66t6l_4l-Tch5T7nqj11SCIhFsGZBGQAUvwztRMY56R0lIpcpASkYTJZxUTrTgYAG0mJ1XmJ7wZBCxdF3esqNXsqVAyRU__s-mmv18wafgZblZm14H7_MZ4aVTSRzi9Q_zBy_i0mFZHdglkZ1EJV7p_FM94XrTteIGofsE922hrtIrsmPPkKeCvnUp-WZLSoWkumo5Q-BqERje1-Ig0RiC2bQ';

const SECURE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDW0zNHNA9gzm4J5YT3jsbeLmUehW_QPQ0F3eLGjvzc47tSjW4qFhyq5S3LmkAquTVn2eqi2vY4sDVmdJ2gp7jF0Qt15HcXhzpz20Ci46nDegAWOMI9nxXspGUbjJ2odJ-yHoInOoaHYGvIXKN1CQI53rub00XYyhB4y9z8Q2V4_irCk9j4ljZITV1z8sVC9HDk7VCUmthbD5qXupzLRMPHTwNCl1JXaXJNm-WlpIGFbB-kWYuky-YdiUScinHs4G6iP_0cFpn0Tw';

type Method = {
  key: string;
  badge: string;
  badgeColor?: string;
  badgeIcon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
};

const METHODS: Method[] = [
  { key: 'visa', badge: 'VISA', badgeColor: '#1434CB', title: '•••• 4242', subtitle: 'Expires 09/27' },
  { key: 'mc', badge: 'MC', badgeColor: '#EB001B', title: '•••• 8821', subtitle: 'Expires 04/26' },
  { key: 'jazz', badge: 'JZ', title: 'JazzCash', subtitle: '+92 300 1234567' },
  { key: 'cod', badge: '', badgeIcon: 'payments', title: 'Cash on delivery', subtitle: 'Pay rider directly' },
];

export function PaymentMethods() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState('visa');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment methods</Text>
        <View style={styles.avatar}>
          <Image source={{ uri: AVATAR_URI }} style={styles.avatarImage} contentFit="cover" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Payment list */}
        <View style={styles.list}>
          {METHODS.map((m) => {
            const isSelected = selected === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setSelected(m.key)}
                style={[styles.card, isSelected && styles.cardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <View style={[styles.badge, isSelected ? styles.badgeSelected : styles.badgeDefault]}>
                  {m.badgeIcon ? (
                    <MaterialIcons name={m.badgeIcon} size={22} color={COLORS.onSurface} />
                  ) : (
                    <Text style={[styles.badgeText, m.badgeColor ? { color: m.badgeColor } : null]}>
                      {m.badge}
                    </Text>
                  )}
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{m.title}</Text>
                  <Text style={styles.cardSubtitle}>{m.subtitle}</Text>
                </View>
                {isSelected ? (
                  <View style={styles.check}>
                    <MaterialIcons name="check" size={16} color={COLORS.onPrimaryContainer} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}

          {/* Add new card */}
          <Pressable
            onPress={() => router.push('/add-card')}
            style={({ pressed }) => [styles.addCard, pressed && styles.addCardPressed]}
            accessibilityRole="button">
            <Text style={styles.addCardText}>+ Add new card</Text>
          </Pressable>
        </View>

        {/* Secure transactions */}
        <View style={styles.secureSection}>
          <Text style={styles.secureTitle}>Secure Transactions</Text>
          <View style={styles.secureImageWrap}>
            <Image source={{ uri: SECURE_URI }} style={styles.secureImage} contentFit="cover" />
          </View>
          <Text style={styles.secureBody}>
            Your payment security is our priority. All transactions are encrypted and processed
            through our high-speed global logistics network for maximum reliability.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <BottomNav active="profile" />
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  list: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  cardSelected: {
    backgroundColor: '#EBE7F7',
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  badge: {
    width: 48,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  badgeDefault: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  badgeSelected: {
    backgroundColor: COLORS.surfaceLowest,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 1,
    borderColor: COLORS.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryContainer,
    backgroundColor: 'rgba(253, 224, 71, 0.1)',
  },
  addCardPressed: {
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  secureSection: {
    marginTop: 48,
    gap: 16,
  },
  secureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  secureImageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  secureImage: {
    width: '100%',
    height: '100%',
  },
  secureBody: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
  },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  navLabelActive: {
    color: COLORS.onPrimary,
  },
});
