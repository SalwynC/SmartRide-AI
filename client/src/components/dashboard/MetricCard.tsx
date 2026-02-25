import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  delay?: number;
}

export function MetricCard({ title, value, icon, trend, trendValue, className, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
    >
      <Card className={cn("glass-panel overflow-hidden relative", className)}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-amber-400" />
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none scale-150">
          {icon}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
            {icon && <div className="text-primary opacity-80">{icon}</div>}
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold font-display text-foreground">{value}</div>
            {trend && (
              <div className={cn(
                "text-xs font-medium mb-1 px-1.5 py-0.5 rounded-full flex items-center",
                trend === "up" ? "text-green-400 bg-green-400/10" : 
                trend === "down" ? "text-red-400 bg-red-400/10" : 
                "text-gray-400 bg-gray-400/10"
              )}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
