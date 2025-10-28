import axios from "axios";
import { useCallback, useState } from "react";

export interface GooglePlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface UseGooglePlaceDetailsResult {
  getDetails: (placeId: string) => Promise<GooglePlaceDetailsResult | null>;
  loading: boolean;
  error: string | null;
}

export const useGooglePlaceDetails = (): UseGooglePlaceDetailsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDetails = useCallback(async (placeId: string) => {
    if (!placeId) return null;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{ result?: GooglePlaceDetailsResult }>(
        "/api/google/details",
        { params: { place_id: placeId } },
      );
      return data.result ?? null;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      // eslint-disable-next-line no-console
      console.error("useGooglePlaceDetails error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getDetails, loading, error };
};
