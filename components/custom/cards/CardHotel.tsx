import Image from "next/image";
import { AiOutlineClockCircle } from "react-icons/ai";
import ButtonDelete from "@/components/custom/button/ButtonDelete";
import CardWrapper from "@/components/custom/cards/CardWrapper";

interface CardHotelProps {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  bookingReference: string | null;
  time: string | null;
  googlePlaceId: string | null;
  check: "in" | "out" | "staying";
}

const CardHotel = ({
  id,
  name,
  address,
  phone,
  notes,
  bookingReference,
  time,
  googlePlaceId,
  check,
}: CardHotelProps) => {
  const handleConfirm = (targetId: string) => {
    console.log("TODO: delete hotel card", targetId);
  };

  console.log(googlePlaceId);
  return (
    <div className="relative w-[34.5rem]">
      <CardWrapper id={id}>
        <div className="self-center">
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
        <div className="absolute top-[1.6rem] right-[1.6rem] flex items-center gap-[0.4rem] text-gray-500">
          <AiOutlineClockCircle className="h-4 w-4" />
          <p>{`${check}: ${time}`}</p>
        </div>
      </CardWrapper>
      <div className="flex justify-end pr-[0.8rem] pt-[0.4rem]">
        <ButtonDelete id={id} handleConfirm={handleConfirm} />
      </div>
    </div>
  );
};

export default CardHotel;
