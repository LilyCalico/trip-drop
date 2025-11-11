import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { AiFillHome } from "react-icons/ai";
import { FaBed, FaCalendar, FaPlane } from "react-icons/fa";
import Button from "@/components/custom/button/Button";
import { createDateRangeArray } from "@/lib/functions/createDateRangeArray";
import supabase from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";
import type { TripType } from "@/types/fronttype";

const MenuItems = [
  {
    label: "Top",
    icon: <AiFillHome />,
    href: "",
  },
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
  const tripId =
    typeof router.query.tripId === "string" ? router.query.tripId : null;
  const userEmail = useAuthStore((s) => s.user?.email ?? null);
  const trips = useTripsStore((s) => s.trips);

  const currentTripTitle = useMemo(() => {
    if (!tripId || !trips) {
      return null;
    }

    const matchedTrip = trips.find((trip) => trip.id === tripId);
    return matchedTrip ?? null;
  }, [tripId, trips]);

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

  const menuTitle =
    currentTripTitle?.title ?? nearestTrip?.title ?? "Trip Drop";

  const activeTrip = currentTripTitle ?? nearestTrip;

  const tripDates = useMemo(() => {
    if (!activeTrip?.startAt || !activeTrip?.endAt) {
      return [];
    }
    return createDateRangeArray(activeTrip.startAt, activeTrip.endAt);
  }, [activeTrip]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    onLoggedOut();
  };

  useEffect(() => {
    console.log("tripDates", tripDates);
  }, [tripDates]);

  return (
    <div
      className={
        "flex flex-col justify-between pt-[6rem] pb-[3.2rem] px-[2.4rem] w-[26rem] h-[100vh] fixed top-0 right-0 lg:left-0 lg:right-auto z-20 transform transition-transform duration-300 ease-in-out bg-white " +
        (isOpen
          ? "translate-x-0 pointer-events-auto"
          : "translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto")
      }
      aria-hidden={!isOpen}
    >
      <div>
        <h1 className="text-center font-bold mb-[4rem]">{menuTitle}</h1>

        <div className="flex flex-col gap-[3.2rem]">
          {MenuItems.map((item) => {
            const baseHref =
              item.label !== "Top" && nearestTrip
                ? `/trips/${nearestTrip.id}/${item.href}`
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
                  activeTrip &&
                  tripDates.length > 0 && (
                    <div className="ml-[3.6rem] mt-[1.2rem] flex flex-col gap-[0.8rem]">
                      {tripDates.map((date) => (
                        <Link
                          key={date}
                          href={`/trips/${activeTrip.id}/schedule?date=${date}`}
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

      <div className="flex flex-col justify-center items-center gap-[0.8rem]">
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
