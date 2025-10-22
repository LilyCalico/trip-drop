import { useEffect, useState } from "react";
import { FaBed, FaMapPin, FaPlane } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useTripsStore } from "@/store/useTripsStore";
import ModalAddSpot from "./ModalAddSpot";

interface ModalAddProps {
  isOpen: boolean;
  onClose: () => void;
  type: "spot" | "hotel" | "transport";
  tripId: string;
}

type Category = "spot" | "hotel" | "transport";
const categories: Category[] = ["spot", "hotel", "transport"];

const ButtonCategory = ({
  isSelected,
  category,
  onClick,
}: {
  isSelected: boolean;
  category: Category;
  onClick: (category: Category) => void;
}) => {
  const title = category.charAt(0).toUpperCase() + category.slice(1);
  const icons = {
    spot: <FaMapPin />,
    hotel: <FaBed />,
    transport: <FaPlane />,
  };

  return (
    <div
      className="flex items-center gap-[0.8rem] cursor-pointer"
      onClick={() => onClick(category)}
    >
      <div
        className={cn(isSelected ? "text-black font-bold" : "text-gray-500")}
      >
        {icons[category]}
      </div>
      <p className={cn(isSelected ? "text-black font-bold" : "text-gray-500")}>
        {title}
      </p>
    </div>
  );
};

export default function ModalAdd({
  isOpen,
  onClose,
  type,
  tripId,
}: ModalAddProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const category = selectedCategory ?? type;
  const trips = useTripsStore((state) => state.trips);
  const trip = trips?.find((trip) => trip.id === tripId) ?? null;

  useEffect(() => {
    console.log("trip", trip);
  }, [trip]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[90%] max-w-[52rem] rounded-[1.2rem] bg-white p-[2.4rem] shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="text-[1.4rem] px-[8px] py-[4px] rounded hover:bg-black/5 absolute top-[1.6rem] right-[1.6rem]"
          aria-label="Close"
        >
          ×
        </button>

        {/* Category Buttons */}
        <div className="flex gap-[1.2rem] justify-between mt-[3.2rem] mb-[2.4rem]">
          {categories.map((category) => (
            <ButtonCategory
              key={category}
              isSelected={
                selectedCategory === null
                  ? type === category
                  : selectedCategory === category
              }
              category={category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>

        {/* Text Input */}
        <div>
          {category === "spot" && <ModalAddSpot />}
          {/* {category === "hotel" && <ModalAddHotel />}
          {category === "transport" && <ModalAddTransport />} */}
        </div>
      </div>
    </div>
  );
}
