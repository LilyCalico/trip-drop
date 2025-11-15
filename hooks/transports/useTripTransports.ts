import axios, { type AxiosError } from "axios";
import { useCallback, useMemo } from "react";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import { useAuthStore } from "@/store/useAuthStore";
import type { Camelize } from "@/types/camelize";
import type { Tables } from "@/types/supabasetype";

type TransportRow = Tables<"transports">;

type TripTransportsData = Camelize<TransportRow>[];

interface TripTransportsResponse {
  transports: TripTransportsData;
}

type TripTransportsErrorBody = {
  error?: string;
};

type TransportsKey = [string, string];

interface UseTripTransportsParams {
  tripId?: string;
  swrConfig?: SWRConfiguration<
    TripTransportsData,
    AxiosError<TripTransportsErrorBody>
  >;
}

interface UseTripTransportsResult {
  transports?: TripTransportsData;
  isLoading: boolean;
  isValidating: boolean;
  error?: AxiosError<TripTransportsErrorBody>;
  mutate: SWRResponse<
    TripTransportsData,
    AxiosError<TripTransportsErrorBody>
  >["mutate"];
}

export const useTripTransports = ({
  tripId,
  swrConfig,
}: UseTripTransportsParams = {}): UseTripTransportsResult => {
  const accessToken = useAuthStore(
    (state) => state.session?.access_token ?? null,
  );

  const baseURL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    [],
  );

  const key = useMemo<TransportsKey | null>(() => {
    if (!tripId || !accessToken) {
      return null;
    }
    const keyValue: TransportsKey = [
      `${baseURL}/trips/${tripId}/transport`,
      accessToken,
    ];
    return keyValue;
  }, [accessToken, baseURL, tripId]);

  const fetchTransports = useCallback(
    async ([url, token]: TransportsKey): Promise<TripTransportsData> => {
      const { data } = await axios.get<TripTransportsResponse>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.transports;
    },
    [],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TripTransportsData,
    AxiosError<TripTransportsErrorBody>
  >(key, fetchTransports, {
    revalidateOnFocus: false,
    ...swrConfig,
  });

  return {
    transports: data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};
