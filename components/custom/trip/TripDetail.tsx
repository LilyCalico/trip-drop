import { format, parseISO } from "date-fns";
import { Copy } from "lucide-react";
import { AiOutlineCalendar, AiOutlineUser } from "react-icons/ai";
import Button from "@/components/custom/Button";

interface TripDetailProps {
  tripId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  numberOfMembers: number;
}

export default function TripDetail({
  tripId,
  title,
  description,
  startAt,
  endAt,
  numberOfMembers,
}: TripDetailProps) {
  const startAtDisplay = format(parseISO(startAt), "yyyy/MM/dd");
  const endAtDisplay = format(parseISO(endAt), "yyyy/MM/dd");

  const handleCopyShareLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/trips/${tripId}/join`;

    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard");
  };

  // TODO: Edit Trip Button
  // const handleEditTrip = () => {
  //   console.log("edit trip");
  // };

  return (
    <div className="p-[3.2rem] bg-section flex flex-col gap-[4rem]">
      <div className="text-center">
        <p className="font-bold text-[1.6rem] mb-[1rem]">{title}</p>
        {description && <p>{description}</p>}
      </div>

      <div className="px-[3.65rem]">
        <div className="flex items-center gap-[1.2rem] mb-[1.2rem]">
          <AiOutlineCalendar className="text-[1.6rem]" />
          <p className="font-bold">
            {startAtDisplay} ~ {endAtDisplay}
          </p>
        </div>
        <div className="flex items-center gap-[1.2rem]">
          <AiOutlineUser className="text-[1.6rem]" />
          <p className="font-bold">{numberOfMembers}</p>
        </div>
      </div>

      <Button
        onClick={handleCopyShareLink}
        className="bg-white text-black border border-black flex items-center gap-2"
      >
        <Copy size={16} />
        Copy Share Link
      </Button>

      {/* TODO: Edit Trip Button */}
      {/* <div className="flex gap-[1.2rem]">
        <Button
          onClick={handleCopyShareLink}
          className="bg-white text-black border border-black flex-1 flex items-center gap-2"
        >
          <Copy size={16} />
          Copy Share Link
        </Button>
        <Button onClick={handleEditTrip} className="flex-1 border border-black">
          Edit Trip
        </Button>
      </div> */}
    </div>
  );
}
