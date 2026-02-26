import { useState } from "react";
import { useZones } from "@/hooks/use-zones";
import { usePendingRides, useDriverRides, useAcceptRide } from "@/hooks/use-rides";
import { useUpdateRideStatus, useDriverRating } from "@/hooks/use-tracking";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, TrendingUp, DollarSign, CheckCircle, Navigation, Clock, Star, Car, ArrowUpRight, Wallet } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IndiaMap } from "@/components/maps/DelhiMap";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import DriverEarningsPanel from "@/components/dashboard/DriverEarningsPanel";

export default function DriverDashboard() {
  const { user } = useAuth();
  const driverId = user?.id;
  const { toast } = useToast();
  const [selectedCity] = useState("delhi");

  // Driver-specific data hooks
  const { data: pendingRides = [], isError: pendingError, refetch: refetchPending } = usePendingRides();
  const { data: driverRides = [], isError: driverRidesError, refetch: refetchDriverRides } = useDriverRides(driverId);
  const { data: zones, isLoading: loadingZones } = useZones();
  const acceptRide = useAcceptRide();
  const updateStatus = useUpdateRideStatus();
  const { data: ratingData } = useDriverRating(driverId);
  const driverRating = ratingData?.averageRating?.toFixed(2) ?? "5.00";

  // Derived state — driver's own rides only
  const activeRides = driverRides.filter(r => r.status === "accepted" || r.status === "in_progress");
  const completedRides = driverRides.filter(r => r.status === "completed");
  const todayEarnings = completedRides.reduce((sum, r) => sum + r.finalFare, 0);
  const totalRides = driverRides.length;

  // Map: show first active ride route on map
  const activeRide = activeRides[0];
  const mapPickup = activeRide?.pickupAddress || undefined;
  const mapDrop = activeRide?.dropAddress || undefined;

  function handleAcceptRide(rideId: number) {
    acceptRide.mutate(rideId, {
      onSuccess: () => {
        toast({ title: "Ride Accepted!", description: `Ride #${rideId} — head to pickup location` });
      },
      onError: (err) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      },
    });
  }

  function handleStartRide(rideId: number) {
    updateStatus.mutate(
      { rideId, status: "in_progress" },
      { onSuccess: () => toast({ title: "Ride Started!", description: "Drive safely!" }) }
    );
  }

  function handleCompleteRide(rideId: number) {
    updateStatus.mutate(
      { rideId, status: "completed" },
      { onSuccess: () => toast({ title: "Ride Completed!", description: "Payment will be processed" }) }
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, <span className="text-primary">{user?.username || "Driver"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeRides.length > 0 ? `${activeRides.length} active ride${activeRides.length > 1 ? "s" : ""}` : "Ready to accept rides"}
          </p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 self-start">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Earnings" value={`₹${todayEarnings.toFixed(0)}`} icon={<DollarSign className="w-5 h-5" />} trend="up" trendValue={completedRides.length > 0 ? `${completedRides.length} rides` : "No rides yet"} delay={0} />
        <MetricCard title="New Requests" value={pendingRides.length.toString()} icon={<Clock className="w-5 h-5" />} trend={pendingRides.length > 0 ? "up" : "neutral"} trendValue={pendingRides.length > 0 ? "Available" : "None"} delay={1} />
        <MetricCard title="Total Rides" value={totalRides.toString()} icon={<Car className="w-5 h-5" />} trend="neutral" trendValue="Lifetime" delay={2} />
        <MetricCard title="Rating" value={driverRating} icon={<Star className="w-5 h-5" />} className="border-primary/30" delay={3} />
      </div>

      {/* Map + Ride Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" /> Live Map
            </h2>
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 mr-1" /> Live
            </Badge>
          </div>
          <Card className="glass-panel border-0 overflow-hidden">
            <CardContent className="p-0 min-h-[420px]">
              <IndiaMap cityKey={selectedCity} pickupZone={mapPickup} dropZone={mapDrop} showRoute={!!activeRide} />
            </CardContent>
          </Card>
        </div>

        {/* Ride Tabs */}
        <div>
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="requests" className="text-xs relative">
                Requests
                {pendingRides.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingRides.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
            </TabsList>

            {/* Pending Requests */}
            <TabsContent value="requests" className="mt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {pendingError ? (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground mb-2">Failed to load requests</p>
                  <Button variant="outline" size="sm" onClick={() => refetchPending()}>Retry</Button>
                </div>
              ) : pendingRides.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No pending requests</p>
                  <p className="text-xs mt-1">New rides will appear here</p>
                </div>
              ) : (
                <AnimatePresence>
                  {pendingRides.map((ride) => (
                    <motion.div key={ride.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <Card className="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-sm">
                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="font-medium truncate">{ride.pickupAddress}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm mt-0.5">
                                <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                                <span className="truncate">{ride.dropAddress}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <div className="text-lg font-bold text-primary">₹{ride.finalFare.toFixed(0)}</div>
                              <div className="text-[10px] text-muted-foreground">{ride.distanceKm.toFixed(1)} km</div>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleAcceptRide(ride.id)} disabled={acceptRide.isPending} className="w-full bg-gradient-to-r from-primary to-emerald-400 text-black font-bold h-8">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept Ride
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>

            {/* Active Rides */}
            <TabsContent value="active" className="mt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {activeRides.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Navigation className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No active rides</p>
                  <p className="text-xs mt-1">Accept a request to get started</p>
                </div>
              ) : (
                activeRides.map((ride) => (
                  <motion.div key={ride.id} layout>
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-[10px] ${ride.status === "accepted" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {ride.status === "accepted" ? "En route to pickup" : "In Progress"}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">#{ride.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{ride.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm mt-0.5 mb-2">
                          <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate">{ride.dropAddress}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-primary">₹{ride.finalFare.toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">{ride.distanceKm.toFixed(1)} km</span>
                        </div>
                        {ride.status === "accepted" ? (
                          <Button size="sm" onClick={() => handleStartRide(ride.id)} disabled={updateStatus.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-8">
                            <Navigation className="w-3.5 h-3.5 mr-1" /> Start Ride
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleCompleteRide(ride.id)} disabled={updateStatus.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold h-8">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* Completed */}
            <TabsContent value="completed" className="mt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {completedRides.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No completed rides yet</p>
                </div>
              ) : (
                completedRides.slice(0, 10).map((ride) => (
                  <Card key={ride.id} className="border-border/30">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{ride.pickupAddress} → {ride.dropAddress}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ride.distanceKm.toFixed(1)} km • {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : ""}</div>
                      </div>
                      <div className="text-sm font-bold text-primary ml-2">₹{ride.finalFare.toFixed(0)}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Zone Recommendations + Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold font-display mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> High Demand Zones
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {loadingZones ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)
            ) : (
              zones?.sort((a, b) => (b.demandScore || 0) - (a.demandScore || 0)).slice(0, 8).map((zone, idx) => {
                const intensity = zone.demandScore || 0;
                const isHot = intensity > 7;
                return (
                  <motion.div key={zone.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                    <Card className={`border-0 overflow-hidden ${isHot ? "bg-amber-500/10" : "bg-muted/30"}`}>
                      <CardContent className="p-3 text-center">
                        <div className="font-bold text-sm truncate">{zone.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{zone.city}</div>
                        <div className={`text-lg font-bold mt-1 ${isHot ? "text-amber-400" : "text-emerald-400"}`}>{intensity.toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground">demand</div>
                        {isHot && (
                          <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                            <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> High
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Driver Earnings Panel */}
        {driverId && <DriverEarningsPanel driverId={driverId} />}
      </div>
    </div>
  );
}
