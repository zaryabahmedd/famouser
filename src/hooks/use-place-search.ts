// Debounced Google Places autocomplete for an address field. Manages the query
// text, prediction list, and a billing session token; `select` resolves a
// prediction to coordinates via the geo proxy.
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    autocompletePlaces,
    getPlaceDetails,
    newPlacesSession,
    type PlaceLocation,
    type PlacePrediction,
} from '@/lib/geo';

export function usePlaceSearch(initialText = '') {
  const [query, setQuery] = useState(initialText);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const sessionRef = useRef(newPlacesSession());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the current text corresponds to a confirmed selection.
  const selectedRef = useRef(false);

  const onChangeText = useCallback((text: string) => {
    setQuery(text);
    selectedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (text.trim().length < 2) {
      setPredictions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await autocompletePlaces(text, sessionRef.current);
        // Ignore stale results if the user already picked something.
        if (!selectedRef.current) setPredictions(results);
        setUnavailable(false);
      } catch (e) {
        setPredictions([]);
        if (e instanceof Error && e.message === 'maps_not_configured') {
          setUnavailable(true);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const select = useCallback(
    async (prediction: PlacePrediction): Promise<PlaceLocation | null> => {
      selectedRef.current = true;
      setPredictions([]);
      setQuery(prediction.description);
      try {
        const place = await getPlaceDetails(prediction.place_id, sessionRef.current);
        // Start a fresh billing session after a completed lookup.
        sessionRef.current = newPlacesSession();
        setQuery(place.address);
        return place;
      } catch {
        return null;
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setPredictions([]);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { query, setQuery, predictions, loading, unavailable, onChangeText, select, clear };
}
