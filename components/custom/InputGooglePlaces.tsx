import { useEffect, useRef } from "react";

import Input from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type GooglePlaceCandidate,
  useGooglePlacesPredictions,
} from "@/hooks/google/useGooglePlacesPredictions";
import { cn } from "@/lib/utils";

interface InputGooglePlacesProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onCandidateSelect?: (candidate: GooglePlaceCandidate) => void;
  className?: string;
  inputClassName?: string;
}

export default function InputGooglePlaces({
  id,
  value,
  onValueChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  onCandidateSelect,
  className,
  inputClassName,
}: InputGooglePlacesProps) {
  const { candidates, showPredictions, setShowPredictions, handleInputChange } =
    useGooglePlacesPredictions();
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    onValueChange(nextValue);

    if (nextValue.trim().length < 2) {
      setShowPredictions(false);
      return;
    }

    handleInputChange(nextValue);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (candidates.length > 0) {
      setShowPredictions(true);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setShowPredictions(false);
    }, 150);
  };

  const handleCandidatePick = (candidate: GooglePlaceCandidate) => {
    onValueChange(candidate.name);
    onCandidateSelect?.(candidate);
    setShowPredictions(false);
  };

  return (
    <div className={cn("space-y-[0.4rem]", className)}>
      {label && (
        <Label htmlFor={id} className="text-[1.2rem]">
          {label} {required ? "*" : ""}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClassName}
        />
        {showPredictions && candidates.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {candidates.map((candidate) => (
              <button
                type="button"
                key={candidate.place_id}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleCandidatePick(candidate)}
              >
                <div className="font-medium">{candidate.name}</div>
                <div className="text-sm text-gray-500">
                  {candidate.formatted_address}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
