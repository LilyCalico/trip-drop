import axios, { type AxiosError } from "axios";
import { useCallback, useMemo } from "react";
import useSWR, {
  type SWRConfiguration,
  type SWRResponse,
  useSWRConfig
} from "swr";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";
import type { Camelize } from "@/types/camelize";
import type { Tables } from "@/types/supabasetype";

type SpotRow = Tables<"spots">;
type TransportRow = Tables<"transports">;
type HotelStayRow = Tables<"hotel_stays">;
type TripSchedulePayload = {
  date: string;
  spots: SpotRow[];
  transports: TransportRow[];
  hotels: (HotelStayRow & { check: "in" | "out" | "staying" })[];
  items: (
    | {
        type: "spot";
        spot: SpotRow;
      }
    | {
        type: "transport";
        transport: TransportRow;
      }
    | {
        type: "hotel";
        hotel: HotelStayRow & { check: "in" | "out" | "staying" };
        datetimeUtc: string | null;
      }
  )[];
};

export type TripScheduleData = Camelize<TripSchedulePayload>;

type ScheduleKey = [string, string, string];

type ScheduleErrorBody = {
  error?: string;
};

interface UseTripScheduleParams {
  tripId?: string;
  date?: string;
  neighborDates?: string[];
  isDateAllowed?: (date: string) => boolean;
  swrConfig?: SWRConfiguration<TripScheduleData, AxiosError<ScheduleErrorBody>>;
}

interface UseTripScheduleResult {
  schedule?: TripScheduleData;
  isLoading: boolean;
  isValidating: boolean;
  error?: AxiosError<ScheduleErrorBody>;
  mutate: SWRResponse<
    TripScheduleData,
    AxiosError<ScheduleErrorBody>
  >["mutate"];
  prefetch: (targetDate: string) => Promise<TripScheduleData | undefined>;
}

const buildScheduleUrl = (tripId: string, baseUrl: string) =>
  `${baseUrl}/trips/${tripId}/schedule`;

export const useTripSchedule = ({
  tripId,
  date,
  neighborDates,
  isDateAllowed,
  swrConfig
}: UseTripScheduleParams): UseTripScheduleResult => {
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);
  const { mutate: mutateGlobal } = useSWRConfig();

  const baseURL = useMemo(getApiBaseUrl, []);

  const key = useMemo<ScheduleKey | null>(() => {
    if (!tripId || !date || !accessToken) {
      return null;
    }
    if (isDateAllowed && !isDateAllowed(date)) {
      return null;
    }
    return [buildScheduleUrl(tripId, baseURL), date, accessToken];
  }, [accessToken, baseURL, date, isDateAllowed, tripId]);

  const fetchSchedule = useCallback(
    async ([
      url,
      targetDate,
      token
    ]: ScheduleKey): Promise<TripScheduleData> => {
      const { data: response } = await axios.get<TripScheduleData>(url, {
        params: { date: targetDate },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    },
    []
  );

  const prefetch = useCallback(
    async (targetDate: string) => {
      if (!tripId || !accessToken || !targetDate) {
        return undefined;
      }
      if (isDateAllowed && !isDateAllowed(targetDate)) {
        return undefined;
      }
      const targetKey: ScheduleKey = [
        buildScheduleUrl(tripId, baseURL),
        targetDate,
        accessToken
      ];

      return mutateGlobal(targetKey, async () => fetchSchedule(targetKey), {
        populateCache: true,
        revalidate: false
      }) as Promise<TripScheduleData | undefined>;
    },
    [accessToken, baseURL, fetchSchedule, isDateAllowed, mutateGlobal, tripId]
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TripScheduleData,
    AxiosError<ScheduleErrorBody>
  >(key, fetchSchedule, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    onSuccess: () => {
      if (!neighborDates?.length) {
        return;
      }

      neighborDates
        .filter((target) => {
          if (!target || target === date) {
            return false;
          }
          if (isDateAllowed && !isDateAllowed(target)) {
            return false;
          }
          return true;
        })
        .forEach((target) => {
          void prefetch(target as string);
        });
    },
    ...swrConfig
  });

  return {
    schedule: data,
    isLoading,
    isValidating,
    error,
    mutate,
    prefetch
  };
};
