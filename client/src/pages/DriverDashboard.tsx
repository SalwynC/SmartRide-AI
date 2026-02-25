import { useState } from "react";
import { useZones } from "@/hooks/use-zones";
import { useAdminStats } from "@/hooks/use-admin";
import { useAllRides } from "@/hooks/use-rides";
import { useUpdateRideStatus } from "@/hooks/use-tracking";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Users, DollarSign, CheckCircle, XCircle, Navigation, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const mockEarningsTrend = [
  { time: "10:00", value: 18 },
  { time: "12:00", value: 32 },
  { time: "14:00", value: 28 },
  { time: "16:00", value: 46 },
  { time: "18:00", value: 60 },
  { time: "20:00", value: 48 },
];

export default function DriverDashboard() {
  const { user } = useAuth();
  const driverId = user?.id ?? 2;
  const { data: zones, isLoading: loadingZones, error: zonesError } = useZones();
  const { data: stats, error: statsError } = useAdminStats();
  const { data: allRides } = useAllRides();
  const updateStatus = useUpdateRideStatus();
  const { toast } = useToast();

  // Filter rides by status for driver view
  const pendingRides = allRides?.filter(r => r.status === "pending") || [];
  const activeRides = allRides?.filter(r => r.status === "accepted" || r.status === "in_progress") || [];
  const completedRides = allRides?.filter(r => r.status === "completed") || [];
  const todayEarnings = completedRides.reduce((sum, r) => sum + r.finalFare, 0);

  function handleAcceptRide(rideId: number) {
    updateStatus.mutate(
      { rideId, status: "accepted" },
      {
        onSuccess: () => {
          toast({ title: "✅ Ride Accepted!", description: `Ride #${rideId} — head to pickup location` });
        },
      }
    );
  }

  function handleStartRide(rideId: number) {
    updateStatus.mutate(
      { rideId, status: "in_progress" },
      {
        onSuccess: () => {
          toast({ title: "🚗 Ride Started!", description: "Drive safely!" });
        },
      }
    );
  }

  function handleCompleteRide(rideId: number) {
    updateStatus.mutate(
      { rideId, status: "completed" },
      {
        onSuccess: () => {
          toast({ title: "🎉 Ride Completed!", description: "Payment will be processed" });
        },
      }
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Today's Earnings" 
          value={`₹${todayEarnings.toFixed(2)}`} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend="up" 
          trendValue="+12%" 
          delay={0}
        />
        <MetricCard 
          title="Pending Requests" 
          value={pendingRides.length.toString()} 
          icon={<ClockIcon />} 
          trend={pendingRides.length > 0 ? "up" : "neutral"}
          trendValue={pendingRides.length > 0 ? "New!" : "None"}
          delay={1}
        />
        <MetricCard 
          title="Completed Rides" 
          value={completedRides.length.toString()} 
          icon={<CarIcon />} 
          trend="neutral" 
          trendValue="Today"
          delay={2}
        />
        <MetricCard 
          title="Driver Rating" 
          value="4.92" 
          icon={<StarIcon />} 
          className="border-primary/30"
          delay={3}
        />
      </div>

      {/* Ride Requests & Active Rides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Ride Requests */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Incoming Requests
            {pendingRides.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
                {pendingRides.length} New
              </Badge>
            )}
          </h2>
          {pendingRides.length === 0 ? (
            <Card className="glass-panel border-0">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending ride requests</p>
                <p className="text-xs mt-1">New requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              <AnimatePresence>
                {pendingRides.map((ride) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Card className="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Ride #{ride.id}</div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-medium">{ride.pickupAddress}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm mt-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-400" />
                              <span className="font-medium">{ride.dropAddress}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">₹{ride.finalFare.toFixed(0)}</div>
                            <div className="text-xs text-muted-foreground">{ride.distanceKm.toFixed(1)} km</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRide(ride.id)}
                            disabled={updateStatus.isPending}
                            className="flex-1 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Accept
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Active Rides */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            🚗 Active Rides
            {activeRides.length > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {activeRides.length} Active
              </Badge>
            )}
          </h2>
          {activeRides.length === 0 ? (
            <Card className="glass-panel border-0">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active rides</p>
                <p className="text-xs mt-1">Accept a request to start</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {activeRides.map((ride) => (
                <motion.div key={ride.id} layout>
                  <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">Ride #{ride.id}</span>
                            <Badge className={`text-[10px] ${ride.status === "accepted" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                              {ride.status === "accepted" ? "Heading to pickup" : "In Progress"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{ride.pickupAddress}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm mt-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            <span>{ride.dropAddress}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">₹{ride.finalFare.toFixed(0)}</div>
                      </div>
                      {ride.status === "accepted" ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartRide(ride.id)}
                          disabled={updateStatus.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                          <Navigation className="w-4 h-4 mr-1" /> Start Ride
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteRide(ride.id)}
                          disabled={updateStatus.isPending}
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Complete Ride
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Live Demand Heatmap</h2>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
              Live Updates
            </Badge>
          </div>
          
          <Card className="glass-panel min-h-[400px] p-6 relative overflow-hidden">
            {loadingZones ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 h-full">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="h-24 rounded-xl skeleton" />
                ))}
              </div>
            ) : zonesError ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">Failed to load zones.</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 h-full">
                {zones?.map((zone) => {
                  const intensity = zone.demandScore || 0;
                  // Color interpolation from blue (low) to red (high)
                  const opacity = 0.2 + (intensity / 10) * 0.6;
                  const isHot = intensity > 7;
                  
                  return (
                    <motion.div
                      key={zone.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-xl border border-white/5 relative group cursor-pointer overflow-hidden"
                      style={{
                        backgroundColor: isHot 
                          ? `rgba(245, 158, 11, ${opacity})`
                          : `rgba(20, 184, 166, ${opacity})`
                      }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                        <span className="font-bold text-white drop-shadow-md">{zone.name}</span>
                        <span className="text-xs text-white/80 font-mono mt-1">
                          Score: {zone.demandScore?.toFixed(1)}
                        </span>
                      </div>
                      {isHot && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-ping" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            <div className="absolute bottom-4 right-6 bg-card/80 backdrop-blur px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-border/30 flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm opacity-80" /> High Demand
              <div className="w-3 h-3 bg-emerald-500 rounded-sm opacity-50 ml-2" /> Low Demand
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">Recommended Zones</h2>
          <div className="space-y-3">
            {loadingZones ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="glass-panel p-4">
                  <div className="h-4 w-28 skeleton mb-2" />
                  <div className="h-3 w-40 skeleton" />
                </div>
              ))
            ) : zonesError ? (
              <div className="text-sm text-muted-foreground">Recommendations unavailable.</div>
            ) : (
              zones
                ?.sort((a, b) => (b.demandScore || 0) - (a.demandScore || 0))
                .slice(0, 4)
                .map((zone, idx) => (
                <motion.div
                  key={zone.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:bg-white/5 transition-colors cursor-pointer border-white/5">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold">{zone.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {zone.availableDrivers} Drivers nearby
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">
                          {(zone.trafficIndex ?? 0) > 7 ? "Heavy Traffic" : "Clear Traffic"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {zone.trafficIndex}/10 Density
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          <Card className="glass-panel border-white/5">
            <CardHeader>
              <CardTitle>Earnings Pulse</CardTitle>
            </CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockEarningsTrend} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2.5} fill="url(#earningsPulse)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Simple icons for metrics
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
