import { useEffect, useRef, useState } from "react";

export interface GooglePlaceCandidate {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export const useGooglePlacesPredictions = () => {
  const [candidates, setCandidates] = useState<GooglePlaceCandidate[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCandidates = async (input: string) => {
    if (input.length < 2) {
      setCandidates([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/google/findplace?input=${encodeURIComponent(input)}&language=en`,
      );
      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setCandidates([]);
    }
  };

  const handleInputChange = (value: string) => {
    // デバウンス処理
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchCandidates(value);
      setShowPredictions(true);
    }, 300);
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    candidates,
    showPredictions,
    setShowPredictions,
    handleInputChange,
  };
};
