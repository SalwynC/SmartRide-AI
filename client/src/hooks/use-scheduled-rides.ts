import { useQuery } from "@tanstack/react-query";

export interface ScheduledRide {
  id: number;
  passengerId: number;
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  finalFare: number;
  baseFare: number;
  surgeMultiplier: number | null;
  status: string | null;
  scheduledAt: string;
  createdAt: string | null;
}

export function useScheduledRides(userId?: number) {
  return useQuery<ScheduledRide[]>({
    queryKey: ["/api/rides/scheduled", userId],
    queryFn: async () => {
      const res = await fetch(`/api/rides/scheduled/${userId}`);
      if (!res.ok) throw new Error("Failed to load scheduled rides");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 60000, // Check every minute
  });
}
