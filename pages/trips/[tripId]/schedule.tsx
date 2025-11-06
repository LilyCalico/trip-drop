import { differenceInCalendarDays, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import Button from "@/components/custom/button/Button";
import CardHotel from "@/components/custom/cards/CardHotel";
import CardTransport from "@/components/custom/cards/CardTransport";
import ModalAdd from "@/components/custom/modal/ModalAdd";
import Spinner from "@/components/custom/Spinner";
import ScheduleHeaderTouchable from "@/components/custom/trip/ScheduleHeaderTouchable";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import { useTripSchedule } from "@/hooks/trips/useTripSchedule";
import createDateRangeArray from "@/lib/functions/createDateRangeArray";

export default function TripSchedulePage() {
  const router = useRouter();
  const { date, tripId } = router.query as { date: string; tripId: string };
  const trip = useCurrentTrip();
  const [modalOpen, setModalOpen] = useState(false);

  // tripの取得を待って実行
  const availableDates = useMemo(() => {
    if (!trip?.startAt || !trip?.endAt) {
      return [];
    }
    return createDateRangeArray(trip.startAt, trip.endAt);
  }, [trip?.startAt, trip?.endAt]);

  const currentIndex = useMemo(() => {
    if (!date) return -1;
    return availableDates.indexOf(date);
  }, [availableDates, date]);

  const neighborDates =
    currentIndex === -1
      ? []
      : [
          availableDates[currentIndex - 1],
          availableDates[currentIndex + 1],
        ].filter((value): value is string => Boolean(value));

  const { schedule, isLoading, error } = useTripSchedule({
    tripId: trip?.id,
    date: date || undefined,
    neighborDates,
  });

  const dayLabel = useMemo(() => {
    if (!trip || !date) return "";
    try {
      const dayIndex =
        differenceInCalendarDays(parseISO(date), parseISO(trip.startAt)) + 1;
      return dayIndex > 0 ? `Day ${dayIndex}` : "";
    } catch {
      return "";
    }
  }, [date, trip]);

  const navigateToDate = useCallback(
    (targetDate: string | null) => {
      if (!targetDate) return;
      if (!tripId) return;
      if (targetDate === date) return;

      void router.push(
        {
          pathname: router.pathname,
          query: { tripId, date: targetDate },
        },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [date, router, tripId],
  );

  if (!trip) {
    return (
      <div className="flex justify-center py-[4rem]">
        <Spinner />
      </div>
    );
  }

  if (!date) {
    return (
      <div className="px-[2.4rem] py-[3.2rem] space-y-[1.6rem]">
        <h1 className="text-[1.6rem] font-bold text-center">
          表示する日付を選択してください
        </h1>
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
    <>
      <ScheduleHeaderTouchable
        header={{
          date,
          dayLabel,
          locationLabel: trip.title,
        }}
        navigation={{
          dates: availableDates,
          currentDate: date,
          onSelect: (targetDate) => {
            navigateToDate(targetDate);
          },
        }}
        navigateToDate={navigateToDate}
        currentIndex={currentIndex}
        availableDates={availableDates}
      />

      {/* Schedule Items */}
      <div className="px-[2.4rem]">
        <div className="py-[3.2rem] space-y-[2.4rem]">
          <div className="flex flex-col gap-[1.2rem] items-center">
            {schedule?.transports?.map((transport) => {
              return (
                <CardTransport
                  key={transport.id}
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
                  departureGooglePlaceId={transport.departureGooglePlaceId}
                  arrivalGooglePlaceId={transport.arrivalGooglePlaceId}
                />
              );
            })}

            {schedule?.hotels?.map((hotel) => {
              return (
                <CardHotel
                  id={hotel.id}
                  key={hotel.id}
                  name={hotel.name}
                  address={hotel.address}
                  phone={hotel.phone}
                  notes={hotel.notes}
                  bookingReference={hotel.bookingReference}
                  datetimeUtc={
                    hotel.check === "in"
                      ? hotel.checkInAt
                      : hotel.check === "out"
                        ? hotel.checkOutAt
                        : null
                  }
                  timezone={hotel.timezone}
                  googlePlaceId={hotel.googlePlaceId}
                  check={hotel.check}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mb-[3.2rem]">
          <Button
            className="flex items-center gap-[0.8rem] w-full"
            onClick={() => {
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Items
          </Button>
        </div>
      </div>

      {/* Modal to add spot, hotel, or transport */}
      <ModalAdd
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={"spot"}
        tripId={trip.id}
      />
    </>
  );
}
