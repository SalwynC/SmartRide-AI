import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type BookingRequest } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

// --- QUOTES / PREDICTION ---
export function useRideQuote() {
  return useMutation({
    mutationFn: async (data: BookingRequest) => {
      const res = await apiRequest(api.rides.predict.method, api.rides.predict.path, data);
      return api.rides.predict.responses[200].parse(await res.json());
    },
  });
}

// --- CREATE RIDE (requires auth — passenger only) ---
export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookingRequest) => {
      const res = await apiRequest(api.rides.create.method, api.rides.create.path, data);
      return api.rides.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rides.list.path] });
    },
  });
}

// --- LIST RIDES (passenger's own rides) ---
export function useRides(userId?: number) {
  const url = userId 
    ? buildUrl(api.rides.list.path) + `?userId=${userId}`
    : api.rides.list.path;
    
  return useQuery({
    queryKey: [api.rides.list.path, userId],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch rides");
      return api.rides.list.responses[200].parse(await res.json());
    },
    enabled: !!userId,
  });
}

// --- LIST ALL RIDES (admin view) ---
export function useAllRides() {
  return useQuery({
    queryKey: [api.rides.list.path, "all"],
    queryFn: async () => {
      const res = await fetch(api.rides.list.path);
      if (!res.ok) throw new Error("Failed to fetch rides");
      return api.rides.list.responses[200].parse(await res.json());
    },
  });
}

// --- DRIVER: pending rides available to accept ---
export function usePendingRides() {
  return useQuery({
    queryKey: [api.rides.list.path, "pending"],
    queryFn: async () => {
      const res = await fetch(`${api.rides.list.path}?status=pending`);
      if (!res.ok) throw new Error("Failed to fetch pending rides");
      return api.rides.list.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Poll every 10s for new ride requests
  });
}

// --- DRIVER: rides assigned to this driver ---
export function useDriverRides(driverId?: number) {
  return useQuery({
    queryKey: [api.rides.list.path, "driver", driverId],
    queryFn: async () => {
      const res = await fetch(`${api.rides.list.path}?driverId=${driverId}`);
      if (!res.ok) throw new Error("Failed to fetch driver rides");
      return api.rides.list.responses[200].parse(await res.json());
    },
    enabled: !!driverId,
    refetchInterval: 10000,
  });
}

// --- DRIVER: accept a pending ride ---
export function useAcceptRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rideId: number) => {
      const res = await apiRequest("POST", `/api/rides/${rideId}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.rides.list.path] });
    },
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
