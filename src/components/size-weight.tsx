import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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
import { BottomNav } from '@/components/bottom-nav';
import { useDraftOrder } from '@/hooks/use-draft-order';
import { PACKAGE_SIZE_OPTIONS } from '@/hooks/use-package-pricing';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHighest: '#e4e1e6',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
};

// Package sizes (5/10/15/20 kg) come from the shared pricing module so the
// selector emits exactly the values keyed in `package_pricing` and written to
// `deliveries.package_size`.
const SIZES = PACKAGE_SIZE_OPTIONS;

export function SizeWeight() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const { size: draftSize, weight: draftWeight, specialInstructions, setPackage } = useDraftOrder();
  const [size, setSize] = useState(draftSize);
  const [instructions, setInstructions] = useState(specialInstructions);

  const handleContinue = () => {
    setPackage(size, draftWeight, instructions.trim());
    router.push('/pickup-time');
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
        <Text style={styles.headerTitle}>Size & weight</Text>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <MaterialIcons name="notifications-none" size={24} color={COLORS.onSurface} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        {/* Package visual */}
        <View style={styles.visual}>
          <Image
            source={require('@/assets/images/box.png')}
            style={styles.visualImage}
            contentFit="contain"
          />
        </View>

        {/* Size selector */}
        <View style={styles.sizeGrid}>
          {SIZES.map((item) => {
            const value = String(item.size);
            const isSelected = size === value;
            return (
              <Pressable
                key={value}
                onPress={() => setSize(value)}
                style={[styles.sizeChip, isSelected && styles.sizeChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <Text style={styles.sizeLabel}>{item.label}</Text>
                <Text style={[styles.sizeLimit, isSelected && styles.sizeLimitSelected]}>
                  {item.limit}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Suggested vehicle */}
        <View style={styles.vehicle}>
          <MaterialIcons name="electric-bike" size={24} color={COLORS.primary} />
          <Text style={styles.vehicleText}>
            <Text style={styles.vehicleBold}>Electric Bike</Text>
          </Text>
        </View>

        {/* Special instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Handle with care..."
            placeholderTextColor={COLORS.outline}
            multiline
            numberOfLines={3}
            style={styles.textarea}
            textAlignVertical="top"
          />
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>CONTINUE</Text>
        </Pressable>
      </KeyboardAwareScrollView>

      {/* Bottom navigation */}
      <BottomNav active="orders" />
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHighest,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    width: '75%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  visualImage: {
    width: 176,
    height: 176,
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  sizeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.3)',
    backgroundColor: COLORS.surfaceContainerLow,
    gap: 2,
  },
  sizeChipSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  sizeLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  sizeLimit: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  sizeLimitSelected: {
    color: COLORS.onSurface,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
  },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
    marginBottom: 28,
  },
  vehicleText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  vehicleBold: {
    fontWeight: '700',
  },
  textarea: {
    minHeight: 88,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  cta: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#000000',
  },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  navLabelActive: {
    color: COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
});
