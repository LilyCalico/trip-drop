import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import CardHotel from "@/components/custom/cards/CardHotel";
import CardSpot from "@/components/custom/cards/CardSpot";
import CardTransport from "@/components/custom/cards/CardTransport";
import PageHeader from "@/components/custom/layout/PageHeader";
import Spinner from "@/components/custom/Spinner";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import { useTripSchedule } from "@/hooks/trips/useTripSchedule";

const DUMMY_TRANSPORT = {
  id: "1234567890",
  name: "ANA",
  departureLocation: "Tokyo",
  arrivalLocation: "Stockholm",
  departureMemo: "Departure Memo",
  arrivalMemo: "Arrival Memo",
  departureDatetime: "2025-10-04T23:00:00+00:00",
  arrivalDatetime: "2025-10-05T01:00:00+00:00",
  departureTimezone: "Europe/Stockholm",
  arrivalTimezone: "Europe/Stockholm",
};

const DUMMY_SPOT = {
  id: "1234567890",
  name: "Sample Hotel Name Super Long Name",
  address: "Sample Address",
  description:
    "Sample Description Description  adadf adsf sd aa aDescription Description Description",
  visitDatetime: "10:00",
  googlePlaceId: "1234567890",
};

const DUMMY_HOTEL = {
  id: "1234567890",
  name: "Sample Hotel Name Super Long Name",
  address: "Sample Address",
  phone: "090-1234-5678",
  notes:
    "Sample Description Description  adadf adsf sd aa aDescription Description Description",
  bookingReference: "1234567890",
  datetimeUtc: "2025-10-04T23:00:00+00:00",
  timezone: "Europe/Stockholm",
  googlePlaceId: "1234567890",
  check: "in" as "in" | "out" | "staying",
};

export default function TripSchedulePage() {
  const router = useRouter();
  const { query } = router;
  const trip = useCurrentTrip();
  const dateStr = useMemo(() => {
    return typeof query.date === "string" ? query.date : "";
  }, [query.date]);

  const availableDates = useMemo<string[]>(() => {
    if (!trip) return [];
    try {
      const interval = eachDayOfInterval({
        start: parseISO(trip.startAt),
        end: parseISO(trip.endAt),
      });
      return interval.map((date) => format(date, "yyyy-MM-dd"));
    } catch (error) {
      console.error("Failed to build schedule date range:", error);
      return [];
    }
  }, [trip]);

  const neighborDates = useMemo(() => {
    if (!dateStr || availableDates.length === 0) return [];
    const currentIndex = availableDates.indexOf(dateStr);
    if (currentIndex === -1) return [];
    return [
      availableDates[currentIndex - 1],
      availableDates[currentIndex + 1],
    ].filter((date): date is string => Boolean(date));
  }, [availableDates, dateStr]);

  const { schedule, isLoading, error } = useTripSchedule({
    tripId: trip?.id,
    date: dateStr || undefined,
    neighborDates,
  });

  const dayLabel = useMemo(() => {
    if (!trip || !dateStr) return "";
    try {
      const dayIndex =
        differenceInCalendarDays(parseISO(dateStr), parseISO(trip.startAt)) + 1;
      return dayIndex > 0 ? `Day ${dayIndex}` : "";
    } catch {
      return "";
    }
  }, [dateStr, trip]);

  useEffect(() => {
    console.log("dayLabel", dayLabel);
  }, [dayLabel]);

  if (!trip) {
    return (
      <div className="flex justify-center py-[4rem]">
        <Spinner />
      </div>
    );
  }

  if (!dateStr) {
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
      <PageHeader
        date={dateStr}
        dayLabel={dayLabel}
        locationLabel={trip.title}
      />

      <div className="px-[2.4rem] py-[3.2rem] space-y-[2.4rem]">
        <div className="flex flex-col gap-[1.2rem] items-center">
          <CardTransport
            id={DUMMY_TRANSPORT.id}
            name={DUMMY_TRANSPORT.name}
            departureLocation={DUMMY_TRANSPORT.departureLocation}
            arrivalLocation={DUMMY_TRANSPORT.arrivalLocation}
            departureDatetime={DUMMY_TRANSPORT.departureDatetime}
            arrivalDatetime={DUMMY_TRANSPORT.arrivalDatetime}
            departureTimezone={DUMMY_TRANSPORT.departureTimezone}
            arrivalTimezone={DUMMY_TRANSPORT.arrivalTimezone}
            departureMemo={DUMMY_TRANSPORT.departureMemo}
            arrivalMemo={DUMMY_TRANSPORT.arrivalMemo}
            departureGooglePlaceId={""}
            arrivalGooglePlaceId={""}
          />

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
          <CardSpot {...DUMMY_SPOT} />
          <CardHotel {...DUMMY_HOTEL} />

          <h1 className="font-bold text-[1.6rem]">Hotels from Supabase</h1>
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
    </>
  );
}
