import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
  surfaceContainer: '#fbf8fc',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#646464',
  outlineVariant: '#f0edf1',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#211b00',
};

const PROMO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBoYSd62FfYy4nnMAo14BlE2Op12m-UiaUoc7wljxFiDMs6mVN0Ru3ohi1Lw8CpEs19oj_02Qn1tOzjeBG0AYYiqQMUMbaDqgEsm1g8jsY2fXw_2boEAQM1JTlzVyVNZYbQwTzmEzpoe8qrwPj4HPOFwR0YIYZnhdtvDkovBhFa4M5Zp9sq0Uqcb_bBgjSzC-8YqT5ypwZDXaR_lrD0oRfV-Nffvj0jDQO3YlQ90XUjNlQkYuBrctFeUYCA8m6DwKkrv-Is4MHKHA';

export function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Pressable
          onPress={() => router.push('/notification-settings')}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Notification settings">
          <MaterialIcons name="more-vert" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Today */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.item}>
          <View style={styles.itemTop}>
            <Text style={styles.itemTitle}>Delivery Update</Text>
            <Text style={styles.itemTime}>2h ago</Text>
          </View>
          <Text style={styles.itemBody}>
            Your package from <Text style={styles.bold}>DHA Phase 5</Text> is out for delivery with{' '}
            <Text style={styles.bold}>Rashid Ahmed</Text>.
          </Text>
          <Pressable
            onPress={() => router.push('/live-tracking')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            accessibilityRole="button">
            <Text style={styles.primaryBtnText}>TRACK LIVE</Text>
          </Pressable>
        </View>

        <View style={[styles.item, styles.itemDivider]}>
          <View style={styles.itemTop}>
            <Text style={styles.itemTitle}>Security Alert</Text>
            <Text style={styles.itemTime}>5h ago</Text>
          </View>
          <Text style={styles.itemBody}>
            New login detected from <Text style={styles.bold}>Lagos, Nigeria</Text>. If this
            wasn&apos;t you, please secure your account immediately.
          </Text>
        </View>

        {/* Yesterday */}
        <View style={[styles.sectionHeader, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>YESTERDAY</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.item}>
          <View style={styles.itemTop}>
            <Text style={styles.itemTitle}>Promotion</Text>
            <Text style={styles.itemTime}>1d ago</Text>
          </View>
          <Text style={styles.itemBody}>
            Get <Text style={styles.bold}>20% off</Text> your next inter-city delivery! Use code{' '}
            <Text style={styles.code}>CITY20</Text>.
          </Text>
          <View style={styles.promoImageWrap}>
            <Image source={{ uri: PROMO_URI }} style={styles.promoImage} contentFit="cover" />
          </View>
        </View>

        {/* End of history */}
        <View style={styles.endWrap}>
          <View style={styles.endLine} />
          <Text style={styles.endText}>END OF HISTORY</Text>
        </View>
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
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 576,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.onSurfaceVariant,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  item: {
    marginBottom: 32,
  },
  itemDivider: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  itemTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  itemBody: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  code: {
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
    backgroundColor: COLORS.primaryContainer,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#fbd600',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.onPrimaryContainer,
  },
  promoImageWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  promoImage: {
    width: '100%',
    height: 180,
  },
  endWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  endLine: {
    width: 48,
    height: 1,
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    marginBottom: 16,
  },
  endText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: 'rgba(100, 100, 100, 0.4)',
  },
});
