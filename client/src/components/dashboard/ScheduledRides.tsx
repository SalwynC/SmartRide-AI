import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, X, CalendarCheck } from "lucide-react";
import { useScheduledRides } from "@/hooks/use-scheduled-rides";

interface ScheduledRidesProps {
  userId: number;
}

export default function ScheduledRides({ userId }: ScheduledRidesProps) {
  const { data: rides = [], isLoading, isError, refetch } = useScheduledRides(userId);

  if (isLoading) {
    return (
      <Card className="glass-panel border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" /> Scheduled Rides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="glass-panel border-0">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Failed to load scheduled rides</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (rides.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-panel border-0 border-l-2 border-l-primary/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            Scheduled Rides
            <Badge variant="outline" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/30">
              {rides.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          <AnimatePresence>
            {rides.map((ride, idx) => {
              const scheduledDate = new Date(ride.scheduledAt);
              const isToday = scheduledDate.toDateString() === new Date().toDateString();
              const isTomorrow = scheduledDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : scheduledDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
              const timeLabel = scheduledDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

              return (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-lg bg-card/40 border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="font-medium truncate">{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">{ride.dropAddress}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span className={isToday ? "text-amber-400 font-semibold" : ""}>{dateLabel}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {timeLabel}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary">₹{ride.finalFare.toFixed(0)}</div>
                      <div className="text-[10px] text-muted-foreground">{ride.distanceKm.toFixed(1)} km</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
