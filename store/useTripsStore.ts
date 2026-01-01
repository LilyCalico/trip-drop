import { create } from "zustand";
import type { TripType } from "../types/fronttype";

interface trips {
  trips: TripType[] | null;
  currentTrip: TripType | null;
  loading: boolean;
  error: string | null;
  setTrips: (trips: TripType[] | null) => void;
  setCurrentTrip: (trip: TripType | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTrips: () => void;
  deleteTrip: (tripId: string) => void;
}

export const useTripsStore = create<trips>((set) => ({
  trips: null,
  currentTrip: null,
  loading: false,
  error: null,
  setTrips: (trips) => set({ trips }),
  setCurrentTrip: (currentTrip) => set({ currentTrip }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearTrips: () => set({ trips: null, currentTrip: null, error: null }),
  deleteTrip: (tripId) =>
    set((state) => ({
      trips: state.trips?.filter((trip) => trip.id !== tripId),
      currentTrip: null
    }))
}));
