import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRideTracking, useUpdateRideStatus } from "@/hooks/use-tracking";
import { Navigation, Phone, Star, Car, MapPin, Clock, X, MessageCircle, CreditCard } from "lucide-react";
import ChatPanel from "@/components/dashboard/ChatPanel";
import PaymentModal from "@/components/modals/PaymentModal";
import RatingDialog from "@/components/modals/RatingDialog";

interface RideTrackerProps {
  rideId: number;
  userId: number;
  fare: number;
  baseFare: number;
  surgeMultiplier: number;
  onClose: () => void;
}

const statusSteps = [
  { key: "pending", label: "Finding Driver", emoji: "🔍" },
  { key: "accepted", label: "Driver Assigned", emoji: "✅" },
  { key: "in_progress", label: "On The Way", emoji: "🚗" },
  { key: "completed", label: "Arrived!", emoji: "🎉" },
];

export default function RideTracker({ rideId, userId, fare, baseFare, surgeMultiplier, onClose }: RideTrackerProps) {
  const { data: tracking } = useRideTracking(rideId);
  const updateStatus = useUpdateRideStatus();
  const [showPayment, setShowPayment] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [simulatedStep, setSimulatedStep] = useState(0);

  // Auto-simulate ride progression for demo
  useEffect(() => {
    const statuses = ["accepted", "in_progress", "completed"];
    const timers: NodeJS.Timeout[] = [];

    statuses.forEach((status, idx) => {
      const timer = setTimeout(() => {
        updateStatus.mutate({ rideId, status });
        setSimulatedStep(idx + 1);
        if (status === "completed") {
          // Show payment after ride completes
          setTimeout(() => setShowPayment(true), 1500);
        }
      }, (idx + 1) * 5000); // Every 5 seconds
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [rideId]);

  const currentStatus = tracking?.status || statusSteps[simulatedStep]?.key || "pending";
  const currentStepIndex = statusSteps.findIndex(s => s.key === currentStatus);
  const progressPercent = ((currentStepIndex + 1) / statusSteps.length) * 100;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Live Tracking</h2>
              <p className="text-xs text-muted-foreground">Ride #{rideId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
          {/* Progress Steps */}
          <Card className="glass-panel border-0">
            <CardContent className="p-6">
              <div className="mb-4">
                <Progress value={progressPercent} className="h-2" />
              </div>
              <div className="flex justify-between">
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isActive
                            ? "bg-primary/20 ring-2 ring-primary"
                            : "bg-muted"
                        }`}
                      >
                        {step.emoji}
                      </motion.div>
                      <span className={`text-[10px] font-medium ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Driver Info Card */}
          <AnimatePresence>
            {(currentStatus === "accepted" || currentStatus === "in_progress" || currentStatus === "completed") && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="glass-panel border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                        👨‍✈️
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{tracking?.driverName || "Raj Kumar"}</h3>
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {tracking?.driverRating || 4.85}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {tracking?.vehicleInfo || "White Suzuki Swift - DL 01 AB 1234"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Map Simulation */}
          <Card className="glass-panel border-0 overflow-hidden">
            <CardContent className="p-0 relative">
              <div className="h-[300px] bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={`h-${i}`} className="absolute border-b border-white/20 w-full" style={{ top: `${i * 10}%` }} />
                  ))}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={`v-${i}`} className="absolute border-r border-white/20 h-full" style={{ left: `${i * 10}%` }} />
                  ))}
                </div>

                {/* Pickup marker */}
                <motion.div
                  className="absolute"
                  style={{ left: "20%", top: "60%" }}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-emerald-400 whitespace-nowrap font-medium">Pickup</span>
                  </div>
                </motion.div>

                {/* Drop marker */}
                <motion.div
                  className="absolute"
                  style={{ left: "75%", top: "25%" }}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-blue-400 whitespace-nowrap font-medium">Drop-off</span>
                  </div>
                </motion.div>

                {/* Route line */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                  <line x1="21%" y1="60%" x2="76%" y2="25%" stroke="rgba(20, 184, 166, 0.4)" strokeWidth="2" strokeDasharray="6,4" />
                </svg>

                {/* Driver car */}
                <motion.div
                  className="absolute z-10"
                  animate={{
                    left: `${20 + (tracking?.progress || simulatedStep / 3) * 55}%`,
                    top: `${60 - (tracking?.progress || simulatedStep / 3) * 35}%`,
                  }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                      <Car className="w-5 h-5 text-black" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  </motion.div>
                </motion.div>

                {/* ETA overlay */}
                {tracking?.eta !== null && tracking?.eta !== undefined && (
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-xs text-muted-foreground">ETA</span>
                        <p className="text-lg font-bold text-white">{tracking.eta} min</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fare Info */}
          <Card className="glass-panel border-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Fare</p>
                  <p className="text-xl font-bold text-foreground">₹{fare.toFixed(2)}</p>
                </div>
              </div>
              {currentStatus === "completed" && (
                <Button onClick={() => setShowPayment(true)} className="bg-gradient-to-r from-primary to-emerald-400 text-black font-bold">
                  Pay Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Panel (floating) */}
        {(currentStatus === "accepted" || currentStatus === "in_progress") && (
          <ChatPanel
            rideId={rideId}
            userId={userId}
            userRole="passenger"
            driverName={tracking?.driverName || "Raj Kumar"}
          />
        )}
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          setShowRating(true);
        }}
        rideId={rideId}
        userId={userId}
        fare={fare}
        baseFare={baseFare}
        surgeMultiplier={surgeMultiplier}
      />

      {/* Rating Dialog */}
      <RatingDialog
        isOpen={showRating}
        onClose={() => {
          setShowRating(false);
          onClose();
        }}
        rideId={rideId}
        passengerId={userId}
        driverName={tracking?.driverName || "Raj Kumar"}
      />
    </>
  );
}
