import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type BookingRequest } from "@shared/routes";

// --- QUOTES / PREDICTION ---
export function useRideQuote() {
  return useMutation({
    mutationFn: async (data: BookingRequest) => {
      const res = await fetch(api.rides.predict.path, {
        method: api.rides.predict.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to get quote");
      return api.rides.predict.responses[200].parse(await res.json());
    },
  });
}

// --- CREATE RIDE ---
export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookingRequest) => {
      const res = await fetch(api.rides.create.path, {
        method: api.rides.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to book ride");
      return api.rides.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rides.list.path] });
    },
  });
}

// --- LIST RIDES ---
export function useRides(userId?: number) {
  const url = userId 
    ? buildUrl(api.rides.list.path) + `?userId=${userId}` // In a real app, query params handled better
    : api.rides.list.path;
    
  return useQuery({
    queryKey: [api.rides.list.path, userId],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch rides");
      return api.rides.list.responses[200].parse(await res.json());
    },
    enabled: !!userId, // Only fetch if we have a user ID
  });
}

// --- GET SINGLE RIDE ---
export function useRide(id: number) {
  return useQuery({
    queryKey: [api.rides.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.rides.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ride");
      return api.rides.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
