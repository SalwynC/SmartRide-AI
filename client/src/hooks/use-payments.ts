import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PaymentData {
  id: number;
  rideId: number;
  userId: number;
  amount: number;
  method: "upi" | "card" | "wallet" | "cash";
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId: string | null;
  breakdown: {
    baseFare: number;
    surgeAmount: number;
    tax: number;
    discount: number;
    total: number;
  } | null;
  createdAt: string;
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      rideId: number;
      userId: number;
      amount: number;
      method: string;
      breakdown?: any;
    }) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Payment failed");
      return res.json() as Promise<PaymentData>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
  });
}

export function useRidePayment(rideId: number) {
  return useQuery<PaymentData>({
    queryKey: ["/api/payments/ride", rideId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/ride/${rideId}`);
      if (!res.ok) throw new Error("No payment found");
      return res.json();
    },
    enabled: !!rideId,
  });
}

export function useUserPayments(userId: number) {
  return useQuery<PaymentData[]>({
    queryKey: ["/api/payments/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!userId,
  });
}
