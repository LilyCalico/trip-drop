import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  startDate: string; // ISO文字列
  endDate: string; // ISO文字列
  placeholder?: string;
  dateFormat?: string;
  required?: boolean;
  className?: string;
}

export default function DatePulldown({
  label,
  id = "date-picker",
  value,
  onChange,
  startDate,
  endDate,
  placeholder = "Select date",
  className = "",
}: DateProps) {
  // 日付範囲を取得（UTCで生成）
  const dates = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  const datesList = dates.map((date) => {
    // 各日付をUTCの00:00:00に設定
    const utcDate = new Date(date);
    utcDate.setUTCHours(0, 0, 0, 0);
    return utcDate;
  });

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="text-[1.2rem] mb-[0.4rem]">
          {label}
        </Label>
      )}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="py-[1.6rem] pl-9 pr-[1.2rem] border-gray-light shadow-none input-custom">
            <SelectValue>
              {value ? format(parseISO(value), "yyyy/MM/dd EEE") : placeholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-light">
            {datesList.map((date) => (
              <SelectItem
                key={date.toISOString()}
                value={date.toISOString()}
                className="bg-white hover:bg-gray-50"
              >
                {format(date, "yyyy/MM/dd EEE")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

