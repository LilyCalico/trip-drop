import {
  differenceInCalendarDays,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/custom/button/Button";
import CardHotel from "@/components/custom/cards/CardHotel";
import CardSpot from "@/components/custom/cards/CardSpot";
import CardTransport from "@/components/custom/cards/CardTransport";
import LayoutTrip from "@/components/custom/layout/LayoutTrip";
import type { SchedulePlace } from "@/components/custom/map/GoogleMap";
import GoogleMap from "@/components/custom/map/GoogleMap";
import ModalAdd from "@/components/custom/modal/ModalAdd";
import Spinner from "@/components/custom/Spinner";
import ScheduleHeaderTouchable from "@/components/custom/trip/ScheduleHeaderTouchable";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import { useTripSchedule } from "@/hooks/trips/useTripSchedule";
import createDateRangeArray from "@/lib/functions/createDateRangeArray";
import { extractSchedulePlaces } from "./lib/extractLagLng";

export default function TripSchedulePage() {
  const router = useRouter();
  const { date, tripId } = router.query as { date: string; tripId: string };
  const trip = useCurrentTrip();
  const [modalOpen, setModalOpen] = useState(false);
  const [mapData, setMapData] = useState<SchedulePlace[]>([]);

  // tripの取得を待って実行
  const availableDates = useMemo(() => {
    if (!trip?.startAt || !trip?.endAt) {
      return [];
    }
    return createDateRangeArray(trip.startAt, trip.endAt);
  }, [trip?.startAt, trip?.endAt]);

  const isDateAllowed = useCallback(
    (targetDate: string) => availableDates.includes(targetDate),
    [availableDates],
  );

  // デフォルト日付を計算（旅程期間中は当日、期間外は旅程初日）
  const defaultDate = useMemo(() => {
    if (!trip?.startAt || !trip?.endAt) {
      return null;
    }
    const today = startOfDay(new Date());
    const startDate = startOfDay(parseISO(trip.startAt));
    const endDate = startOfDay(parseISO(trip.endAt));

    if (isWithinInterval(today, { start: startDate, end: endDate })) {
      // 旅程期間中は当日
      return format(today, "yyyy-MM-dd");
    }
    // 旅程期間外は旅程初日
    return format(startDate, "yyyy-MM-dd");
  }, [trip?.startAt, trip?.endAt]);

  // dateが存在しない場合、デフォルト日付でURLを更新
  useEffect(() => {
    if (!date && defaultDate && tripId && router.isReady) {
      void router.replace(
        {
          pathname: router.pathname,
          query: { tripId, date: defaultDate },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    }
  }, [date, defaultDate, tripId, router]);

  // 実際に使用する日付（dateが存在しない場合はdefaultDateを使用）
  const effectiveDate = date || defaultDate;

  const currentIndex = useMemo(() => {
    if (!effectiveDate) return -1;
    return availableDates.indexOf(effectiveDate);
  }, [availableDates, effectiveDate]);

  const neighborDates =
    currentIndex === -1
      ? []
      : [
          availableDates[currentIndex - 1],
          availableDates[currentIndex + 1],
        ].filter((value): value is string => Boolean(value));

  const { schedule, isLoading, error, mutate } = useTripSchedule({
    tripId: trip?.id,
    date: effectiveDate || undefined,
    neighborDates,
    isDateAllowed,
  });

  useEffect(() => {
    if (!schedule) return;
    const places = extractSchedulePlaces(schedule);
    setMapData(places);
  }, [schedule]);

  const dayLabel = useMemo(() => {
    if (!trip || !effectiveDate) return "";
    try {
      const dayIndex =
        differenceInCalendarDays(
          parseISO(effectiveDate),
          parseISO(trip.startAt),
        ) + 1;
      return dayIndex > 0 ? `Day ${dayIndex}` : "";
    } catch {
      return "";
    }
  }, [effectiveDate, trip]);

  const handleItemDeleted = useCallback(
    (deletedId: string, targetType: "spot" | "transport" | "hotel") => {
      void mutate((current) => {
        if (!current) {
          return current;
        }

        if (targetType === "spot") {
          return {
            ...current,
            spots: current.spots.filter((spot) => spot.id !== deletedId),
            items: current.items.filter((item) => {
              if (item.type !== "spot") {
                return true;
              }
              return item.spot.id !== deletedId;
            }),
          };
        }

        if (targetType === "transport") {
          return {
            ...current,
            transports: current.transports.filter(
              (transport) => transport.id !== deletedId,
            ),
            items: current.items.filter((item) => {
              if (item.type !== "transport") {
                return true;
              }
              return item.transport.id !== deletedId;
            }),
          };
        }

        if (targetType === "hotel") {
          return {
            ...current,
            hotels: current.hotels.filter((hotel) => hotel.id !== deletedId),
            items: current.items.filter((item) => {
              if (item.type !== "hotel") {
                return true;
              }
              return item.hotel.id !== deletedId;
            }),
          };
        }

        return current;
      }, true);
    },
    [mutate],
  );

  const handleItemUpdated = useCallback(() => {
    void mutate();
  }, [mutate]);

  const navigateToDate = useCallback(
    (targetDate: string | null) => {
      if (!targetDate) return;
      if (!tripId) return;
      if (targetDate === effectiveDate) return;

      void router.push(
        {
          pathname: router.pathname,
          query: { tripId, date: targetDate },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [effectiveDate, router, tripId],
  );

  if (!trip) {
    return (
      <div className="flex justify-center py-[4rem]">
        <Spinner />
      </div>
    );
  }

  // デフォルト日付が計算されるまで待つ
  if (!effectiveDate) {
    return (
      <div className="flex justify-center py-[4rem]">
        <Spinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-[4rem]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[2.4rem] py-[3.2rem] space-y-[1.6rem]">
        <h1 className="text-[1.6rem] font-bold text-center text-destructive">
          スケジュールの取得に失敗しました
        </h1>
        <p className="text-center text-[1rem]">
          {error.response?.data?.error ?? error.message}
        </p>
      </div>
    );
  }

  return (
    <LayoutTrip>
      <div className="block lg:hidden">
        <ScheduleHeaderTouchable
          header={{
            date: effectiveDate,
            dayLabel,
            locationLabel: trip.title,
          }}
          navigation={{
            dates: availableDates,
            currentDate: effectiveDate,
            onSelect: (targetDate) => {
              navigateToDate(targetDate);
            },
          }}
          navigateToDate={navigateToDate}
          currentIndex={currentIndex}
          availableDates={availableDates}
        />
      </div>

      <div className="lg:flex lg:justify-between">
        {/* Schedule Items */}
        <div className="px-[2.4rem] lg:px-0 lg:mr-[3.2rem]">
          <div className="py-[3.2rem] lg:pt-0 space-y-[2.4rem]">
            <div className="flex flex-col gap-[1.2rem] items-center">
              {schedule?.items?.map((item, index) => {
                if (item.type === "spot") {
                  const { spot } = item;
                  return (
                    <CardSpot
                      key={`spot-${spot.id}-${index}`}
                      id={spot.id}
                      name={spot.name}
                      address={spot.address ?? undefined}
                      description={spot.description ?? undefined}
                      visitDatetime={spot.visitDatetime ?? ""}
                      timezone={trip.timeZone ?? "UTC"}
                      googlePlaceId={spot.googlePlaceId ?? undefined}
                      onDeleted={handleItemDeleted}
                      onUpdated={handleItemUpdated}
                    />
                  );
                }

                if (item.type === "transport") {
                  const { transport } = item;
                  return (
                    <CardTransport
                      key={`transport-${transport.id}-${index}`}
                      id={transport.id}
                      name={transport.name}
                      departureDatetime={transport.departureDatetime}
                      departureTimezone={transport.departureTimezone}
                      arrivalDatetime={transport.arrivalDatetime}
                      arrivalTimezone={transport.arrivalTimezone}
                      departureLocation={transport.departureLocation}
                      arrivalLocation={transport.arrivalLocation}
                      departureMemo={transport.departureMemo}
                      arrivalMemo={transport.arrivalMemo}
                      bookingReference={transport.bookingReference}
                      departureGooglePlaceId={transport.departureGooglePlaceId}
                      arrivalGooglePlaceId={transport.arrivalGooglePlaceId}
                      onDeleted={handleItemDeleted}
                      onUpdated={handleItemUpdated}
                    />
                  );
                }

                const { hotel, datetimeUtc } = item;
                return (
                  <CardHotel
                    key={`hotel-${hotel.id}-${hotel.check}-${index}`}
                    id={hotel.id}
                    name={hotel.name}
                    address={hotel.address}
                    phone={hotel.phone}
                    notes={hotel.notes}
                    bookingReference={hotel.bookingReference}
                    datetimeUtc={datetimeUtc}
                    timezone={hotel.timezone}
                    googlePlaceId={hotel.googlePlaceId}
                    checkInUtc={hotel.checkInAt}
                    checkOutUtc={hotel.checkOutAt}
                    check={hotel.check}
                    onDeleted={handleItemDeleted}
                    onUpdated={handleItemUpdated}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex justify-center mb-[3.2rem]">
            <Button
              className="flex items-center gap-[0.8rem] w-full max-w-[34.5rem]"
              onClick={() => {
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Items
            </Button>
          </div>
        </div>

        <GoogleMap data={mapData} />
      </div>

      {/* Modal to add spot, hotel, or transport */}
      <ModalAdd
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={"spot"}
        defaultDate={effectiveDate}
      />
    </LayoutTrip>
  );
}
