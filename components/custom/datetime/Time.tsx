import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimeProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function Time({
  label,
  id = "time-picker",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
}: TimeProps) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="text-[1.2rem] mb-[0.4rem]">
          {label}
        </Label>
      )}
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="time"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn(
            "h-[3.2rem] pl-9",
            "border-gray-light shadow-none",
            "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
          )}
        />
      </div>
    </div>
  );
}
