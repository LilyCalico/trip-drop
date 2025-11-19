import type { SchedulePlace } from "@/components/custom/map/GoogleMap";
import type { TripScheduleData } from "@/hooks/trips/useTripSchedule";

export const extractSchedulePlaces = (
  schedule: TripScheduleData,
): SchedulePlace[] => {
  return schedule.items
    .map((item: TripScheduleData["items"][number]) => {
      if (item.type === "spot") {
        const googleData = item.spot.googleData as
          | {
              geometry?: {
                location?: { lat?: number; lng?: number } | null;
              } | null;
            }
          | null
          | undefined;
        const lat = googleData?.geometry?.location?.lat;
        const lng = googleData?.geometry?.location?.lng;

        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
          return {
            geometry: {
              location: { lat, lng },
            },
            name: item.spot.name,
            formattedAddress: item.spot.address ?? "",
            placeId: item.spot.googlePlaceId ?? "",
          };
        }
        return null;
      }

      if (item.type === "hotel") {
        const googleData = item.hotel.googleData as
          | {
              geometry?: {
                location?: { lat?: number; lng?: number } | null;
              } | null;
            }
          | null
          | undefined;
        const lat = googleData?.geometry?.location?.lat;
        const lng = googleData?.geometry?.location?.lng;

        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
          return {
            geometry: {
              location: { lat, lng },
            },
            name: item.hotel.name,
            formattedAddress: item.hotel.address ?? "",
            placeId: item.hotel.googlePlaceId ?? "",
          };
        }
        return null;
      }

      // transport
      const departureGoogleData = item.transport.departureGoogleData as
        | {
            geometry?: {
              location?: { lat?: number; lng?: number } | null;
            } | null;
          }
        | null
        | undefined;
      const departureLat = departureGoogleData?.geometry?.location?.lat;
      const departureLng = departureGoogleData?.geometry?.location?.lng;

      if (
        typeof departureLat === "number" &&
        typeof departureLng === "number" &&
        Number.isFinite(departureLat) &&
        Number.isFinite(departureLng)
      ) {
        return {
          geometry: {
            location: { lat: departureLat, lng: departureLng },
          },
          name: item.transport.name,
          formattedAddress: item.transport.departureLocation ?? "",
          placeId: item.transport.departureGooglePlaceId ?? "",
        };
      }

      const arrivalGoogleData = item.transport.arrivalGoogleData as
        | {
            geometry?: {
              location?: { lat?: number; lng?: number } | null;
            } | null;
          }
        | null
        | undefined;
      const arrivalLat = arrivalGoogleData?.geometry?.location?.lat;
      const arrivalLng = arrivalGoogleData?.geometry?.location?.lng;

      if (
        typeof arrivalLat === "number" &&
        typeof arrivalLng === "number" &&
        Number.isFinite(arrivalLat) &&
        Number.isFinite(arrivalLng)
      ) {
        return {
          geometry: {
            location: { lat: arrivalLat, lng: arrivalLng },
          },
          name: item.transport.name,
          formattedAddress: item.transport.arrivalLocation ?? "",
          placeId: item.transport.arrivalGooglePlaceId ?? "",
        };
      }

      return null;
    })
    .filter((place): place is SchedulePlace => place !== null);
};
