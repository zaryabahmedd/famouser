import { MaterialIcons } from '@expo/vector-icons';
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

import { useGoBack } from '@/hooks/use-go-back';
import { BANK_DETAILS } from '@/lib/payment';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  secondary: '#5e5e5e',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
};

// Bank transfer is the only payment method (COD has been removed), so this
// screen is informational: it shows the account to pay into and explains that
// payment happens only after the delivery is completed.
export function PaymentMethods() {
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();

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
        <Text style={styles.headerTitle}>Payment method</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, styles.cardSelected]}>
          <View style={[styles.badge, styles.badgeSelected]}>
            <MaterialIcons name="account-balance" size={22} color={COLORS.onSurface} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Bank transfer</Text>
            <Text style={styles.cardSubtitle}>
              Pay after your delivery is completed and upload your receipt
            </Text>
          </View>
          <View style={styles.check}>
            <MaterialIcons name="check" size={16} color={COLORS.onPrimaryContainer} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Transfer to this account</Text>
        <View style={styles.bankCard}>
          {BANK_DETAILS.map((row) => (
            <View key={row.label} style={styles.bankRow}>
              <Text style={styles.bankLabel}>{row.label}</Text>
              <Text style={styles.bankValue}>{row.value}</Text>
            </View>
          ))}
          <Text style={styles.bankNote}>
            No payment is needed to place your order. Once your delivery is completed, transfer
            the full order amount to this account and upload your payment receipt from the
            delivery screen so our team can confirm it.
          </Text>
        </View>
      </ScrollView>

      {/* Done */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => goBack()}
          style={({ pressed }) => [styles.proceedBtn, pressed && styles.proceedBtnPressed]}
          accessibilityRole="button">
          <Text style={styles.proceedText}>Got it</Text>
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(253, 224, 71, 0.12)',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  badgeSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 28,
    marginBottom: 12,
  },
  bankCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    gap: 12,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bankLabel: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  bankNote: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  proceedBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  proceedBtnPressed: {
    opacity: 0.85,
  },
  proceedText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
});
