import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { AiFillHome } from "react-icons/ai";
import { FaBed, FaCalendar, FaPlane, FaPlus } from "react-icons/fa";
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
      className={cn(
        "relative flex items-center gap-[1rem]",
        "px-[1.2rem] py-[0.8rem] rounded-[0.8rem]",
        "cursor-pointer",
        "transition-transform duration-400 ease-in-out",
        "hover:scale-[1.02]",
        "active:scale-[0.98]",
        "group",
        "before:absolute before:inset-0",
        "before:bg-black/5",
        "before:rounded-[0.8rem]",
        "before:origin-left",
        "before:scale-x-0",
        "before:transition-transform before:duration-400 before:ease-in-out",
        "hover:before:scale-x-100",
        "before:-z-10",
      )}
    >
      <div className="relative z-10 text-[1.6rem] transition-colors duration-300">
        {icon}
      </div>
      <p className="relative z-10 text-[1.2rem] font-bold transition-colors duration-300">
        {label}
      </p>
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
        "pt-[6rem] lg:pt-[4rem] pb-[3.2rem] px-[2.4rem] lg:px-[4.8rem]",
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
          <div className="flex flex-col gap-[0.8rem] bg-section rounded-[1.6rem] px-[2.4rem] py-[1.6rem]">
            <MenuLabel icon={<AiFillHome />} label="Top" href="/" />
            <MenuLabel icon={<FaPlus />} label="Add Trip" href="/trips/new" />
          </div>
        </div>

        {/* TRIP DETAILS */}
        <div>
          <h1 className="font-bold mt-[4rem] mb-[1.6rem] text-center">
            {activeTrip?.title}
          </h1>

          <div className="flex flex-col gap-[1.2rem] bg-section rounded-[1.6rem] p-[2.4rem]">
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
                      <div className="ml-[3.6rem] mt-[0.8rem] flex flex-col gap-[0.8rem]">
                        {tripDates.map((date) => (
                          <Link
                            key={date}
                            href={`/trips/${activeTripId}/schedule?date=${date}`}
                            onClick={onClose}
                            className="text-[1rem] text-gray-600 hover:text-gray-900 hover:scale-[1.02] transition-all duration-300"
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

      <div className="flex flex-col justify-center items-center gap-[0.8rem] mt-[1.6rem] text-[1rem]">
        {/* {userEmail && <p>{userEmail}</p>} */}
        <p
          onClick={handleLogout}
          className="cursor-pointer hover:text-gray-400 hover:scale-[1.02] transition-all duration-300"
        >
          Logout
        </p>
      </div>
    </div>
  );
};

export default Menu;
