import { FaBed, FaMapPin, FaPlane } from "react-icons/fa";
import { cn } from "@/lib/utils";

const icons = [
  {
    type: "spot",
    label: "Spot",
    icon: <FaMapPin size={32} className="text-black" />,
  },
  {
    type: "hotel",
    label: "Hotel",
    icon: <FaBed size={32} className="text-black" />,
  },
  {
    type: "transport",
    label: "Transport",
    icon: <FaPlane size={32} className="text-black" />,
  },
];

export default function ButtonAdd({
  type,
  onClick,
}: {
  type: "spot" | "hotel" | "transport";
  onClick: () => void;
}) {
  const item = icons.find((icon) => icon.type === type);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "w-[8.5rem] h-[7rem]",
        "gap-[0.8rem]",
        "rounded-[0.8rem] bg-white",
        "cursor-pointer hover:bg-black/15 transition-all duration-300",
      )}
      onClick={onClick}
    >
      {item?.icon}
      <p className="text-[1rem] font-bold">{item?.label}</p>
    </div>
  );
}
