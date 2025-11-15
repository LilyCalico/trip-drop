import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDeleteTransport } from "@/hooks/transports/useDeleteTransport";
import { formatLocalDateTimeFromUtc } from "@/lib/functions/formatLocalDateTimeFromUtc";
import type { Tables } from "@/types/supabasetype";
import ButtonDelete from "../button/ButtonDelete";
import ModalAdd from "../modal/ModalAdd";
import CardWrapper from "./CardWrapper";

interface CardTransportProps {
  id: string;
  name: string;
  departureDatetime: string;
  departureTimezone: string;
  arrivalDatetime: string;
  arrivalTimezone: string;
  departureLocation: string;
  departureMemo: string | null;
  arrivalLocation: string;
  arrivalMemo: string | null;
  departureGooglePlaceId: string | null;
  arrivalGooglePlaceId: string | null;
  bookingReference?: string | null;
  onDeleted?: (
    targetId: string,
    targetType: "spot" | "transport" | "hotel",
  ) => void;
  onUpdated?: (transport: Tables<"transports">) => void;
}
export default function CardTransport({
  id,
  name,
  departureLocation,
  arrivalLocation,
  departureMemo,
  arrivalMemo,
  departureDatetime,
  departureTimezone,
  arrivalDatetime,
  arrivalTimezone,
  departureGooglePlaceId,
  arrivalGooglePlaceId,
  bookingReference,
  onDeleted,
  onUpdated,
}: CardTransportProps) {
  const { deleteTransport } = useDeleteTransport();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = useCallback(
    async (targetId: string) => {
      const result = await deleteTransport(targetId);

      if (result.success) {
        toast.success("Transport deleted");
        onDeleted?.(targetId, "transport");
        return;
      }

      toast.error(result.message);
    },
    [deleteTransport, onDeleted],
  );

  const formattedDepartureDatetime = formatLocalDateTimeFromUtc(
    departureDatetime,
    departureTimezone,
  );
  const formattedArrivalDatetime = formatLocalDateTimeFromUtc(
    arrivalDatetime,
    arrivalTimezone,
  );

  return (
    <>
      <div
        className="w-[34.5rem] cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <CardWrapper id={id}>
          <div className="self-center flex-shrink-0">
            <Image
              src="/img/icon/icon-transport.png"
              alt="Transport Icon"
              width={28}
              height={28}
            />
          </div>
          <div>
            <h1 className="font-bold text-[1.2rem] max-w-[20rem] text-black/95">
              {name}
            </h1>
            {/* Departure */}
            <div className="flex gap-[1.6rem] mt-[1.2rem]">
              <p className="font-bold font-mono tabular-nums whitespace-nowrap w-[7rem] text-black/90">
                {formattedDepartureDatetime}
              </p>
              <div>
                <p>{departureLocation}</p>
                {departureMemo && (
                  <p className="text-[0.8rem]">{departureMemo}</p>
                )}
              </div>
            </div>
            <p className="ml-[2.6rem] my-[0.6rem]">↓</p>
            {/* Arrival */}
            <div className="flex gap-[1.6rem]">
              <p className="font-bold font-mono tabular-nums whitespace-nowrap w-[7rem] text-black/90">
                {formattedArrivalDatetime}
              </p>
              <div>
                <p>{arrivalLocation}</p>
                {arrivalMemo && <p className="text-[0.8rem]">{arrivalMemo}</p>}
              </div>
            </div>
          </div>
          <div className="absolute bottom-[0.5rem] right-[0.5rem]">
            <ButtonDelete id={id} handleConfirm={handleConfirm} />
          </div>
        </CardWrapper>
      </div>

      <ModalAdd
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="transport"
        mode="edit"
        targetId={id}
        initialValues={{
          transport: {
            carrierName: name,
            departureLocation,
            arrivalLocation,
            departureMemo,
            arrivalMemo,
            bookingReference: bookingReference ?? null,
            departureTimezone,
            arrivalTimezone,
            departureDatetimeUtc: departureDatetime,
            arrivalDatetimeUtc: arrivalDatetime,
            departureGooglePlaceId,
            arrivalGooglePlaceId,
          },
        }}
        onSuccess={({ type, data }) => {
          if (type === "transport" && data) {
            onUpdated?.(data as Tables<"transports">);
          }
        }}
      />
    </>
  );
}
