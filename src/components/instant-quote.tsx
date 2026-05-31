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

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainer: '#f0edf1',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
};

type Category = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

const CATEGORIES: Category[] = [
  { key: 'document', icon: 'description', label: 'Document' },
  { key: 'electronics', icon: 'devices', label: 'Electronics' },
  { key: 'fragile', icon: 'egg-alt', label: 'Fragile' },
  { key: 'food', icon: 'lunch-dining', label: 'Food' },
];

type Size = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  desc: string;
};

const SIZES: Size[] = [
  { key: 'S', icon: 'inbox',       label: 'Small',       desc: 'Envelope / bag' },
  { key: 'M', icon: 'inventory',   label: 'Medium',      desc: 'Shoebox size'   },
  { key: 'L', icon: 'inventory-2', label: 'Large',       desc: 'Moving box'     },
  { key: 'XL', icon: 'widgets',   label: 'Extra Large', desc: 'Bulk / bulky'   },
];

export function InstantQuote() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [category, setCategory] = useState('electronics');
  const [size, setSize] = useState('M');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Get instant quote</Text>
        </View>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.brandLogo}
          contentFit="contain"
          accessibilityLabel="FAMO"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Pickup / Drop-off */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>PICKUP</Text>
          <View style={styles.input}>
            <MaterialIcons name="location-on" size={20} color={COLORS.outline} />
            <Text style={styles.inputValue}>Victoria Island, Lagos</Text>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DROP-OFF</Text>
          <View style={styles.input}>
            <MaterialIcons name="location-on" size={20} color={COLORS.outline} />
            <Text style={styles.inputValue}>Ikeja City Mall, Lagos</Text>
          </View>
        </View>

        {/* Package type */}
        <Text style={styles.sectionTitle}>PACKAGE TYPE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeScroller}>
          {CATEGORIES.map((c) => {
            const isSelected = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <MaterialIcons
                  name={c.icon}
                  size={28}
                  color={isSelected ? COLORS.onPrimaryContainer : COLORS.onSurface}
                />
                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Package size */}
        <Text style={styles.sectionTitle}>PACKAGE SIZE</Text>
        <View style={styles.sizeGrid}>
          {SIZES.map((s) => {
            const isSelected = size === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSize(s.key)}
                style={({ pressed }) => [
                  styles.sizeCard,
                  isSelected && styles.sizeCardSelected,
                  pressed && styles.sizeCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <View style={styles.sizeIcon}>
                  <MaterialIcons
                    name={s.icon}
                    size={36}
                    color={isSelected ? COLORS.onPrimaryContainer : COLORS.onSurface}
                  />
                </View>
                <Text style={[styles.sizeLabel, isSelected && styles.sizeLabelSelected]}>
                  {s.label}
                </Text>
                <Text style={styles.sizeDesc}>{s.desc}</Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <MaterialIcons name="check" size={13} color={COLORS.onPrimaryContainer} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Pricing card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>ESTIMATED TOTAL</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₦</Text>
            <Text style={styles.priceValue}>2,450</Text>
          </View>
          <View style={styles.priceMeta}>
            <View style={styles.priceMetaItem}>
              <MaterialIcons name="straighten" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.priceMetaText}>12.4 km</Text>
            </View>
            <View style={styles.priceDot} />
            <View style={styles.priceMetaItem}>
              <MaterialIcons name="schedule" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.priceMetaText}>~32 min</Text>
            </View>
          </View>
          <View style={styles.priceTag}>
            <MaterialIcons name="electric-moped" size={18} color={COLORS.primary} />
            <Text style={styles.priceTagText}>Electric Express Delivery</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.push('/schedule')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Book this delivery</Text>
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.onPrimaryContainer} />
        </Pressable>
      </ScrollView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  brandLogo: {
    width: 84,
    height: 30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 512,
    width: '100%',
    alignSelf: 'center',
  },
  field: {
    gap: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.secondary,
    paddingHorizontal: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.5)',
    backgroundColor: COLORS.surfaceLowest,
  },
  inputValue: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.onSurface,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  typeScroller: {
    gap: 12,
    paddingBottom: 8,
  },
  typeCard: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.5)',
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeCardSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  typeLabelSelected: {
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  sizeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  sizeCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  sizeCardPressed: {
    backgroundColor: '#fffdf2',
  },
  sizeIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  sizeLabelSelected: {
    color: COLORS.onPrimaryContainer,
    fontWeight: '700',
  },
  sizeDesc: {
    fontSize: 11,
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primary,
  },
  priceCard: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.3)',
    backgroundColor: 'rgba(246, 242, 247, 0.5)',
    alignItems: 'center',
    gap: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.secondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceCurrency: {
    fontSize: 30,
    fontWeight: '500',
    color: COLORS.secondary,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.onSurface,
  },
  priceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  priceDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.outlineVariant,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(206, 198, 173, 0.2)',
    backgroundColor: COLORS.surfaceLowest,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  cta: {
    marginTop: 32,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
});
