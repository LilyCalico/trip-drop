import Image from "next/image";
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
  departureMemo: string;
  arrivalLocation: string;
  arrivalMemo: string;
  departureGooglePlaceId: string;
  arrivalGooglePlaceId: string;
}
export default function CardTransport() {
  const handleConfirm = (targetId: string) => {
    console.log("TODO: delete transport card", targetId);
  };

  return (
    <div className="relative w-[34.5rem]">
      <CardWrapper id={""}>
        <div className="self-center">
          <Image
            src="/img/icon/icon-transport.png"
            alt="Transport Icon"
            width={28}
            height={28}
          />
        </div>
        <div>
          <h1 className="font-bold text-[1.2rem] max-w-[20rem]">
            Air Line Name Here
          </h1>
          {/* Departure */}
          <div className="flex gap-[1.6rem] mt-[1.2rem]">
            <p className="font-bold font-mono tabular-nums whitespace-nowrap w-[7rem]">
              99/99 99:99
            </p>
            <div>
              <p>Haneda / Tokyo</p>
              <p className="text-[0.8rem]">ANA AA111</p>
            </div>
          </div>
          <p className="ml-[2.6rem] my-[0.6rem]">↓</p>
          {/* Arrival */}
          <div className="flex gap-[1.6rem]">
            <p className="font-bold font-mono tabular-nums whitespace-nowrap w-[7rem]">
              01/01 00:00
            </p>
            <div>
              <p>Arlanda / Stockholm</p>
              <p className="text-[0.8rem]">ANA AA111</p>
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
