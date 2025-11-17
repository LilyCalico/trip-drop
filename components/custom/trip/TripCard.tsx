import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaTrash, FaUserCircle } from "react-icons/fa";
import useDeleteTrip from "@/hooks/trips/useDeleteTrip";
import { formatDateRange } from "@/lib/functions/formatDateRange";
import { cn } from "@/lib/utils";
export const DUMMY_USERS = [
  { id: 1, name: "Kiki", avatarUrl: "/dummy-user.png" },
  { id: 2, name: "Shizuku", avatarUrl: "" },
];

interface TripCardProps {
  tripId: string;
  startAt: string;
  endAt: string;
  title: string;
  users: { id: string; name: string | null; avatarUrl: string | null }[];
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

function TripCard({ tripId, startAt, endAt, title, users }: TripCardProps) {
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const { deleteTrip } = useDeleteTrip();

  return (
    <div
      onClick={() => {
        setActiveUserId(null);
      }}
      className={cn("w-full max-w-[34.5rem]")}
    >
      <div className="flex items-center justify-between">
        <div
          onClick={() => {
            router.push(`/trips/${tripId}/schedule`);
          }}
          className={cn(
            "flex-1 bg-gray-50 rounded-lg",
            "pt-[2.4rem] px-[2.4rem] pb-[3.6rem]",
            "cursor-pointer hover:bg-gray-100 transition-colors duration-150",
          )}
        >
          <p className="text-[0.8rem] mb-[0.8rem]">
            {formatDateRange(startAt, endAt)}
          </p>
          <p className="text-[1.4rem] font-bold">{title}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this trip?")) {
              deleteTrip(tripId);
            }
          }}
          className="ml-4 p-2 hover:bg-warning/50 rounded-full transition-colors duration-150"
        >
          <FaTrash className="w-[1.4rem] h-[1.4rem] text-black/75" />
        </button>
      </div>
      <div className={cn("mx-auto", "-mt-[1.2rem] ml-[1.6rem]")}>
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
      </div>
    </div>
  );
}

export default TripCard;
