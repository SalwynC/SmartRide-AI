import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/hooks/use-tracking";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { ArrowLeft, TrendingUp, MapPin, Leaf, DollarSign, Car, Clock, Receipt } from "lucide-react";
import RatingDialog from "@/components/modals/RatingDialog";

interface RideHistoryProps {
  userId: number;
  onBack: () => void;
}

export default function RideHistory({ userId, onBack }: RideHistoryProps) {
  const { data: analytics, isLoading } = useAnalytics(userId);
  const [ratingRideId, setRatingRideId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="glass-panel p-6"><div className="h-4 w-24 skeleton mb-3" /><div className="h-8 w-28 skeleton" /></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel h-[300px]" />
          <div className="glass-panel h-[300px]" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No ride data available</p>
        <Button onClick={onBack} className="mt-4" variant="outline">Go Back</Button>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch(status) {
      case "completed": return "bg-emerald-500/20 text-emerald-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      case "in_progress": return "bg-blue-500/20 text-blue-400";
      default: return "bg-amber-500/20 text-amber-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold font-display">Ride History & Analytics</h1>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {analytics.totalRides} Rides
        </Badge>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Spent", value: `₹${analytics.totalSpent.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { title: "Avg Fare", value: `₹${analytics.avgFare.toFixed(0)}`, icon: TrendingUp, color: "text-blue-400" },
          { title: "Total Distance", value: `${analytics.totalDistance.toFixed(1)} km`, icon: MapPin, color: "text-purple-400" },
          { title: "Carbon Saved", value: `${analytics.totalCarbon.toFixed(1)} kg`, icon: Leaf, color: "text-emerald-400" },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="glass-panel border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.title}</span>
                </div>
                <div className="text-2xl font-bold font-display">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-panel border-0">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Monthly Spending</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              {analytics.monthlySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlySpending}>
                    <defs>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0b0f14", borderColor: "#1f2a37" }} itemStyle={{ color: "#e5e7eb" }} />
                    <Area type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpending)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No spending data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Popular Routes */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-panel border-0">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-400" /> Frequent Routes</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              {analytics.popularRoutes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.popularRoutes} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="route" type="category" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} width={140} />
                    <Tooltip contentStyle={{ backgroundColor: "#0b0f14", borderColor: "#1f2a37" }} itemStyle={{ color: "#e5e7eb" }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {analytics.popularRoutes.map((_: any, i: number) => (
                        <Cell key={i} fill={["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No route data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Ride List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-panel border-0">
          <CardHeader><CardTitle className="flex items-center gap-2"><Car className="w-5 h-5 text-primary" /> All Rides</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {analytics.rides.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No rides yet. Book your first ride!</p>
              ) : (
                analytics.rides.map((ride: any) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{ride.pickupAddress} → {ride.dropAddress}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ride.createdAt).toLocaleDateString()}</span>
                          <span>{ride.distanceKm.toFixed(1)} km</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-primary">₹{ride.finalFare.toFixed(2)}</div>
                        <Badge className={`text-[10px] ${statusColor(ride.status)}`}>{ride.status}</Badge>
                      </div>
                      {ride.status === "completed" && (
                        <Button size="sm" variant="ghost" onClick={() => setRatingRideId(ride.id)} className="text-xs">
                          Rate
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rating Dialog */}
      <RatingDialog
        isOpen={ratingRideId !== null}
        onClose={() => setRatingRideId(null)}
        rideId={ratingRideId || 0}
        passengerId={userId}
      />
    </div>
  );
}
