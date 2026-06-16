import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
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
  success: '#1f7a3d',
  successContainer: '#c8f0d4',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

const FILTERS = ['All', 'Payments', 'Top-ups', 'Refunds'];

type TxType = 'payment' | 'topup' | 'refund';

type Transaction = {
  id: string;
  type: TxType;
  title: string;
  subtitle: string;
  amount: string;
  date: string;
};

const TX_META: Record<TxType, { icon: keyof typeof MaterialIcons.glyphMap; bg: string; color: string; sign: string }> = {
  payment: { icon: 'local-shipping', bg: COLORS.surfaceContainerHigh, color: COLORS.onSurface, sign: '-' },
  topup: { icon: 'add-card', bg: COLORS.successContainer, color: COLORS.success, sign: '+' },
  refund: { icon: 'currency-exchange', bg: COLORS.successContainer, color: COLORS.success, sign: '+' },
};

const TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'payment', title: 'Delivery to Gulberg III', subtitle: 'Visa •••• 4242', amount: '₦566', date: 'Today · 10:32 AM' },
  { id: 't2', type: 'topup', title: 'Wallet top-up', subtitle: 'Bank transfer', amount: '₦2,000', date: 'Today · 09:05 AM' },
  { id: 't3', type: 'payment', title: 'Delivery to Lahore Cantt', subtitle: 'Wallet balance', amount: '₦420', date: 'Yesterday · 6:40 PM' },
  { id: 't4', type: 'refund', title: 'Refund · cancelled order', subtitle: 'Order #FAM-29310', amount: '₦380', date: 'May 28 · 2:15 PM' },
  { id: 't5', type: 'payment', title: 'Delivery to Bahria Town', subtitle: 'Mastercard •••• 8821', amount: '₦1,240', date: 'May 26 · 11:00 AM' },
  { id: 't6', type: 'topup', title: 'Wallet top-up', subtitle: 'Visa •••• 4242', amount: '₦5,000', date: 'May 24 · 8:20 AM' },
];

const TYPE_FOR_FILTER: Record<string, TxType> = {
  Payments: 'payment',
  'Top-ups': 'topup',
  Refunds: 'refund',
};

export function Wallet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const [filter, setFilter] = useState('All');

  const list =
    filter === 'All'
      ? TRANSACTIONS
      : TRANSACTIONS.filter((t) => t.type === TYPE_FOR_FILTER[filter]);

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
        <Text style={styles.headerTitle}>Wallet</Text>
        <Pressable
          onPress={() => router.push('/payment-methods')}
          hitSlop={10}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Payment methods">
          <MaterialIcons name="credit-card" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}>
        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet balance</Text>
          <Text style={styles.balanceValue}>₦3,214</Text>
          <View style={styles.balanceActions}>
            <Pressable
              onPress={() => router.push('/add-card')}
              style={({ pressed }) => [styles.balanceBtn, pressed && styles.balanceBtnPressed]}
              accessibilityRole="button">
              <MaterialIcons name="add" size={20} color={COLORS.onPrimaryFixed} />
              <Text style={styles.balanceBtnText}>Top up</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/payment-methods')}
              style={({ pressed }) => [styles.balanceBtnGhost, pressed && styles.balanceBtnPressed]}
              accessibilityRole="button">
              <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.onPrimaryFixed} />
              <Text style={styles.balanceBtnText}>Methods</Text>
            </Pressable>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>
        <View style={styles.list}>
          {list.map((tx) => {
            const meta = TX_META[tx.type];
            return (
              <View key={tx.id} style={styles.tx}>
                <View style={[styles.txIcon, { backgroundColor: meta.bg }]}>
                  <MaterialIcons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={styles.txText}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txSub}>{tx.subtitle} · {tx.date}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    meta.sign === '+' ? styles.txAmountPositive : styles.txAmountNegative,
                  ]}>
                  {meta.sign}{tx.amount}
                </Text>
              </View>
            );
          })}
          {list.length === 0 ? (
            <Text style={styles.empty}>No transactions in this category.</Text>
          ) : null}
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
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: COLORS.primaryContainer,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.onPrimaryFixed,
    marginTop: 6,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  balanceBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceLowest,
  },
  balanceBtnGhost: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  balanceBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  balanceBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimaryFixed,
  },
  filters: {
    gap: 8,
    paddingTop: 20,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  chipActive: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  chipTextActive: {
    color: COLORS.onPrimaryFixed,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  list: {
    gap: 12,
  },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txText: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  txSub: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txAmountPositive: {
    color: COLORS.success,
  },
  txAmountNegative: {
    color: COLORS.onSurface,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.secondary,
    paddingVertical: 24,
  },
});
