import { useAdminStats } from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, RadialBarChart, RadialBar, PieChart, Pie } from "recharts";
import { Activity, Users, DollarSign, Zap } from "lucide-react";

// Hook for real analytics chart data
function useAdminAnalytics() {
  return useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", {
        headers: { "x-user-id": "1" },
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json() as Promise<{
        demandByHour: { time: string; demand: number }[];
        waitByZone: { zone: string; minutes: number }[];
        fleetUtilization: { name: string; value: number; fill: string }[];
        revenueMix: { name: string; value: number; fill: string }[];
      }>;
    },
    refetchInterval: 10000,
  });
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();
  const { data: analytics } = useAdminAnalytics();

  // Fallback data while analytics loads
  const demandData = analytics?.demandByHour ?? [];
  const waitData = analytics?.waitByZone ?? [];
  const utilizationData = analytics?.fleetUtilization ?? [
    { name: "Active", value: 0, fill: "#14b8a6" },
    { name: "Idle", value: 0, fill: "#f59e0b" },
    { name: "Offline", value: 100, fill: "#64748b" },
  ];
  const revenueData = analytics?.revenueMix ?? [];
  const activePercent = utilizationData.find(d => d.name === "Active")?.value ?? 0;

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="glass-panel p-6">
            <div className="h-3 w-24 skeleton mb-4" />
            <div className="h-8 w-28 skeleton" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel h-[300px]" />
        <div className="glass-panel h-[300px]" />
      </div>
      <div className="glass-panel h-[240px]" />
    </div>
  );

  if (error || !stats) return (
    <div className="p-8 text-center">
      <div className="text-muted-foreground text-lg mb-4">Unable to load analytics</div>
      <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Revenue" 
          value={`₹${(stats.revenue || 0).toLocaleString()}`} 
          icon={<DollarSign className="w-5 h-5" />}
          trend="up"
          trendValue="+8.2%"
          delay={0}
        />
        <MetricCard 
          title="Active Drivers" 
          value={stats.activeDrivers || 0} 
          icon={<Users className="w-5 h-5" />}
          trend="neutral"
          trendValue="Stable"
          delay={1}
        />
        <MetricCard 
          title="Avg Surge" 
          value={`${(stats.avgSurge || 1).toFixed(2)}x`} 
          icon={<Zap className="w-5 h-5" />}
          trend={(stats.avgSurge || 1) > 1.2 ? "up" : "down"}
          trendValue={(stats.avgSurge || 1) > 1.2 ? "High" : "Normal"}
          className={(stats.avgSurge || 1) > 1.5 ? "border-yellow-500/50" : ""}
          delay={2}
        />
        <MetricCard 
          title="Avg Wait Time" 
          value={`${(stats.avgWaitTime || 0).toFixed(1)} min`} 
          icon={<Activity className="w-5 h-5" />}
          trend="down"
          trendValue="-0.5m"
          delay={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demand Chart */}
        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle>Demand Forecast</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="demand" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Wait Times Bar Chart */}
        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle>Wait Times by Zone</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="zone" type="category" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={30}>
                  {waitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.minutes > 10 ? '#f97316' : entry.minutes > 5 ? '#f59e0b' : '#14b8a6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-panel border-white/5 lg:col-span-1">
          <CardHeader>
            <CardTitle>Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="40%" outerRadius="90%" data={utilizationData} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-display text-foreground">{activePercent}%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Active</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={6} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Zone Details Table (Simplified) */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Live Zone Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b [&_tr]:border-white/10">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Zone Name</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Demand Score</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Traffic Index</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Drivers</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {stats?.zoneStats.map((zone) => (
                  <tr key={zone.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4 align-middle font-medium">{zone.name}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(zone.demandScore! / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs">{zone.demandScore?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">{zone.trafficIndex}</td>
                    <td className="p-4 align-middle">{zone.availableDrivers}</td>
                    <td className="p-4 align-middle text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        zone.demandScore! > 7 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                      }`}>
                        {zone.demandScore! > 7 ? 'SURGE' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
