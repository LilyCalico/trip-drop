import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";
export const DUMMY_USERS = [
  { id: 1, name: "Kiki", avatarUrl: "/dummy-user.png" },
  { id: 2, name: "Shizuku", avatarUrl: "" }
];

interface TripCardProps {
  tripId: string;
  date: string;
  title: string;
  users: { id: number; name: string; avatarUrl: string }[];
}

const IconWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "relative w-[2.4rem] h-[2.4rem] block",
        "rounded-full border-2 border-gray-300 overflow-hidden"
      )}
    >
      {children}
    </div>
  );
};

function TripCard({ tripId, date, title, users }: TripCardProps) {
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  return (
    <div
      onClick={() => {
        setActiveUserId(null);
      }}
      className={cn("w-full max-w-[34.5rem]")}
    >
      <div
        onClick={() => {
          router.push(`/trips/${tripId}`);
        }}
        className={cn(
          "mx-auto bg-gray-50 rounded-lg",
          "pt-[2.4rem] px-[2.4rem] pb-[3.6rem]",
          "cursor-pointer hover:bg-gray-100 transition-colors duration-150"
        )}
      >
        <p className="text-[0.8rem] mb-[0.8rem]">{date}</p>
        <p className="text-[1.4rem] font-bold">{title}</p>
      </div>
      <div className={cn("mx-auto", "-mt-[1.2rem] ml-[1.6rem]")}>
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              "relative inline-block group",
              "mr-[-0.8rem] last:mr-0"
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
                  alt={user.name}
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
                  : "opacity-0 group-hover:opacity-100"
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
