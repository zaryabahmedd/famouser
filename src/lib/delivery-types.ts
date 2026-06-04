// Shared types + Realtime contract for the FAMO user <-> rider delivery flow.
// Both apps must agree on the channel name, broadcast event, and table shapes.

export type DeliveryStatus =
  | 'searching'
  | 'accepted'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

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
