import Image from "next/image";
import { formatLocalDateTimeFromUtc } from "@/lib/functions/formatLocalDateTimeFromUtc";
import ButtonDelete from "../button/ButtonDelete";
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
}: CardTransportProps) {
  const handleConfirm = (targetId: string) => {
    console.log("TODO: delete transport card", targetId);
  };

  const formattedDepartureDatetime = formatLocalDateTimeFromUtc(
    departureDatetime,
    departureTimezone,
  );
  const formattedArrivalDatetime = formatLocalDateTimeFromUtc(
    arrivalDatetime,
    arrivalTimezone,
  );

  return (
    <div className="relative w-[34.5rem]">
      <CardWrapper id={id}>
        <div className="self-center">
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
      </CardWrapper>
      <div className="flex justify-end pr-[0.8rem] pt-[0.4rem]">
        <ButtonDelete id={""} handleConfirm={handleConfirm} />
      </div>
    </div>
  );
}
