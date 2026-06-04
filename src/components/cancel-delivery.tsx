import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

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
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
};

const REASONS = [
  'Booked by mistake',
  'Rider taking too long',
  'Found a cheaper option',
  'Changed pickup or drop-off',
  'No longer need delivery',
  'Other reason',
];

export function CancelDelivery() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ deliveryId?: string }>();
  const deliveryId = typeof params.deliveryId === 'string' && params.deliveryId ? params.deliveryId : null;
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async () => {
    if (submitting) return;

    // Without a delivery id there is nothing to cancel server-side (e.g. preview
    // mode); just return the user home.
    if (!deliveryId) {
      router.dismissTo('/');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc('user_cancel_delivery', {
      p_delivery_id: deliveryId,
    });
    setSubmitting(false);

    if (error) {
      const message =
        error.message?.includes('cannot_cancel_picked_up')
          ? 'Your package has already been picked up and can no longer be cancelled.'
          : error.message?.includes('cannot_cancel_delivered')
            ? 'This delivery is already complete.'
            : error.message?.includes('cannot_cancel_cancelled')
              ? 'This delivery was already cancelled.'
              : 'We could not cancel your delivery. Please try again.';
      Alert.alert('Unable to cancel', message);
      return;
    }

    // Cancellation confirmed: the backend has ended the session and freed the
    // rider. Return the user to the home screen.
    router.dismissTo('/');
  };

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
          <MaterialIcons name="close" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Cancel delivery</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.warn}>
          <MaterialIcons name="info-outline" size={20} color={COLORS.error} />
          <Text style={styles.warnText}>
            A cancellation fee may apply if your rider has already started the trip.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Why are you cancelling?</Text>

        <View style={styles.reasons}>
          {REASONS.map((r) => {
            const active = selected === r;
            return (
              <Pressable
                key={r}
                onPress={() => setSelected(r)}
                style={[styles.reason, active && styles.reasonActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{r}</Text>
                <MaterialIcons
                  name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={active ? COLORS.primary : COLORS.outline}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Additional details (optional)</Text>
        <View style={styles.noteBox}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Tell us more..."
            placeholderTextColor={COLORS.outline}
            multiline
            style={styles.noteInput}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.keep, pressed && styles.keepPressed]}
          accessibilityRole="button">
          <Text style={styles.keepText}>Keep delivery</Text>
        </Pressable>
        <Pressable
          disabled={!selected || submitting}
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.confirm,
            (!selected || submitting) && styles.confirmDisabled,
            pressed && selected && !submitting && styles.confirmPressed,
          ]}
          accessibilityRole="button">
          {submitting ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <Text style={[styles.confirmText, !selected && styles.confirmTextDisabled]}>
              Cancel delivery
            </Text>
          )}
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
    paddingHorizontal: 16,
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
  warn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.errorContainer,
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onErrorContainer,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 24,
    marginBottom: 12,
  },
  reasons: {
    gap: 10,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  reasonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  reasonTextActive: {
    fontWeight: '700',
  },
  noteBox: {
    minHeight: 100,
    borderRadius: 14,
    padding: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  keep: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  keepPressed: {
    opacity: 0.8,
  },
  keepText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  confirm: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
  },
  confirmDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  confirmPressed: {
    transform: [{ scale: 0.98 }],
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surfaceLowest,
  },
  confirmTextDisabled: {
    color: COLORS.outline,
  },
});
