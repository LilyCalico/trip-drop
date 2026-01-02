import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { timezones } from "@/lib/timezones";
import { cn } from "@/lib/utils";

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
  labelClassName
}: TimeZoneProps) {
  // ローカルタイムゾーンを初期値として設定
  useEffect(() => {
    // 既に値が設定されている場合は何もしない
    if (timezone) {
      return;
    }

    try {
      // ローカルタイムゾーンを取得
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // timezones配列から該当するものを探す
      const foundTimezone = timezones.find((tz) => tz.value === localTimezone);

      // 見つかったら設定、見つからなかったらUTCを設定
      setTimezone(foundTimezone ? foundTimezone.value : "UTC");
    } catch (error) {
      // エラーが発生した場合はUTCを設定
      console.error("Failed to get local timezone:", error);
      setTimezone("UTC");
    }
  }, [timezone, setTimezone]);

  return (
    <div className="">
      <Label htmlFor="timezone" className={cn("text-[1.4rem]", labelClassName)}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Select value={timezone} onValueChange={setTimezone}>
        <SelectTrigger className="input-custom py-[2rem] !text-[1.4rem] [&_*[data-slot=select-value]]:!text-[1.4rem]">
          <SelectValue
            placeholder="Select timezone"
            className="placeholder:!text-[1.4rem]"
          />
        </SelectTrigger>
        <SelectContent className="input-custom">
          {timezones.map((tz) => (
            <SelectItem
              key={tz.value}
              value={tz.value}
              className="!text-[1.4rem] hover:bg-gray-100"
            >
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
