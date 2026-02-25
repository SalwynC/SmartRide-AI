import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TrackingData {
  status: string;
  driverLocation: { lat: number; lng: number } | null;
  eta: number | null;
  progress: number;
  driverName: string;
  driverRating: number;
  vehicleInfo: string;
  pickupLocation: { lat: number; lng: number };
  dropLocation: { lat: number; lng: number };
}

export function useRideTracking(rideId: number, enabled = true) {
  return useQuery<TrackingData>({
    queryKey: ["/api/rides/track", rideId],
    queryFn: async () => {
      const res = await fetch(`/api/rides/${rideId}/track`);
      if (!res.ok) throw new Error("Failed to track ride");
      return res.json();
    },
    enabled: !!rideId && enabled,
    refetchInterval: 3000, // Refresh every 3s for real-time tracking
  });
}

export function useUpdateRideStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rideId, status }: { rideId: number; status: string }) => {
      const res = await fetch(`/api/rides/${rideId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}

export function useAnalytics(userId: number) {
  return useQuery({
    queryKey: ["/api/analytics/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/user/${userId}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    enabled: !!userId,
  });
}
