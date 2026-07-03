import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/use-go-back';
import { useDeliveryRider } from '@/hooks/use-delivery-rider';
import { useDeliveryStatus } from '@/hooks/use-delivery-status';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { base64ToBytes } from '@/lib/base64';
import { BANK_DETAILS } from '@/lib/payment';
import { supabase } from '@/lib/supabase';

import { Avatar } from './avatar';
import { RateDriver } from './rate-driver';

const COLORS = {
  surface: '#ffffff',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  outlineVariant: '#cec6ad',
  primary: '#6d5e00',
  primaryContainer: '#fde047',
  primaryFixedDim: '#e2c62d',
  onPrimaryContainer: '#726300',
};

type SummaryRow = {
  label: string;
  value: string;
  total?: boolean;
};

export function DeliverySuccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goBack = useGoBack();
  const params = useLocalSearchParams<{ deliveryId?: string }>();
  const deliveryId =
    typeof params.deliveryId === 'string' && params.deliveryId ? params.deliveryId : null;
  const { delivery } = useDeliveryStatus(deliveryId);
  const { rider } = useDeliveryRider(deliveryId, delivery?.rider_id);

  // Payment happens only after the delivery is completed: the user transfers
  // the fare to the FAMO bank account and uploads their receipt here. The
  // uploaded URL is written back to the delivery row so admins can confirm it.
  const [uploading, setUploading] = useState(false);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState<string | null>(null);
  const receiptUrl = uploadedReceiptUrl ?? delivery?.payment_screenshot_url ?? null;

  const handleUploadReceipt = async () => {
    if (!deliveryId || uploading) return;
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

    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user?.id;
      if (!userId) {
        Alert.alert('Upload failed', 'You must be signed in to upload a receipt.');
        return;
      }
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const path = `${userId}/receipts/receipt-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(path, base64ToBytes(asset.base64), { contentType: mimeType, upsert: true });
      if (uploadError) {
        Alert.alert('Upload failed', 'Could not upload your receipt. Please try again.');
        return;
      }
      const { data: pub } = supabase.storage.from('payment-receipts').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ payment_screenshot_url: pub.publicUrl })
        .eq('id', deliveryId);
      if (updateError) {
        Alert.alert('Upload failed', 'Could not attach the receipt to your order. Please try again.');
        return;
      }
      setUploadedReceiptUrl(pub.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  // What the rider is identified by, beneath their name (no fake "Prime" tier).
  const riderRole =
    [rider?.vehicle_type, rider?.vehicle_plate].filter(Boolean).join(' · ') || 'Your rider';

  // Real shipment summary from the delivered order (no hardcoded sample rows).
  const summary = [
    delivery?.package_category ? { label: 'Content', value: delivery.package_category } : null,
    delivery?.package_size
      ? { label: 'Size', value: delivery.package_size }
      : delivery?.weight != null
        ? { label: 'Weight', value: `${delivery.weight} kg` }
        : null,
    delivery?.price != null
      ? {
          label: receiptUrl ? 'Total Paid' : 'Total to Pay',
          value: `₦${Math.round(delivery.price).toLocaleString('en-NG')}`,
          total: true,
        }
      : null,
  ].filter(Boolean) as SummaryRow[];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => goBack()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Delivery Status</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert('Options', undefined, [
              {
                text: 'Share',
                onPress: () =>
                  Share.share({ message: 'My FAMO delivery is complete.' }),
              },
              { text: 'Help & support', onPress: () => router.push('/help-support') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="More options">
          <MaterialIcons name="more-vert" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/box.png')}
            style={styles.heroImage}
            contentFit="contain"
          />
          <Text style={styles.heroTitle}>Delivered Successfully</Text>
          <Text style={styles.heroSub}>Your package has been handed over safely.</Text>
        </View>

        {/* Rider section */}
        <View style={styles.card}>
          <View style={styles.riderRow}>
            <Avatar uri={rider?.avatar_url} size={64} style={styles.avatar} />
            <View>
              <Text style={styles.riderName}>{rider?.full_name ?? 'Your rider'}</Text>
              <Text style={styles.riderRole}>{riderRole}</Text>
            </View>
          </View>
          <View style={styles.ratingSection}>
            <RateDriver deliveryId={deliveryId} />
          </View>
        </View>

        {/* Shipment summary */}
        {summary.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.summaryHeading}>Shipment Summary</Text>
          <View style={styles.summaryRows}>
            {summary.map((row) => (
              <View
                key={row.label}
                style={[styles.summaryRow, row.total && styles.summaryRowTotal]}>
                <Text style={[styles.summaryLabel, row.total && styles.summaryLabelTotal]}>
                  {row.label}
                </Text>
                <Text style={[styles.summaryValue, row.total && styles.summaryValueTotal]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
        ) : null}

        {/* Payment: bank transfer made after delivery, with receipt upload */}
        <View style={styles.card}>
          <Text style={styles.summaryHeading}>Complete Your Payment</Text>
          {receiptUrl ? (
            <View style={styles.receiptDone}>
              <MaterialIcons name="check-circle" size={22} color={COLORS.primary} />
              <Text style={styles.receiptDoneText}>
                Receipt uploaded. Our team will confirm your payment shortly.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.payNote}>
                Transfer the total amount to the account below, then upload your payment receipt
                so our team can confirm it.
              </Text>
              <View style={styles.bankRows}>
                {BANK_DETAILS.map((row) => (
                  <View key={row.label} style={styles.bankRow}>
                    <Text style={styles.bankLabel}>{row.label}</Text>
                    <Text style={styles.bankValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={handleUploadReceipt}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  (pressed || uploading) && styles.uploadBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Upload payment receipt">
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.onPrimaryContainer} />
                ) : (
                  <MaterialIcons name="cloud-upload" size={20} color={COLORS.onPrimaryContainer} />
                )}
                <Text style={styles.uploadBtnText}>
                  {uploading ? 'Uploading…' : 'Upload payment receipt'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>BACK TO HOME</Text>
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
    paddingTop: 32,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  heroImage: {
    width: 192,
    height: 192,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 360,
  },
  card: {
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  riderRole: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  ratingSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    gap: 8,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: 12,
  },
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  summaryLabelTotal: {
    fontSize: 14,
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  summaryValueTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  payNote: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurfaceVariant,
  },
  bankRows: {
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
    color: COLORS.onSurfaceVariant,
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  uploadBtnPressed: {
    opacity: 0.85,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  receiptDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptDoneText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurfaceVariant,
  },
  cta: {
    marginTop: 4,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: COLORS.primaryFixedDim,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.onPrimaryContainer,
  },
});
