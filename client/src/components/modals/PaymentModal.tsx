import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Wallet, Banknote, X, Shield, Check, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatePayment, type PaymentData } from "@/hooks/use-payments";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: number;
  userId: number;
  fare: number;
  surgeMultiplier: number;
  baseFare: number;
  onPaymentComplete?: (payment: PaymentData) => void;
}

const paymentMethods = [
  { id: "upi" as const, name: "UPI", icon: Smartphone, description: "Google Pay, PhonePe, Paytm", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { id: "card" as const, name: "Card", icon: CreditCard, description: "Credit or Debit Card", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "wallet" as const, name: "Wallet", icon: Wallet, description: "SmartRide Wallet", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "cash" as const, name: "Cash", icon: Banknote, description: "Pay driver directly", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
];

export default function PaymentModal({ isOpen, onClose, rideId, userId, fare, surgeMultiplier, baseFare, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "wallet" | "cash" | null>(null);
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "receipt">("select");
  const [receipt, setReceipt] = useState<PaymentData | null>(null);
  const createPayment = useCreatePayment();
  const { toast } = useToast();

  const surgeAmount = fare - baseFare;
  const tax = fare * 0.05;
  const discount = fare > 200 ? 15 : 0;
  const total = fare + tax - discount;

  const breakdown = {
    baseFare,
    surgeAmount: parseFloat(surgeAmount.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    discount,
    total: parseFloat(total.toFixed(2)),
  };

  async function handlePay() {
    if (!selectedMethod) return;
    setStep("processing");

    try {
      const payment = await createPayment.mutateAsync({
        rideId,
        userId,
        amount: total,
        method: selectedMethod,
        breakdown,
      });

      // Simulate processing delay
      await new Promise(r => setTimeout(r, 2000));
      setReceipt({ ...payment, status: "completed", transactionId: `TXN${Date.now()}` });
      setStep("receipt");
      toast({ title: "Payment Successful!", description: `₹${total.toFixed(2)} paid via ${selectedMethod.toUpperCase()}` });
      onPaymentComplete?.(payment);
    } catch {
      setStep("select");
      toast({ title: "Payment Failed", description: "Please try again", variant: "destructive" });
    }
  }

  function handleClose() {
    setStep("select");
    setSelectedMethod(null);
    setReceipt(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <h2 className="text-xl font-bold font-display">
                {step === "receipt" ? "Payment Receipt" : step === "processing" ? "Processing..." : "Payment"}
              </h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Fare Breakdown */}
              {step !== "processing" && (
                <Card className="bg-muted/30 border-border mb-6">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Fare</span>
                      <span>₹{baseFare.toFixed(2)}</span>
                    </div>
                    {surgeAmount > 0 && (
                      <div className="flex justify-between text-amber-500">
                        <span>Surge ({surgeMultiplier}x)</span>
                        <span>+₹{surgeAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (5%)</span>
                      <span>+₹{tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>Discount</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step: Select Payment */}
              {step === "select" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">Select payment method</p>
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    return (
                      <motion.button
                        key={method.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                          isSelected
                            ? `${method.bg} ring-2 ring-primary/30`
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${method.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${method.color}`} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold">{method.name}</div>
                          <div className="text-xs text-muted-foreground">{method.description}</div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary" />}
                      </motion.button>
                    );
                  })}

                  <Button
                    onClick={() => selectedMethod && setStep("confirm")}
                    disabled={!selectedMethod}
                    className="w-full h-12 mt-4 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step: Confirm */}
              {step === "confirm" && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Secure Payment via {selectedMethod?.toUpperCase()}</span>
                  </div>
                  <div className="text-4xl font-bold font-display text-foreground">₹{total.toFixed(2)}</div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>
                      Back
                    </Button>
                    <Button
                      onClick={handlePay}
                      className="flex-1 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold"
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Processing */}
              {step === "processing" && (
                <div className="text-center py-8 space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto"
                  />
                  <p className="text-lg font-semibold">Processing Payment...</p>
                  <p className="text-sm text-muted-foreground">Please don't close this window</p>
                </div>
              )}

              {/* Step: Receipt */}
              {step === "receipt" && receipt && (
                <div className="space-y-4">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                      <Check className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                    <p className="text-lg font-bold text-emerald-400">Payment Successful!</p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="text-xs">{receipt.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <span>{selectedMethod?.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-emerald-400">Completed</span>
                    </div>
                  </div>

                  <Button onClick={handleClose} className="w-full h-12" variant="outline">
                    <Receipt className="w-4 h-4 mr-2" /> Done
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
