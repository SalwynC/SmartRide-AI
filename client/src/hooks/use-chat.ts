import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ChatMessage {
  id: number;
  rideId: number;
  senderId: number;
  senderRole: "passenger" | "driver";
  message: string;
  timestamp: string;
}

export function useChatMessages(rideId: number) {
  return useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", rideId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/${rideId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!rideId,
    refetchInterval: 3000, // Poll every 3s for real-time feel
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      rideId: number;
      senderId: number;
      senderRole: string;
      message: string;
    }) => {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json() as Promise<ChatMessage>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", variables.rideId] });
    },
  });
}
