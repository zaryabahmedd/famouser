import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGoBack } from '@/hooks/use-go-back';
import { useDraftOrder, type PaymentMethod, type PaymentReceipt } from '@/hooks/use-draft-order';

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

type Method = {
  key: PaymentMethod;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
};

const METHODS: Method[] = [
  {
    key: 'cod',
    icon: 'payments',
    title: 'Cash on delivery',
    subtitle: 'Pay the rider directly when your package arrives',
  },
  {
    key: 'bank',
    icon: 'account-balance',
    title: 'Bank transfer',
    subtitle: 'Transfer to our account and upload your receipt',
  },
];

const BANK_DETAILS = [
  { label: 'Bank name', value: 'Guaranty Trust Bank (GTBank)' },
  { label: 'Account name', value: 'Fast Motion Logistics Ltd' },
  { label: 'Account number', value: '0123456789' },
];

export function PaymentMethods() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack();
  const { paymentMethod, setPaymentMethod, paymentReceipt, setPaymentReceipt } = useDraftOrder();
  const [selected, setSelected] = useState<PaymentMethod>(paymentMethod ?? 'cod');
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(paymentReceipt);

  const handlePickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload your receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setReceipt({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  const canProceed = selected === 'cod' || selected === 'bank';

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
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <MaterialIcons name={m.icon} size={22} color={COLORS.onSurface} />
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
        </View>

        {selected === 'bank' ? (
          <>
            {/* Dummy bank details for the user to transfer to */}
            <Text style={styles.sectionTitle}>Transfer to this account</Text>
            <View style={styles.bankCard}>
              {BANK_DETAILS.map((row) => (
                <View key={row.label} style={styles.bankRow}>
                  <Text style={styles.bankLabel}>{row.label}</Text>
                  <Text style={styles.bankValue}>{row.value}</Text>
                </View>
              ))}
              <Text style={styles.bankNote}>
                Transfer the full order amount to this account, then upload your payment receipt
                below so our team can confirm it.
              </Text>
            </View>

            {/* Receipt upload */}
            <Text style={styles.sectionTitle}>Upload payment receipt (Optional)</Text>
            <Pressable
              onPress={handlePickReceipt}
              style={({ pressed }) => [styles.uploadBox, pressed && styles.uploadBoxPressed]}
              accessibilityRole="button"
              accessibilityLabel="Upload payment receipt">
              {receipt ? (
                <>
                  <Image
                    source={{ uri: receipt.uri }}
                    style={styles.receiptPreview}
                    contentFit="cover"
                  />
                  <Text style={styles.uploadReplaceText}>Tap to choose a different photo</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="cloud-upload" size={32} color={COLORS.outline} />
                  <Text style={styles.uploadTitle}>Tap to upload receipt</Text>
                  <Text style={styles.uploadHint}>PNG or JPG screenshot of your transfer</Text>
                </>
              )}
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {/* Proceed */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => {
            setPaymentMethod(selected);
            setPaymentReceipt(selected === 'bank' ? receipt : null);
            goBack();
          }}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.proceedBtn,
            (pressed || !canProceed) && styles.proceedBtnDisabled,
          ]}
          accessibilityRole="button">
          <Text style={styles.proceedText}>
            Proceed
          </Text>
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
  list: {
    gap: 12,
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
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
    overflow: 'hidden',
  },
  uploadBoxPressed: {
    opacity: 0.85,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  uploadHint: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  receiptPreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  uploadReplaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
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
  proceedBtnDisabled: {
    opacity: 0.5,
  },
  proceedText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
});
