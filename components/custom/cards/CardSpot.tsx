import Image from "next/image";
import { useCallback, useState } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";
import { toast } from "sonner";
import CardWrapper from "@/components/custom/cards/CardWrapper";
import { useDeleteSpot } from "@/hooks/spots/useDeleteSpot";
import { formatLocalTimeFromUtc } from "@/lib/functions/formatLocalTimeFromUtc";
import type { Tables } from "@/types/supabasetype";
import ButtonDelete from "../button/ButtonDelete";
import ModalAdd from "../modal/ModalAdd";

type SpotRow = Tables<"spots">;

interface CardSpotProps {
  id: string;
  name: string;
  address?: string;
  description?: string;
  visitDatetime: string;
  timezone: string;
  googlePlaceId?: string;
  onDeleted?: (
    targetId: string,
    targetType: "spot" | "transport" | "hotel",
  ) => void;
  onUpdated?: (spot: SpotRow) => void;
}

export default function CardSpot({
  id,
  name,
  address,
  description,
  visitDatetime,
  timezone,
  googlePlaceId,
  onDeleted,
  onUpdated,
}: CardSpotProps) {
  const time = formatLocalTimeFromUtc(visitDatetime, timezone);
  const { deleteSpot } = useDeleteSpot();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = useCallback(
    async (targetId: string) => {
      const result = await deleteSpot(targetId);

      if (result.success) {
        toast.success("Spot deleted");
        onDeleted?.(targetId, "spot");
        return;
      }

      toast.error(result.message);
    },
    [deleteSpot, onDeleted],
  );

  return (
    <>
      <div
        className="w-[34.5rem] cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        data-google-place-id={googlePlaceId ?? undefined}
      >
        <CardWrapper id={id} className="relative">
          <div className="self-center flex-shrink-0">
            <Image
              src="/img/icon/icon-spot.png"
              alt="カメラアイコン"
              width={28}
              height={28}
            />
          </div>
          <div>
            <div className="font-bold">
              <h1 className="text-[1.2rem] max-w-[21rem]">{name}</h1>
              <p>{address}</p>
            </div>

            <p className="mt-[1.2rem]">{description}</p>
          </div>
          <div className="absolute top-[1.6rem] right-[1.6rem] flex items-center gap-[0.4rem] text-gray-500">
            <AiOutlineClockCircle className="h-4 w-4" />
            <p>{time}</p>
          </div>

          <div className="absolute bottom-[0.5rem] right-[0.5rem]">
            <ButtonDelete id={id} handleConfirm={handleConfirm} />
          </div>
        </CardWrapper>
      </div>

      <ModalAdd
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="spot"
        mode="edit"
        targetId={id}
        initialValues={{
          spot: {
            name,
            address: address ?? null,
            notes: description ?? null,
            googlePlaceId: googlePlaceId ?? null,
            visitDatetimeUtc: visitDatetime,
            timezone,
          },
        }}
        onSuccess={({ type, data }) => {
          if (type === "spot" && data) {
            onUpdated?.(data as SpotRow);
          }
        }}
      />
    </>
  );
}
