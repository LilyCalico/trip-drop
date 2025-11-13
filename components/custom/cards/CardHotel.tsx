import Image from "next/image";
import { useCallback, useState } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";
import { toast } from "sonner";
import ButtonDelete from "@/components/custom/button/ButtonDelete";
import CardWrapper from "@/components/custom/cards/CardWrapper";
import ModalAdd from "@/components/custom/modal/ModalAdd";
import { useDeleteHotel } from "@/hooks/hotels/useDeleteHotel";
import { formatLocalTimeFromUtc } from "@/lib/functions/formatLocalTimeFromUtc";
import type { Tables } from "@/types/supabasetype";

type HotelStayRow = Tables<"hotel_stays">;

interface CardHotelProps {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  bookingReference: string | null;
  datetimeUtc: string | null;
  timezone: string | null;
  googlePlaceId: string | null;
  checkInUtc?: string | null;
  checkOutUtc?: string | null;
  check: "in" | "out" | "staying";
  onDeleted?: (
    targetId: string,
    targetType: "spot" | "transport" | "hotel",
  ) => void;
  onUpdated?: (stay: HotelStayRow) => void;
}

const CardHotel = ({
  id,
  name,
  address,
  phone,
  notes,
  bookingReference,
  datetimeUtc,
  timezone,
  googlePlaceId,
  checkInUtc,
  checkOutUtc,
  check,
  onDeleted,
  onUpdated,
}: CardHotelProps) => {
  const { deleteHotel } = useDeleteHotel();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = useCallback(
    async (targetId: string) => {
      const result = await deleteHotel(targetId);

      if (result.success) {
        toast.success("Hotel deleted");
        onDeleted?.(targetId, "hotel");
        return;
      }

      toast.error(result.message);
    },
    [deleteHotel, onDeleted],
  );

  const formattedTime =
    datetimeUtc && timezone
      ? formatLocalTimeFromUtc(datetimeUtc, timezone)
      : null;

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
              src="/img/icon/icon-hotel.png"
              alt="ホテルアイコン"
              width={28}
              height={28}
            />
          </div>
          <div>
            <div className="font-bold">
              <h1 className="text-[1.2rem] max-w-[20rem]">{name}</h1>
              <p>{address}</p>
            </div>
            <div className="mt-[1.2rem]">
              <p>{phone}</p>
              {bookingReference && <p>Reference: {bookingReference}</p>}
              {notes && <p className="mt-[0.8rem]">Notes: {notes}</p>}
            </div>
          </div>
          {check !== "staying" && formattedTime && (
            <div className="absolute top-[1.6rem] right-[1.6rem] flex items-center gap-[0.4rem] text-gray-500">
              <AiOutlineClockCircle className="h-4 w-4" />
              <p>{`${check}: ${formattedTime}`}</p>
            </div>
          )}
          <div className="absolute bottom-[0.5rem] right-[0.5rem]">
            <ButtonDelete id={id} handleConfirm={handleConfirm} />
          </div>
        </CardWrapper>
      </div>

      <ModalAdd
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="hotel"
        mode="edit"
        targetId={id}
        initialValues={{
          hotel: {
            name,
            address,
            phone,
            notes,
            bookingReference,
            googlePlaceId,
            checkinUtc: checkInUtc ?? (check === "in" ? datetimeUtc : null),
            checkoutUtc: checkOutUtc ?? (check === "out" ? datetimeUtc : null),
            timezone,
          },
        }}
        onSuccess={({ type, data }) => {
          if (type === "hotel" && data) {
            onUpdated?.(data as HotelStayRow);
          }
        }}
      />
    </>
  );
};

export default CardHotel;
