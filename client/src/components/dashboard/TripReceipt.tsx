import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, X, Download, MapPin, Clock, Leaf, ShieldCheck, CreditCard, Car } from "lucide-react";
import { useReceipt, type TripReceipt as TripReceiptData } from "@/hooks/use-receipt";

interface TripReceiptProps {
  rideId: number;
  onClose: () => void;
}

export default function TripReceipt({ rideId, onClose }: TripReceiptProps) {
  const { data: receipt, isLoading, isError, error } = useReceipt(rideId);

  function handleDownload() {
    if (!receipt) return;
    // Generate text receipt for download
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `       SMARTRIDE RECEIPT`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Receipt ID: ${receipt.receiptId}`,
      `Date: ${new Date(receipt.date).toLocaleString("en-IN")}`,
      ``,
      `Passenger: ${receipt.passengerName}`,
      `Driver: ${receipt.driverName}`,
      ``,
      `Pickup: ${receipt.pickup}`,
      `Drop: ${receipt.drop}`,
      `Distance: ${receipt.distanceKm.toFixed(2)} km`,
      `Duration: ${receipt.duration} min`,
      ``,
      `━━━━━━ FARE BREAKDOWN ━━━━━━`,
      `Base Fare:        ₹${receipt.breakdown.baseFare.toFixed(2)}`,
      `Distance Charge:  ₹${receipt.breakdown.distanceCharge.toFixed(2)}`,
      receipt.breakdown.surgeAmount > 0 ? `Surge (${receipt.breakdown.surgeMultiplier}x):  ₹${receipt.breakdown.surgeAmount.toFixed(2)}` : null,
      `─────────────────────────────`,
      `Subtotal:         ₹${receipt.breakdown.subtotal.toFixed(2)}`,
      `GST (5%):         ₹${receipt.breakdown.gst.toFixed(2)}`,
      `Platform Fee:     ₹${receipt.breakdown.platformFee.toFixed(2)}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `TOTAL:            ₹${receipt.breakdown.total.toFixed(2)}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `CO₂ Saved: ${receipt.carbonSaved.toFixed(2)} kg`,
      `Fairness Score: ${receipt.fairnessScore}/10`,
      receipt.payment ? `Payment: ${receipt.payment.method.toUpperCase()} — ${receipt.payment.status}` : `Payment: Pending`,
      ``,
      `Thank you for riding with SmartRide!`,
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SmartRide-Receipt-${receipt.receiptId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card/95 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden receipt-paper">
          {/* Header gradient */}
          <motion.div
            className="h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-cyan-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-primary" />
              Trip Receipt
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-6 skeleton rounded" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-6">
                <p className="text-sm text-red-400 mb-1">Failed to load receipt</p>
                <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
              </div>
            ) : receipt ? (
              <>
                {/* Receipt ID & Date */}
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-[10px] font-mono">{receipt.receiptId}</Badge>
                  <span className="text-muted-foreground">{new Date(receipt.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                </div>

                {/* Route */}
                <div className="p-3 rounded-lg bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{receipt.pickup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{receipt.drop}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="w-3 h-3" /> {receipt.distanceKm.toFixed(2)} km
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {receipt.duration} min
                    </span>
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-medium">{receipt.driverName}</span>
                </div>

                <Separator className="bg-white/10" />

                {/* Fare Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fare Breakdown</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Fare</span>
                      <span>₹{receipt.breakdown.baseFare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance Charge</span>
                      <span>₹{receipt.breakdown.distanceCharge.toFixed(2)}</span>
                    </div>
                    {receipt.breakdown.surgeAmount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Surge ({receipt.breakdown.surgeMultiplier}x)</span>
                        <span>₹{receipt.breakdown.surgeAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="bg-white/5 my-1" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{receipt.breakdown.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">GST (5%)</span>
                      <span>₹{receipt.breakdown.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span>₹{receipt.breakdown.platformFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base">Total</span>
                    <motion.span
                      className="text-xl font-bold text-primary"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      ₹{receipt.breakdown.total.toFixed(2)}
                    </motion.span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Footer: Environmental & Payment */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-green-400">
                      <Leaf className="w-3 h-3" /> {receipt.carbonSaved.toFixed(2)} kg CO₂
                    </span>
                    <span className="flex items-center gap-1 text-primary">
                      <ShieldCheck className="w-3 h-3" /> {receipt.fairnessScore}/10
                    </span>
                  </div>
                  {receipt.payment && (
                    <Badge variant="outline" className={`text-[10px] ${receipt.payment.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                      <CreditCard className="w-2.5 h-2.5 mr-1" />
                      {receipt.payment.method.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-primary/80 to-emerald-500/80 hover:from-primary hover:to-emerald-500 text-black font-semibold h-10"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Receipt
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
