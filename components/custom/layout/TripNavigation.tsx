import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  AiOutlineCalendar,
  AiOutlineCompass,
  AiOutlineHome,
  AiOutlineSetting
} from "react-icons/ai";
import { createDateRangeArray } from "@/lib/functions/createDateRangeArray";
import { formatLocalDateFromUtc } from "@/lib/functions/formatLocalDateFromUtc";
import { cn } from "@/lib/utils";
import { useTripsStore } from "@/store/useTripsStore";
import type { TripType } from "@/types/fronttype";

const MenuItems = [
  {
    label: "Schedule",
    icon: <AiOutlineCalendar />,
    href: "schedule"
  },
  {
    label: "Transport",
    icon: <AiOutlineCompass />,
    href: "transport"
  },
  {
    label: "Hotel",
    icon: <AiOutlineHome />,
    href: "hotel"
  },
  {
    label: "Setting",
    icon: <AiOutlineSetting />,
    href: "setting"
  }
];

const MenuLabel = ({
  icon,
  label,
  href,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-[1.2rem]",
        "cursor-pointer",
        "hover:text-black/25 transition-all duration-300"
      )}
    >
      <div className="relative z-10 text-[1.6rem] transition-colors duration-300">
        {icon}
      </div>
      <p className="relative z-10 text-[1.2rem] font-bold font-family-primary uppercase tracking-[0.05rem] transition-colors duration-300">
        {label}
      </p>
    </Link>
  );
};

const TripNavigation = ({
  isOpen,
  onClose,
  embedded = false,
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
  className?: string;
}) => {
  const router = useRouter();
  const tripId = router.query.tripId as string | undefined;
  const trips = useTripsStore((s) => s.trips);

  const nearestTrip = useMemo(() => {
    if (!trips || trips.length === 0) {
      return null;
    }

    const now = new Date();
    const parsedTrips = trips
      .map((trip) => {
        const start = new Date(trip.startAt);
        if (Number.isNaN(start.getTime())) {
          return null;
        }
        return { trip, start };
      })
      .filter(
        (value): value is { trip: TripType; start: Date } => value !== null
      );

    if (parsedTrips.length === 0) {
      return null;
    }

    const upcoming = parsedTrips
      .filter(({ start }) => start.getTime() >= now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (upcoming.length > 0) {
      return upcoming[0].trip;
    }

    return parsedTrips.sort(
      (a, b) =>
        Math.abs(a.start.getTime() - now.getTime()) -
        Math.abs(b.start.getTime() - now.getTime())
    )[0].trip;
  }, [trips]);

  const activeTripId = tripId ?? nearestTrip?.id ?? null;

  const tripDates = useMemo(() => {
    if (!trips) return [];
    const activeTrip = trips.find((trip) => trip.id === activeTripId);
    if (!activeTrip?.startAt || !activeTrip?.endAt || !activeTrip?.timeZone) {
      return [];
    }
    const timezone = activeTrip.timeZone ?? "UTC";
    const startDateLocal = formatLocalDateFromUtc(activeTrip.startAt, timezone);
    const endDateLocal = formatLocalDateFromUtc(activeTrip.endAt, timezone);
    if (!startDateLocal || !endDateLocal) {
      return [];
    }
    return createDateRangeArray(startDateLocal, endDateLocal);
  }, [activeTripId, trips]);

  return (
    <div
      className={cn(
        "flex flex-col justify-between",
        embedded
          ? "pt-0 pb-0 px-0 w-full h-auto relative"
          : "pt-[6rem] pb-[3.2rem] px-[2.4rem] lg:p-0 lg:ml-[6rem] lg:mt-[14.2rem] w-[26rem] lg:w-auto lg:shrink-0 h-[100vh] lg:h-auto fixed lg:relative top-0 right-0 lg:top-auto lg:right-auto z-20 transform transition-transform duration-300 ease-in-out overflow-y-auto bg-white",
        !embedded &&
          (isOpen
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto"),
        className
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex flex-col gap-[3.2rem]">
        {MenuItems.map((item) => {
          const baseHref =
            item.label !== "Top" && activeTripId
              ? `/trips/${activeTripId}/${item.href}`
              : `/`;

          return (
            <div key={item.label}>
              <MenuLabel
                icon={item.icon}
                label={item.label}
                href={baseHref}
                onClick={() => {
                  onClose();
                }}
              />
              {item.label === "Schedule" &&
                activeTripId &&
                tripDates.length > 0 && (
                  <div className="ml-[4rem] mt-[1.2rem] space-y-[0.8rem]">
                    {tripDates.map((date) => (
                      <Link
                        key={date}
                        href={`/trips/${activeTripId}/schedule?date=${date}`}
                        onClick={onClose}
                        className="text-[1rem] hover:text-black/25 transition-all duration-300 block"
                      >
                        {format(new Date(date), "MMM d (EEE)")}
                      </Link>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripNavigation;
