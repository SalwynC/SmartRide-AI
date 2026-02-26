import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Wallet, Award, BarChart3, PiggyBank } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useDriverEarnings } from "@/hooks/use-earnings";

interface DriverEarningsProps {
  driverId: number;
}

export default function DriverEarningsPanel({ driverId }: DriverEarningsProps) {
  const { data, isLoading, isError, refetch } = useDriverEarnings(driverId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))}
        </div>
        <div className="h-[250px] skeleton rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="glass-panel border-0">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Failed to load earnings</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, dailyBreakdown, weeklyBreakdown } = data;
  const commissionRate = summary.totalGross > 0 ? ((summary.totalCommission / summary.totalGross) * 100).toFixed(0) : "20";

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { 
            title: "Net Earnings", 
            value: `₹${summary.totalNet.toLocaleString("en-IN")}`, 
            icon: Wallet, 
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
          },
          { 
            title: "Avg per Ride", 
            value: `₹${summary.avgPerRide.toFixed(0)}`, 
            icon: TrendingUp, 
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
          },
          { 
            title: "Bonuses", 
            value: `₹${summary.totalBonus.toFixed(0)}`, 
            icon: Award, 
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
          },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Card className={`glass-panel border-0 ${card.border} overflow-hidden stat-glow`}>
              <CardContent className="p-4">
                <div className={`${card.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className={`text-xl font-bold font-display mt-0.5 ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gross / Commission / Net breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-panel border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-primary" /> Earnings Breakdown
              </h3>
              <Badge variant="outline" className="text-[10px]">{commissionRate}% commission</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Gross</p>
                <p className="text-lg font-bold text-foreground">₹{summary.totalGross.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commission</p>
                <p className="text-lg font-bold text-red-400">-₹{summary.totalCommission.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">You Earn</p>
                <p className="text-lg font-bold text-emerald-400">₹{summary.totalNet.toFixed(0)}</p>
              </div>
            </div>
            {/* Visual bar */}
            <div className="mt-3 h-2 rounded-full bg-muted/30 overflow-hidden flex">
              <motion.div
                className="bg-emerald-500 h-full"
                initial={{ width: 0 }}
                animate={{ width: summary.totalGross > 0 ? `${(summary.totalNet / summary.totalGross) * 100}%` : "0%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="bg-red-500/60 h-full"
                initial={{ width: 0 }}
                animate={{ width: summary.totalGross > 0 ? `${(summary.totalCommission / summary.totalGross) * 100}%` : "0%" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Net ({summary.totalGross > 0 ? ((summary.totalNet / summary.totalGross) * 100).toFixed(0) : 0}%)</span>
              <span>Commission ({commissionRate}%)</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Earnings Chart */}
      {dailyBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-panel border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Daily Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="day" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(v: number) => [`₹${v.toFixed(0)}`, "Earned"]}
                  />
                  <Bar dataKey="amount" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Trend */}
      {weeklyBreakdown.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-panel border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" /> Weekly Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyBreakdown}>
                  <defs>
                    <linearGradient id="weeklyEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="week" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(v: number) => [`₹${v.toFixed(0)}`, "Earned"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} fill="url(#weeklyEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-6 text-xs text-muted-foreground py-2"
      >
        <span>{summary.totalRides} completed rides</span>
        <Separator orientation="vertical" className="h-3 bg-white/10" />
        <span>₹{summary.avgPerRide.toFixed(0)} avg/ride</span>
        {summary.totalBonus > 0 && (
          <>
            <Separator orientation="vertical" className="h-3 bg-white/10" />
            <span className="text-amber-400">₹{summary.totalBonus.toFixed(0)} in bonuses</span>
          </>
        )}
      </motion.div>
    </div>
  );
}
