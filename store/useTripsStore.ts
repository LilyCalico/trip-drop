import { create } from "zustand";
import type { TripType } from "../types/fronttype";

interface TripsState {
  tripsState: TripType[] | null;
  loading: boolean;
  error: string | null;
  setTrips: (trips: TripType[] | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTrips: () => void;
}

export const useTripsStore = create<TripsState>((set) => ({
  tripsState: null,
  loading: false,
  error: null,
  setTrips: (tripsState) => set({ tripsState }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearTrips: () => set({ tripsState: null, error: null }),
}));
