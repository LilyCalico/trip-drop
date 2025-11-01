import Image from "next/image";
import { AiOutlineClockCircle } from "react-icons/ai";
import CardWrapper from "@/components/custom/cards/CardWrapper";
import ButtonDelete from "../button/ButtonDelete";

interface CardSpotProps {
  id: string;
  name: string;
  address?: string;
  description?: string;
  visitDatetime: string;
  googlePlaceId?: string;
}

export default function CardSpot({
  id,
  name,
  address,
  description,
  visitDatetime,
  googlePlaceId,
}: CardSpotProps) {
  const handleConfirm = (targetId: string) => {
    console.log("TODO: delete spot card", targetId);
  };

  return (
    <div className="relative w-[34.5rem]">
      <CardWrapper id={id}>
        <div className="self-center">
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
          <p>{visitDatetime}</p>
        </div>
      </CardWrapper>
      <div className="flex justify-end pr-[0.8rem] pt-[0.4rem]">
        <ButtonDelete id={id} handleConfirm={handleConfirm} />
      </div>
    </div>
  );
}
