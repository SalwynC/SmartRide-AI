import { useZones } from "@/hooks/use-zones";
import { useAdminStats } from "@/hooks/use-admin";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Users, DollarSign } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";

const mockEarningsTrend = [
  { time: "10:00", value: 18 },
  { time: "12:00", value: 32 },
  { time: "14:00", value: 28 },
  { time: "16:00", value: 46 },
  { time: "18:00", value: 60 },
  { time: "20:00", value: 48 },
];

export default function DriverDashboard() {
  const { data: zones, isLoading: loadingZones, error: zonesError } = useZones();
  const { data: stats, error: statsError } = useAdminStats();

  return (
    <div className="space-y-8">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Today's Earnings" 
          value={`₹${(stats?.revenue ? stats.revenue * 0.2 : 142.50).toFixed(2)}`} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend="up" 
          trendValue="+12%" 
          delay={0}
        />
        <MetricCard 
          title="Hours Online" 
          value="6.4" 
          icon={<ClockIcon />} 
          delay={1}
        />
        <MetricCard 
          title="Completed Rides" 
          value={stats ? Math.floor(stats.totalRides / 5).toString() : "12"} 
          icon={<CarIcon />} 
          trend="neutral" 
          trendValue="Avg"
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
            
            <div className="absolute bottom-4 right-6 bg-black/80 backdrop-blur px-3 py-1.5 rounded-full text-xs text-white/70 border border-white/10 flex items-center gap-2">
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
                  <Tooltip contentStyle={{ backgroundColor: "#0b0f14", borderColor: "#1f2a37" }} itemStyle={{ color: "#e5e7eb" }} />
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
