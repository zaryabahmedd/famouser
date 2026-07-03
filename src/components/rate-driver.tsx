// "Rate your driver" card for a delivered order. Loads any existing review
// first (one review per delivery, enforced server-side): if the user already
// rated, their stars are shown read-only; otherwise the tappable star picker,
// optional comment, and Submit button appear. All validation happens in the
// submit_delivery_review RPC — its error messages are user-facing.
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    getDeliveryReview,
    submitDeliveryReview,
    type DeliveryReview,
} from '@/hooks/delivery-review';
import { supabase } from '@/lib/supabase';

const COLORS = {
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f6f2f7',
  surfaceContainerHigh: '#eae7eb',
  onSurface: '#1b1b1e',
  onSurfaceVariant: '#4b4734',
  outline: '#7d7761',
  outlineVariant: '#cec6ad',
  primaryContainer: '#fde047',
  onPrimaryContainer: '#726300',
  star: '#fbd103',
  error: '#ba1a1a',
};

function Stars({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange?: (stars: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Pressable
          key={i}
          onPress={onChange ? () => onChange(i + 1) : undefined}
          disabled={!onChange}
          hitSlop={6}
          accessibilityRole={onChange ? 'button' : 'image'}
          accessibilityLabel={onChange ? `Rate ${i + 1} stars` : `${value} star rating`}>
          <MaterialIcons
            name={i < value ? 'star' : 'star-border'}
            size={size}
            color={i < value ? COLORS.star : COLORS.outline}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function RateDriver({ deliveryId }: { deliveryId: string | null }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState<DeliveryReview | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Resolve the logged-in user and any review they already left, so a second
  // visit to this screen never re-offers the form.
  useEffect(() => {
    let active = true;
    if (!deliveryId) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user?.id ?? null;
      if (!active) return;
      setUserId(uid);
      if (uid) {
        const review = await getDeliveryReview(deliveryId, uid);
        if (!active) return;
        setExisting(review);
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [deliveryId]);

  if (!deliveryId || !userId) return null;

  const handleSubmit = async () => {
    if (stars < 1 || submitting || !deliveryId || !userId) return;
    setSubmitting(true);
    setError(null);
    const result = await submitDeliveryReview(deliveryId, userId, stars, comment);
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Rate your driver</Text>

      {checking ? (
        <ActivityIndicator size="small" color={COLORS.onPrimaryContainer} />
      ) : submitted ? (
        <>
          <Stars value={stars} />
          <View style={styles.thanksRow}>
            <MaterialIcons name="check-circle" size={20} color={COLORS.onPrimaryContainer} />
            <Text style={styles.thanksText}>Thanks for rating your driver!</Text>
          </View>
        </>
      ) : existing ? (
        <>
          <Stars value={existing.stars} />
          {existing.comment ? <Text style={styles.existingComment}>{existing.comment}</Text> : null}
          <Text style={styles.existingHint}>You have already reviewed this delivery.</Text>
        </>
      ) : (
        <>
          <Stars value={stars} onChange={setStars} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={COLORS.outline}
            maxLength={500}
            multiline
            style={styles.commentInput}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            onPress={handleSubmit}
            disabled={stars < 1 || submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              (stars < 1 || submitting) && styles.submitBtnDisabled,
              pressed && stars >= 1 && !submitting && styles.submitBtnPressed,
            ]}
            accessibilityRole="button">
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.onPrimaryContainer} />
            ) : (
              <Text style={[styles.submitText, stars < 1 && styles.submitTextDisabled]}>
                Submit review
              </Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
    fontSize: 14,
    color: COLORS.onSurface,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
  },
  submitBtn: {
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimaryContainer,
  },
  submitTextDisabled: {
    color: COLORS.outline,
  },
  thanksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thanksText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  existingComment: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurface,
  },
  existingHint: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
});
