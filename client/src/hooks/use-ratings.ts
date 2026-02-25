import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { rideId: number; passengerId: number; driverId?: number; stars: number; comment?: string }) => {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rides"] });
    },
  });
}

export function useRideRatings(rideId: number) {
  return useQuery({
    queryKey: ["/api/ratings/ride", rideId],
    queryFn: async () => {
      const res = await fetch(`/api/ratings/ride/${rideId}`);
      if (!res.ok) throw new Error("Failed to fetch ratings");
      return res.json();
    },
    enabled: !!rideId,
  });
}

export function useDriverRatings(driverId: number) {
  return useQuery({
    queryKey: ["/api/ratings/driver", driverId],
    queryFn: async () => {
      const res = await fetch(`/api/ratings/driver/${driverId}`);
      if (!res.ok) throw new Error("Failed to fetch driver ratings");
      return res.json();
    },
    enabled: !!driverId,
  });
}
