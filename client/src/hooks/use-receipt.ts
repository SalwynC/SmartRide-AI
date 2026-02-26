import { useQuery } from "@tanstack/react-query";

export interface ReceiptBreakdown {
  baseFare: number;
  distanceCharge: number;
  surgeAmount: number;
  surgeMultiplier: number;
  subtotal: number;
  gst: number;
  platformFee: number;
  total: number;
}

export interface ReceiptPayment {
  method: string;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
}

export interface TripReceipt {
  receiptId: string;
  rideId: number;
  date: string;
  passengerName: string;
  driverName: string;
  pickup: string;
  drop: string;
  distanceKm: number;
  duration: number;
  breakdown: ReceiptBreakdown;
  payment: ReceiptPayment | null;
  carbonSaved: number;
  fairnessScore: number;
}

export function useReceipt(rideId?: number) {
  return useQuery<TripReceipt>({
    queryKey: ["/api/rides/receipt", rideId],
    queryFn: async () => {
      const res = await fetch(`/api/rides/${rideId}/receipt`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Failed" }));
        throw new Error(body.message || "Failed to load receipt");
      }
      return res.json();
    },
    enabled: !!rideId,
    staleTime: Infinity, // Receipts don't change
  });
}
