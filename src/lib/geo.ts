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

// Public Google Maps key shipped with the app (native SDK + web-service
// fallback). Used to talk to Google directly when the backend proxy is not
// reachable (e.g. a physical device pointed at a localhost backend).
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Abort a backend request that takes too long so we can fall back to Google
// before the user notices (an unreachable localhost backend would otherwise
// hang until the OS timeout).
const BACKEND_TIMEOUT_MS = 3500;

async function callGeo<T>(body: Record<string, unknown>): Promise<T> {
  if (!BACKEND_URL) throw new Error('backend_not_configured');

  // The backend requires a signed-in user (verifies this Supabase access token).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/geo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error ?? `geo_request_failed_${res.status}`);
  }
  return data as T;
}

// ---- Direct Google web-service calls (backend fallback) ---------------------

function googleUrl(path: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams({ key: GOOGLE_KEY ?? '' });
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') qs.append(k, v);
  }
  return `https://maps.googleapis.com/maps/api/${path}?${qs.toString()}`;
}

async function googleAutocomplete(input: string, session: string): Promise<PlacePrediction[]> {
  const res = await fetch(
    googleUrl('place/autocomplete/json', {
      input,
      sessiontoken: session,
      components: COUNTRY ? `country:${COUNTRY}` : undefined,
    }),
  );
  const data = await res.json().catch(() => null);
  if (!data || (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) {
    throw new Error(data?.status ?? 'google_request_failed');
  }
  return (data.predictions ?? []).map((p: any) => ({
    place_id: p.place_id,
    description: p.description,
    main_text: p.structured_formatting?.main_text ?? p.description,
    secondary_text: p.structured_formatting?.secondary_text ?? '',
  }));
}

async function googleDetails(placeId: string, session: string): Promise<PlaceLocation> {
  const res = await fetch(
    googleUrl('place/details/json', {
      place_id: placeId,
      sessiontoken: session,
      fields: 'formatted_address,geometry',
    }),
  );
  const data = await res.json().catch(() => null);
  if (!data || data.status !== 'OK') {
    throw new Error(data?.status ?? 'google_request_failed');
  }
  const loc = data.result?.geometry?.location;
  return {
    address: data.result?.formatted_address ?? '',
    lat: loc?.lat,
    lng: loc?.lng,
  };
}

async function googleDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteInfo> {
  const res = await fetch(
    googleUrl('directions/json', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
    }),
  );
  const data = await res.json().catch(() => null);
  if (!data || data.status !== 'OK' || !data.routes?.length) {
    throw new Error(data?.status ?? 'google_request_failed');
  }
  const route = data.routes[0];
  const leg = route.legs?.[0];
  return {
    distance_meters: leg?.distance?.value ?? 0,
    duration_seconds: leg?.duration?.value ?? 0,
    polyline: route.overview_polyline?.points ?? null,
  };
}

async function googleGeocode(query: string): Promise<PlaceLocation> {
  const res = await fetch(
    googleUrl('geocode/json', {
      address: query,
      components: COUNTRY ? `country:${COUNTRY}` : undefined,
    }),
  );
  const data = await res.json().catch(() => null);
  if (!data || data.status !== 'OK' || !data.results?.length) {
    throw new Error(data?.status ?? 'google_request_failed');
  }
  const top = data.results[0];
  return {
    address: top.formatted_address ?? query,
    lat: top.geometry?.location?.lat,
    lng: top.geometry?.location?.lng,
  };
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
  if (BACKEND_URL) {
    try {
      const data = await callGeo<{ predictions: PlacePrediction[] }>({
        action: 'autocomplete',
        input,
        session,
        ...(COUNTRY ? { country: COUNTRY } : {}),
      });
      return data.predictions ?? [];
    } catch (err) {
      if (!GOOGLE_KEY) throw err;
      // Backend unreachable/failed: fall back to a direct Google call.
    }
  }
  if (GOOGLE_KEY) return googleAutocomplete(input, session);
  throw new Error('backend_not_configured');
}

export async function getPlaceDetails(
  placeId: string,
  session: string,
): Promise<PlaceLocation> {
  if (BACKEND_URL) {
    try {
      const data = await callGeo<{ place: PlaceLocation }>({
        action: 'details',
        place_id: placeId,
        session,
      });
      return data.place;
    } catch (err) {
      if (!GOOGLE_KEY) throw err;
    }
  }
  if (GOOGLE_KEY) return googleDetails(placeId, session);
  throw new Error('backend_not_configured');
}

/**
 * Resolve a free-text address/city string straight to coordinates so the map can
 * pan to it without the user tapping a suggestion. Uses the backend `geocode`
 * action when available, otherwise Google's Geocoding API directly.
 */
export async function geocodeAddress(query: string): Promise<PlaceLocation> {
  if (BACKEND_URL) {
    try {
      const data = await callGeo<{ place: PlaceLocation }>({ action: 'geocode', query });
      if (data.place) return data.place;
    } catch (err) {
      if (!GOOGLE_KEY) throw err;
    }
  }
  if (GOOGLE_KEY) return googleGeocode(query);
  throw new Error('backend_not_configured');
}

export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteInfo> {
  if (BACKEND_URL) {
    try {
      const data = await callGeo<{ route: RouteInfo }>({
        action: 'directions',
        origin,
        destination,
      });
      return data.route;
    } catch (err) {
      if (!GOOGLE_KEY) throw err;
      // Backend unreachable/failed: fall back to a direct Google call.
    }
  }
  if (GOOGLE_KEY) return googleDirections(origin, destination);
  throw new Error('backend_not_configured');
}

/**
 * Decode a Google "encoded polyline" string into an array of lat/lng points so
 * it can be drawn on a map. Returns an empty array for an empty/invalid string.
 * See https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string | null | undefined): { latitude: number; longitude: number }[] {
  if (!encoded) return [];
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

// ---- Fare estimate ----------------------------------------------------------

export const FARE = {
  base: 150, // flat base fare
  perKm: 180, // per kilometer
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

