// Client wrappers for the FAMO backend's `geo` proxy, which talks to Google
// Maps web-service APIs (Places Autocomplete, Place Details, Directions). The
// API key lives on the backend, so nothing sensitive ships here.
import { supabase } from '@/lib/supabase';

export type PlacePrediction = {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
};

export type PlaceLocation = {
  address: string;
  lat: number;
  lng: number;
};

export type RouteInfo = {
  distance_meters: number;
  duration_seconds: number;
  polyline: string | null;
};

// Optional ISO country code (e.g. 'ng') to bias autocomplete results.
const COUNTRY: string | undefined = process.env.EXPO_PUBLIC_PLACES_COUNTRY;

// Base URL of the Node.js backend (e.g. https://famo-backend.onrender.com).
const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

async function callGeo<T>(body: Record<string, unknown>): Promise<T> {
  if (!BACKEND_URL) throw new Error('backend_not_configured');

  // The backend requires a signed-in user (verifies this Supabase access token).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${BACKEND_URL}/geo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error ?? `geo_request_failed_${res.status}`);
  }
  return data as T;
}

/**
 * Generate an opaque session token to group an autocomplete "session"
 * (several keystrokes + one details lookup) for Google billing.
 */
export function newPlacesSession(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function autocompletePlaces(
  input: string,
  session: string,
): Promise<PlacePrediction[]> {
  const data = await callGeo<{ predictions: PlacePrediction[] }>({
    action: 'autocomplete',
    input,
    session,
    ...(COUNTRY ? { country: COUNTRY } : {}),
  });
  return data.predictions ?? [];
}

export async function getPlaceDetails(
  placeId: string,
  session: string,
): Promise<PlaceLocation> {
  const data = await callGeo<{ place: PlaceLocation }>({
    action: 'details',
    place_id: placeId,
    session,
  });
  return data.place;
}

export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteInfo> {
  const data = await callGeo<{ route: RouteInfo }>({
    action: 'directions',
    origin,
    destination,
  });
  return data.route;
}

// ---- Fare estimate ----------------------------------------------------------

export const FARE = {
  base: 150, // flat base fare
  perKm: 35, // per kilometer
  perKg: 10, // per kilogram
};

/**
 * Compute a fare estimate from the route distance and package weight.
 * Returns a whole-number price in the app's currency.
 */
export function estimateFare(distanceMeters: number, weightKg: number): number {
  const km = distanceMeters / 1000;
  const price = FARE.base + km * FARE.perKm + weightKg * FARE.perKg;
  return Math.round(price);
}

/**
 * Straight-line (haversine) distance in meters between two coordinates.
 * Used as a fallback when the directions service is unavailable.
 */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

