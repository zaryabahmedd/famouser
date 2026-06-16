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
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGoBack } from '@/hooks/use-go-back';
import { BottomNav } from '@/components/bottom-nav';
import { useDraftOrder } from '@/hooks/use-draft-order';
import { useProfile } from '@/hooks/use-profile';

const AVATAR_FALLBACK = 'https://randomuser.me/api/portraits/lego/1.jpg';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerHighest: '#e4e1e6',
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

type Category = {
  key: string;
  image: number;
  label: string;
};

const CATEGORIES: Category[] = [
  { key: 'documents', image: require('@/assets/images/documents.png'), label: 'Documents' },
  { key: 'electronics', image: require('@/assets/images/elctronics.png'), label: 'Electronics' },
  { key: 'fragile', image: require('@/assets/images/box.png'), label: 'Fragile Items' },
  { key: 'food', image: require('@/assets/images/food.png'), label: 'Food' },
];

export function Schedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const { category, categoryDescription, setCategory } = useDraftOrder();
  const { profile } = useProfile();
  const [selected, setSelected] = useState<string>(category || 'fragile');
  const [otherText, setOtherText] = useState(categoryDescription);

  const avatarUri = profile?.avatar_url ?? AVATAR_FALLBACK;

  const isOther = selected === 'other';

  const handleNext = () => {
    setCategory(selected, isOther ? otherText.trim() : '');
    router.push('/pickup-address');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => goBack()}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
          </Pressable>
          <Image
            source={require('@/assets/images/FAMO-logo-dark.png')}
            style={styles.brandLogo}
            contentFit="contain"
            accessibilityLabel="FAMO"
          />
        </View>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>What are you sending?</Text>
          <Text style={styles.subtitle}>
            Choose the category that best fits your shipment for precise handling.
          </Text>
        </View>

        {/* Category grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelected(cat.key)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <View style={styles.cardIcon}>
                  <Image
                    source={cat.image}
                    style={styles.cardImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.cardLabel}>{cat.label}</Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && (
                    <MaterialIcons name="check" size={13} color={COLORS.onPrimaryContainer} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Other */}
        <Pressable
          onPress={() => setSelected('other')}
          style={[styles.other, isOther && styles.otherSelected]}
          accessibilityRole="button"
          accessibilityState={{ selected: isOther }}>
          <View style={styles.otherTop}>
            <View style={styles.otherInfo}>
              <Text style={styles.otherTitle}>Others:</Text>
              <Text style={styles.otherDesc}>Something else? Tell us what it is.</Text>
            </View>
            <View style={[styles.radio, isOther && styles.radioSelected]}>
              {isOther && (
                <MaterialIcons name="check" size={13} color={COLORS.onPrimaryContainer} />
              )}
            </View>
          </View>
          <View style={styles.otherField}>
            <Text style={styles.fieldLabel}>Specify package type</Text>
            <TextInput
              value={otherText}
              onChangeText={(text) => {
                setOtherText(text);
                setSelected('other');
              }}
              placeholder="e.g., Musical Instruments, Sporting Goods"
              placeholderTextColor={COLORS.outline}
              style={styles.input}
            />
          </View>
        </Pressable>

        {/* Bottom action */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.next, pressed && styles.nextPressed]}
          accessibilityRole="button">
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </ScrollView>

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 2,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
    color: COLORS.onSurface,
  },
  brandLogo: {
    width: 84,
    height: 30,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    marginBottom: 28,
    gap: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  card: {
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
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  cardPressed: {
    backgroundColor: '#fffdf2',
  },
  cardIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: 64,
    height: 64,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: COLORS.onSurface,
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
  other: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  otherSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  otherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  otherInfo: {
    flex: 1,
    gap: 4,
  },
  otherTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: COLORS.onSurface,
  },
  otherDesc: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  otherField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  next: {
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    marginTop: 12,
  },
  nextPressed: {
    transform: [{ scale: 0.98 }],
  },
  nextText: {
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
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.secondary,
  },
  navLabelActive: {
    color: COLORS.surfaceLowest,
  },
});
