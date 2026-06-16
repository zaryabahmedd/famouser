// Shared types + Realtime contract for the FAMO user <-> rider delivery flow.
// Both apps must agree on the channel name, broadcast event, and table shapes.

export type DeliveryStatus =
  | 'searching'
  | 'accepted'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  // "Schedule for Later" orders: saved but not yet offered to a rider. The
  // dispatch trigger ignores this status (it only fires on 'searching').
  | 'scheduled';

export type Delivery = {
  id: string;
  user_id: string;
  rider_id: string | null;
  status: DeliveryStatus;
  pickup_address: string | null;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string | null;
  dropoff_lat: number;
  dropoff_lng: number;
  weight: number | null;
  price: number | null;
  // What the user is sending and how it's packaged.
  package_category: string | null;
  package_description: string | null;
  package_size: string | null;
  // Pickup (sender) + drop-off (recipient) contacts and instructions.
  sender_name: string | null;
  sender_phone: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  pickup_notes: string | null;
  dropoff_notes: string | null;
  special_instructions: string | null;
  // How (and proof of) payment, set at order creation and read by the rider app
  // when it arrives at the drop-off location.
  payment_method: 'cod' | 'bank_transfer' | null;
  payment_screenshot_url: string | null;
  // When set, the pickup time the customer booked for a 'scheduled' order.
  scheduled_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

// Fields required to create a new delivery request from the user app.
export type NewDeliveryInput = {
  pickup_address?: string | null;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address?: string | null;
  dropoff_lat: number;
  dropoff_lng: number;
  weight?: number | null;
  price?: number | null;
  package_category?: string | null;
  package_description?: string | null;
  package_size?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  pickup_notes?: string | null;
  dropoff_notes?: string | null;
  special_instructions?: string | null;
  payment_method?: 'cod' | 'bank_transfer' | null;
  payment_screenshot_url?: string | null;
  // Set together for a "Schedule for Later" order: status 'scheduled' keeps it
  // out of rider dispatch until its time.
  status?: DeliveryStatus;
  scheduled_at?: string | null;
};

// ---- Live-chat contract (must match the rider app) ----

// Channel name is per-delivery: `delivery-chat:{delivery_id}`. Subscribe to
// Postgres Changes (INSERT) on `messages` filtered by delivery_id so history
// persists and survives reconnects (unlike the GPS broadcast channel).
export const chatChannelName = (deliveryId: string) => `delivery-chat:${deliveryId}`;

export type ChatSenderRole = 'user' | 'rider';

export type ChatMessage = {
  id: string;
  delivery_id: string;
  // auth.uid() for the customer; the rider's `riders.id` for the rider (riders
  // don't carry a Supabase session, so this is not always an auth user id).
  sender_id: string | null;
  sender_role: ChatSenderRole;
  body: string;
  created_at: string;
};

// ---- Live-tracking Realtime contract (must match the rider app) ----

// Channel name is per-delivery: `delivery-tracking:{delivery_id}`.
export const trackingChannelName = (deliveryId: string) =>
  `delivery-tracking:${deliveryId}`;

// Broadcast event the rider app emits with its position (~every 10s).
export const RIDER_LOCATION_EVENT = 'rider_location';

// A rider position update. The exact payload field names from the rider app
// were not finalized, so the parser below accepts the common variants and
// normalizes them to { lat, lng, heading? }.
export type RiderPosition = {
  lat: number;
  lng: number;
  heading?: number;
};

/**
 * Normalize a broadcast payload into a RiderPosition, tolerating the common
 * field-name variants (lat/latitude, lng/lon/longitude). Returns null if no
 * usable coordinates are present.
 */
export function parseRiderPosition(payload: unknown): RiderPosition | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;

  const lat = firstNumber(p.lat, p.latitude);
  const lng = firstNumber(p.lng, p.lon, p.longitude);
  if (lat === null || lng === null) return null;

  const heading = firstNumber(p.heading, p.bearing, p.course);
  return heading === null ? { lat, lng } : { lat, lng, heading };
}

function firstNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}
