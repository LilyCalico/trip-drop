import { useRouter } from "next/router";
import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { FaEllipsis } from "react-icons/fa6";
import { toast } from "sonner";
import ModalConfirm from "@/components/custom/modal/ModalConfirm";
import useDeleteTrip from "@/hooks/trips/useDeleteTrip";
import { formatDateRange } from "@/lib/functions/formatDateRange";
import { cn } from "@/lib/utils";
import { useTripsStore } from "@/store/useTripsStore";
export const DUMMY_USERS = [
  { id: 1, name: "Kiki", avatarUrl: "/dummy-user.png" },
  { id: 2, name: "Shizuku", avatarUrl: "" }
];

interface CardTripProps {
  isUpcoming: boolean;
  tripId: string;
  startAt: string;
  endAt: string;
  title: string;
  description: string | null;
  users: { id: string; name: string | null; avatarUrl: string | null }[];
  timeZone: string;
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

function CardTrip({
  tripId,
  startAt,
  endAt,
  title,
  description,
  users,
  isUpcoming,
  timeZone
}: CardTripProps) {
  const router = useRouter();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { deleteTrip: deleteTripApi } = useDeleteTrip();
  const deleteTripState = useTripsStore((s) => s.deleteTrip);
  const trips = useTripsStore((s) => s.trips);
  const setTrips = useTripsStore((s) => s.setTrips);

  const handleOpenDeleteModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    // Optimistic Update: 削除前のtripデータを保存
    const tripToRestore = trips?.find((t) => t.id === tripId);

    // 先にstateから削除
    deleteTripState(tripId);

    // モーダルを閉じる
    setIsDeleteModalOpen(false);

    // API呼び出し
    const success = await deleteTripApi(tripId);

    // 失敗したらロールバック
    if (!success && tripToRestore) {
      const currentTrips = useTripsStore.getState().trips ?? [];
      setTrips([...currentTrips, tripToRestore]);
      toast.error("Failed to delete trip");
    }
  };

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
          : "hover:bg-black/10 border border-black/5"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between",
          isUpcoming ? "py-[4.8rem]" : "py-[2.4rem]"
        )}
      >
        <div className={cn("flex-1 rounded-lg pl-[2rem] pr-[5.6rem]")}>
          <p
            className={cn(
              "mb-[1.6rem]",
              isUpcoming ? "text-[1.2rem] text-white" : "text-[1rem]"
            )}
          >
            {formatDateRange({ startAt, endAt, timeZone })}
          </p>
          <div
            className={cn(
              "flex items-center font-family-figtree",
              isUpcoming ? "h-[6.4rem]" : "h-[4.8rem]"
            )}
          >
            <div>
              <p
                className={cn(
                  "font-bold line-clamp-2",
                  isUpcoming ? "text-[2rem] text-white" : "text-[1.6rem]"
                )}
              >
                {title}
              </p>
              <p className="text-[1.2rem] text-gray-500 mt-2">
                {description ?? "sample description"}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenDeleteModal}
          className="cursor-pointer p-[0.8rem] mr-[1.2rem] hover:bg-gray-500/50 hover:text-black/20 rounded-full transition-colors duration-150"
        >
          <FaEllipsis
            className={cn(
              "w-[1.2rem] h-[1.2rem]",
              isUpcoming ? "text-white" : "text-black/75"
            )}
          />
        </button>
      </div>
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onClick={handleDelete}
        title="Delete this trip?"
        text="This action cannot be undone."
        buttonColor="bg-red-500 hover:bg-red-600"
      />
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
