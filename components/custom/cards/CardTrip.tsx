import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import useDeleteTrip from "@/hooks/trips/useDeleteTrip";
import { formatDateRange } from "@/lib/functions/formatDateRange";
import { cn } from "@/lib/utils";
export const DUMMY_USERS = [
  { id: 1, name: "Kiki", avatarUrl: "/dummy-user.png" },
  { id: 2, name: "Shizuku", avatarUrl: "" },
];

interface CardTripProps {
  isUpcoming: boolean;
  tripId: string;
  startAt: string;
  endAt: string;
  title: string;
  users: { id: string; name: string | null; avatarUrl: string | null }[];
  timeZone: string;
}

const IconWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "relative w-[2.4rem] h-[2.4rem] block",
        "rounded-full border-2 border-gray-300 overflow-hidden",
      )}
    >
      {children}
    </div>
  );
};

function CardTrip({
  tripId,
  startAt,
  endAt,
  title,
  users,
  isUpcoming,
  timeZone,
}: CardTripProps) {
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const { deleteTrip } = useDeleteTrip();

  useEffect(() => {
    console.log("CardTrip", startAt, endAt, timeZone);
  }, [startAt, endAt, timeZone]);

  return (
    <div
      onClick={() => {
        setActiveUserId(null);
        router.push(`/trips/${tripId}/schedule`);
      }}
      className={cn(
        "cursor-pointer rounded-[0.3rem] w-full transition-colors duration-300",
        isUpcoming
          ? "bg-[url('/img/bgimg/bgimg-date.png')] bg-cover bg-center hover:opacity-95"
          : "hover:bg-black/10 border border-black/5",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between",
          isUpcoming ? "py-[4.8rem]" : "py-[2.4rem]",
        )}
      >
        <div className={cn("flex-1 rounded-lg pl-[2rem] pr-[5.6rem]")}>
          <p
            className={cn(
              "mb-[1.6rem]",
              isUpcoming ? "text-[1.2rem] text-white" : "text-[1rem]",
            )}
          >
            {formatDateRange({ startAt, endAt, timeZone })}
          </p>
          <div
            className={cn(
              "flex items-center font-family-figtree",
              isUpcoming ? "h-[6.4rem]" : "h-[4.8rem]",
            )}
          >
            <p
              className={cn(
                "font-bold line-clamp-2",
                isUpcoming ? "text-[2rem] text-white" : "text-[1.6rem]",
              )}
            >
              {title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this trip?")) {
              deleteTrip(tripId);
            }
          }}
          className="cursor-pointer p-[0.8rem] mr-[1.2rem] hover:bg-warning/50 rounded-full transition-colors duration-150"
        >
          <FaTrash
            className={cn(
              "w-[1.2rem] h-[1.2rem] text-black/75",
              isUpcoming ? "text-white" : "text-black/75",
            )}
          />
        </button>
      </div>
      {/* <div className={cn("mx-auto", "-mt-[1.2rem] ml-[1.6rem]")}>
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              "relative inline-block group",
              "mr-[-0.8rem] last:mr-0",
            )}
            onClick={(e) => {
              e.stopPropagation();
              setActiveUserId((prev) => (prev === user.id ? null : user.id));
            }}
          >
            {user.avatarUrl ? (
              <IconWrapper>
                <Image
                  src={user.avatarUrl}
                  alt={user.name ?? "Unknown"}
                  className="object-cover"
                  width={24}
                  height={24}
                />
              </IconWrapper>
            ) : (
              <IconWrapper>
                <FaUserCircle className="w-full h-full block text-gray-500" />
              </IconWrapper>
            )}
            <span
              className={cn(
                "absolute -top-[2rem] left-1/2 -translate-x-1/2 whitespace-nowrap z-10 pointer-events-none",
                "rounded bg-black px-2 py-1 text-[1rem] text-white shadow",
                "transition-opacity duration-150",
                activeUserId === user.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              )}
            >
              {user.name}
            </span>
          </div>
        ))}
      </div> */}
    </div>
  );
}

export default CardTrip;
