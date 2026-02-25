import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface NotificationItem {
  id: number;
  userId: number;
  type: "ride_update" | "driver_arrival" | "promo" | "system" | "payment";
  title: string;
  message: string;
  read: boolean;
  rideId: number | null;
  createdAt: string;
}

export function useNotifications(userId: number) {
  return useQuery<NotificationItem[]>({
    queryKey: ["/api/notifications", userId],
    queryFn: async () => {
      const res = await fetch(`/api/notifications/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 10000, // Poll every 10s for real-time feel
  });
}

export function useUnreadCount(userId: number) {
  return useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread", userId],
    queryFn: async () => {
      const res = await fetch(`/api/notifications/${userId}/unread`);
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/notifications/${userId}/read-all`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}
