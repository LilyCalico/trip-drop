import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputPasswordProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  autoComplete?: string;
}

export default function InputPassword({
  id,
  value,
  onChange,
  placeholder = "",
  className,
  required = false,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  autoComplete
}: InputPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(className)}
        required={required}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowPassword((s) => !s)}
        className="absolute right-[1.2rem] top-[56%] -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? (
          <EyeOff className="size-6" />
        ) : (
          <Eye className="size-6" />
        )}
      </button>
    </div>
  );
}
