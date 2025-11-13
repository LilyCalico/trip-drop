import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { AiFillHome } from "react-icons/ai";
import { FaBed, FaCalendar, FaPlane, FaPlus } from "react-icons/fa";
import Button from "@/components/custom/button/Button";
import { createDateRangeArray } from "@/lib/functions/createDateRangeArray";
import supabase from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";
import type { TripType } from "@/types/fronttype";

const MenuItems = [
  {
    label: "Schedule",
    icon: <FaCalendar />,
    href: "schedule",
  },
  {
    label: "Transport",
    icon: <FaPlane />,
    href: "transport",
  },
  {
    label: "Hotel",
    icon: <FaBed />,
    href: "hotel",
  },
];

const MenuLabel = ({
  icon,
  label,
  href,
  onClick,
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
      className="flex gap-[1rem] cursor-pointer hover:text-gray-500 transition-colors duration-200"
    >
      <div className="text-[1.6rem]">{icon}</div>
      <p className="text-[1.2rem] font-bold">{label}</p>
    </Link>
  );
};

const Menu = ({
  isOpen,
  onClose,
  onLoggedOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLoggedOut: () => void;
}) => {
  const router = useRouter();
  const tripId = router.query.tripId as string | undefined;
  const userEmail = useAuthStore((s) => s.user?.email ?? null);
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
        (value): value is { trip: TripType; start: Date } => value !== null,
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
        Math.abs(b.start.getTime() - now.getTime()),
    )[0].trip;
  }, [trips]);

  const activeTripId = tripId ?? nearestTrip?.id ?? null;
  const activeTrip = trips?.find((trip) => trip.id === activeTripId);

  const tripDates = useMemo(() => {
    if (!trips) return [];
    const activeTrip = trips.find((trip) => trip.id === activeTripId);
    if (!activeTrip?.startAt || !activeTrip?.endAt) {
      return [];
    }
    return createDateRangeArray(activeTrip.startAt, activeTrip.endAt);
  }, [activeTripId, trips]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    onLoggedOut();
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-between",
        "pt-[6rem] lg:pt-[3.2rem] pb-[3.2rem] px-[2.4rem] lg:px-[4.8rem]",
        "w-[26rem] lg:w-[32rem] h-[100vh]",
        "fixed top-0 right-0 lg:left-0 lg:right-auto",
        "z-20",
        "transform transition-transform duration-300 ease-in-out",
        "overflow-y-auto bg-white",
        isOpen
          ? "translate-x-0 pointer-events-auto"
          : "translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto",
      )}
      aria-hidden={!isOpen}
    >
      <div>
        {/* TOP */}
        <div>
          <h1 className="font-bold mb-[1.6rem] text-center">TRIP DROP</h1>
          <div className="flex flex-col gap-[3.2rem] bg-section rounded-[1.6rem] p-[2.4rem]">
            <MenuLabel icon={<AiFillHome />} label="Top" href="/" />
            <MenuLabel icon={<FaPlus />} label="Add Trip" href="/trips/new" />
          </div>
        </div>

        {/* TRIP DETAILS */}
        <div>
          <h1 className="font-bold mt-[4rem] mb-[1.6rem] text-center">
            {activeTrip?.title}
          </h1>

          <div className="flex flex-col gap-[3.2rem] bg-section rounded-[1.6rem] p-[2.4rem]">
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
                      <div className="ml-[3.6rem] mt-[1.2rem] flex flex-col gap-[0.8rem]">
                        {tripDates.map((date) => (
                          <Link
                            key={date}
                            href={`/trips/${activeTripId}/schedule?date=${date}`}
                            onClick={onClose}
                            className="text-[1rem] text-gray-600 hover:text-gray-900 transition-colors duration-200"
                          >
                            {format(new Date(date), "MM/dd (E)")}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-[0.8rem] mt-[1.6rem]">
        {userEmail && <p>{userEmail}</p>}
        <Button
          type="button"
          onClick={handleLogout}
          className="bg-white text-black border border-gray-300 mx-auto"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Menu;
