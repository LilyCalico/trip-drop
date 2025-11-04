import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { AiFillHome } from "react-icons/ai";
import { FaBed, FaCalendar, FaPlane } from "react-icons/fa";
import Button from "@/components/custom/button/Button";
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    onLoggedOut();
  };

  return (
    <div
      className={
        "flex flex-col justify-between pt-[6rem] pb-[3.2rem] px-[2.4rem] w-[26rem] h-[100vh] fixed top-0 right-0 z-20 transform transition-transform duration-300 ease-in-out bg-white " +
        (isOpen
          ? "translate-x-0 pointer-events-auto"
          : "translate-x-full pointer-events-none")
      }
      aria-hidden={!isOpen}
    >
      <div>
        <h1 className="text-center font-bold mb-[4rem]">{menuTitle}</h1>

        <div className="flex flex-col gap-[3.2rem]">
          {MenuItems.map((item) => (
            <MenuLabel
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={
                item.label !== "Top" && nearestTrip
                  ? `/trips/${nearestTrip.id}/${item.href}`
                  : `/`
              }
              onClick={() => {
                onClose();
              }}
            />
          ))}
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
