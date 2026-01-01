import axios, { type AxiosError } from "axios";
import { useCallback, useMemo } from "react";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import { useAuthStore } from "@/store/useAuthStore";
import type { Camelize } from "@/types/camelize";
import type { Tables } from "@/types/supabasetype";

type HotelStayRow = Tables<"hotel_stays">;

type TripHotelsData = Camelize<HotelStayRow>[];

interface TripHotelsResponse {
  hotels: TripHotelsData;
}

type TripHotelsErrorBody = {
  error?: string;
};

type HotelsKey = [string, string];

interface UseTripHotelsParams {
  tripId?: string;
  swrConfig?: SWRConfiguration<TripHotelsData, AxiosError<TripHotelsErrorBody>>;
}

interface UseTripHotelsResult {
  hotels?: TripHotelsData;
  isLoading: boolean;
  isValidating: boolean;
  error?: AxiosError<TripHotelsErrorBody>;
  mutate: SWRResponse<
    TripHotelsData,
    AxiosError<TripHotelsErrorBody>
  >["mutate"];
}

export const useTripHotels = ({
  tripId,
  swrConfig
}: UseTripHotelsParams = {}): UseTripHotelsResult => {
  const accessToken = useAuthStore(
    (state) => state.session?.access_token ?? null
  );

  const baseURL = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL,
    []
  );

  const key = useMemo<HotelsKey | null>(() => {
    if (!tripId || !accessToken) {
      return null;
    }

    const keyValue: HotelsKey = [
      `${baseURL}/trips/${tripId}/hotel`,
      accessToken
    ];
    return keyValue;
  }, [accessToken, baseURL, tripId]);

  const fetchHotels = useCallback(
    async ([url, token]: HotelsKey): Promise<TripHotelsData> => {
      const { data } = await axios.get<TripHotelsResponse>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.hotels;
    },
    []
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TripHotelsData,
    AxiosError<TripHotelsErrorBody>
  >(key, fetchHotels, {
    revalidateOnFocus: false,
    ...swrConfig
  });

  return {
    hotels: data,
    isLoading,
    isValidating,
    error,
    mutate
  };
};
