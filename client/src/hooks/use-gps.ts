import { useQuery } from "@tanstack/react-query";

export interface GPSCoordinate {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface GPSData {
  status: string;
  progress: number;
  currentPosition: { lat: number; lng: number };
  coordinates: GPSCoordinate[];
  eta: number;
  speed: number;
  distanceCovered: number;
  remainingKm: number;
  heading: number;
}

export function useGPSTracking(rideId?: number, enabled = true) {
  return useQuery<GPSData>({
    queryKey: ["/api/rides/gps", rideId],
    queryFn: async () => {
      const res = await fetch(`/api/rides/${rideId}/gps`);
      if (!res.ok) throw new Error("Failed to get GPS data");
      return res.json();
    },
    enabled: !!rideId && enabled,
    refetchInterval: 3000, // Real-time: every 3 seconds
  });
}
