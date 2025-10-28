import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { timezones } from "@/lib/timezones";

interface TimeZoneProps {
  timezone: string;
  setTimezone: (timezone: string) => void;
  required?: boolean;
  label?: string;
  labelClassName?: string;
}

export default function TimeZone({
  timezone,
  setTimezone,
  required = true,
  label = "Timezone",
  labelClassName,
}: TimeZoneProps) {
  return (
    <div className="">
      <Label
        htmlFor="timezone"
        className={cn("text-[1.2rem]", labelClassName)}
      >
        {label}
        {required ? " *" : ""}
      </Label>
      <Select value={timezone} onValueChange={setTimezone}>
        <SelectTrigger className="input-custom !h-[3.4rem]">
          <SelectValue placeholder="Select timezone" className="!text-[1rem]" />
        </SelectTrigger>
        <SelectContent className="input-custom">
          {timezones.map((tz) => (
            <SelectItem
              key={tz.value}
              value={tz.value}
              className="hover:bg-gray-100 text-[1.2rem]"
            >
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
