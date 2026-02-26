import { useQuery } from "@tanstack/react-query";

export interface EarningEntry {
  id: number;
  driverId: number;
  rideId: number;
  grossAmount: number;
  commission: number;
  netEarnings: number;
  bonusAmount: number;
  createdAt: string;
}

export interface EarningsSummary {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  totalBonus: number;
  totalRides: number;
  avgPerRide: number;
}

export interface EarningsResponse {
  summary: EarningsSummary;
  earnings: EarningEntry[];
  dailyBreakdown: { day: string; amount: number }[];
  weeklyBreakdown: { week: string; amount: number }[];
  completedRides: number;
}

export function useDriverEarnings(driverId?: number) {
  return useQuery<EarningsResponse>({
    queryKey: ["/api/driver/earnings", driverId],
    queryFn: async () => {
      const res = await fetch(`/api/driver/earnings/${driverId}`);
      if (!res.ok) throw new Error("Failed to load earnings");
      return res.json();
    },
    enabled: !!driverId,
    refetchInterval: 30000, // Refresh every 30s
  });
}
