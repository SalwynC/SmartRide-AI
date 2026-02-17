import { useAdminStats } from "@/hooks/use-admin";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { Activity, Users, DollarSign, Zap } from "lucide-react";

// Mock data for charts since backend only returns aggregates
const mockTrafficData = [
  { time: "08:00", demand: 40 },
  { time: "10:00", demand: 65 },
  { time: "12:00", demand: 85 },
  { time: "14:00", demand: 55 },
  { time: "16:00", demand: 70 },
  { time: "18:00", demand: 95 },
  { time: "20:00", demand: 80 },
];

const mockWaitTimes = [
  { zone: "Downtown", minutes: 3.5 },
  { zone: "Airport", minutes: 8.2 },
  { zone: "Suburbs", minutes: 12.5 },
  { zone: "Tech Park", minutes: 4.1 },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading Analytics...</div>;

  return (
    <div className="space-y-8">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Revenue" 
          value={`$${stats?.revenue.toLocaleString()}`} 
          icon={<DollarSign className="w-5 h-5" />}
          trend="up"
          trendValue="+8.2%"
          delay={0}
        />
        <MetricCard 
          title="Active Drivers" 
          value={stats?.activeDrivers || 0} 
          icon={<Users className="w-5 h-5" />}
          trend="neutral"
          trendValue="Stable"
          delay={1}
        />
        <MetricCard 
          title="Avg Surge" 
          value={`${stats?.avgSurge.toFixed(2)}x`} 
          icon={<Zap className="w-5 h-5" />}
          trend={stats?.avgSurge! > 1.2 ? "up" : "down"}
          trendValue={stats?.avgSurge! > 1.2 ? "High" : "Normal"}
          className={stats?.avgSurge! > 1.5 ? "border-yellow-500/50" : ""}
          delay={2}
        />
        <MetricCard 
          title="Avg Wait Time" 
          value={`${stats?.avgWaitTime.toFixed(1)} min`} 
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
              <AreaChart data={mockTrafficData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
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
              <BarChart data={mockWaitTimes} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="zone" type="category" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={30}>
                  {mockWaitTimes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.minutes > 10 ? '#ef4444' : entry.minutes > 5 ? '#eab308' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
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
