// Client for the live "rate your driver" review RPCs (SECURITY DEFINER, all
// validation server-side). Never compute rating averages client-side — always
// read them from get_rider_reviews so this app and the driver app agree.
import { supabase } from '@/lib/supabase';

// The review row returned by get_delivery_review (JSON, or null when the
// delivery hasn't been reviewed yet).
export type DeliveryReview = {
  stars: number;
  comment: string | null;
  created_at?: string;
};

// Collective rating summary for a rider, as returned by get_rider_reviews.
export type RiderReviewSummary = {
  average: number;
  count: number;
  breakdown: Record<string, number>;
  reviews: { stars: number; comment: string | null; created_at?: string }[];
};

/** The signed-in customer's review of one delivery, or null if not reviewed. */
export async function getDeliveryReview(
  deliveryId: string,
  userId: string,
): Promise<DeliveryReview | null> {
  const { data, error } = await supabase.rpc('get_delivery_review', {
    p_delivery_id: deliveryId,
    p_user_id: userId,
  });
  if (error || data == null) return null;
  const row = data as Partial<DeliveryReview>;
  if (typeof row.stars !== 'number') return null;
  return { stars: row.stars, comment: row.comment ?? null, created_at: row.created_at };
}

/**
 * Saves the customer's driver review for a delivered order. The DB enforces
 * ownership, delivered status, star range, and one-review-per-delivery; its
 * error messages are user-facing, so surface them as-is.
 */
export async function submitDeliveryReview(
  deliveryId: string,
  userId: string,
  stars: number,
  comment?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = comment?.trim() || null;
  const { error } = await supabase.rpc('submit_delivery_review', {
    p_delivery_id: deliveryId,
    p_user_id: userId,
    p_stars: stars,
    p_comment: trimmed,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** The driver's collective rating (what the driver app also shows). */
export async function getRiderReviews(riderId: string): Promise<RiderReviewSummary | null> {
  const { data, error } = await supabase.rpc('get_rider_reviews', { p_rider_id: riderId });
  if (error || data == null) return null;
  return data as RiderReviewSummary;
}
