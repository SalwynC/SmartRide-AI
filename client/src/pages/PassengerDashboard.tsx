import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRideQuote, useCreateRide, useRides } from "@/hooks/use-rides";
import { bookingRequestSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MapPin, Clock, Leaf, DollarSign, Car, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const passengerId = 1; // Simulated User ID

export default function PassengerDashboard() {
  const { toast } = useToast();
  const [quote, setQuote] = useState<any>(null);

  const quoteMutation = useRideQuote();
  const createMutation = useCreateRide();
  const { data: rides, isLoading: isLoadingRides } = useRides(passengerId);

  const form = useForm<z.infer<typeof bookingRequestSchema>>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      pickupAddress: "",
      dropAddress: "",
      distanceKm: 5, // Default for demo
      passengerId: passengerId,
      simulatedTraffic: 2,
      simulatedPeak: false,
    },
  });

  async function onGetQuote(data: z.infer<typeof bookingRequestSchema>) {
    try {
      const result = await quoteMutation.mutateAsync(data);
      setQuote(result);
      toast({ title: "Quote Received", description: "AI prediction complete." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get quote", variant: "destructive" });
    }
  }

  async function onBook() {
    if (!quote) return;
    try {
      await createMutation.mutateAsync(form.getValues());
      toast({ title: "Ride Booked!", description: "A driver is on the way." });
      setQuote(null); // Reset
      form.reset();
    } catch (error) {
      toast({ title: "Booking Failed", variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">
      {/* LEFT: Booking Form */}
      <div className="lg:col-span-1 space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Book a SmartRide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onGetQuote)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Enter pickup..." className="pl-9 bg-black/20" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dropAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                            <Input placeholder="Where to?" className="pl-9 bg-black/20" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <FormField
                      control={form.control}
                      name="simulatedTraffic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Simulate Traffic (0-10)</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              defaultValue={[field.value || 2]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="simulatedPeak"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-xs">Peak Hours?</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <span className="text-xs text-muted-foreground">
                                {field.value ? "Yes" : "No"}
                              </span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-4"
                    disabled={quoteMutation.isPending}
                  >
                    {quoteMutation.isPending ? "Calculating..." : "Get Price Quote"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* RECENT RIDES */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-3 px-1">Recent Activity</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {isLoadingRides ? (
              <div className="text-muted-foreground text-sm">Loading history...</div>
            ) : rides?.length === 0 ? (
              <div className="text-muted-foreground text-sm">No recent rides.</div>
            ) : (
              rides?.slice(0, 5).map((ride) => (
                <div key={ride.id} className="p-4 rounded-lg bg-card/40 border border-white/5 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium text-white">{ride.dropAddress}</div>
                    <div className="text-xs text-muted-foreground">{new Date(ride.createdAt!).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">${ride.finalFare.toFixed(2)}</div>
                    <div className={`text-[10px] uppercase font-bold ${
                      ride.status === 'completed' ? 'text-green-500' : 
                      ride.status === 'cancelled' ? 'text-red-500' : 'text-yellow-500'
                    }`}>{ride.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* CENTER/RIGHT: Map & Quote */}
      <div className="lg:col-span-2 flex flex-col gap-6 relative">
        {/* Placeholder Map */}
        <div className="flex-1 bg-card/30 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-700"></div>
          {/* Map UI Overlay */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-xs p-2 rounded-lg border border-white/10 text-white/70">
            User Location: Downtown
          </div>
        </div>

        {/* QUOTE OVERLAY */}
        <AnimatePresence>
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-6 right-6"
            >
              <Card className="bg-[#111] border-primary/20 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-blue-400 to-purple-500" />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-8 text-center md:text-left">
                      <div>
                        <div className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Estimate</div>
                        <div className="text-4xl font-display font-bold text-white flex items-center gap-1">
                          <span className="text-primary">$</span>{quote.finalFare.toFixed(2)}
                        </div>
                        {quote.surgeMultiplier > 1 && (
                          <div className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            {quote.surgeMultiplier}x Surge Active
                          </div>
                        )}
                      </div>

                      <div className="flex gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" /> Wait
                          </div>
                          <div className="font-semibold">{quote.predictedWaitTime} min</div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Car className="w-3 h-3" /> Trip
                          </div>
                          <div className="font-semibold">{quote.predictedDuration} min</div>
                        </div>
                        <div className="space-y-1 hidden sm:block">
                          <div className="flex items-center gap-2 text-green-400 text-xs">
                            <Leaf className="w-3 h-3" /> CO2
                          </div>
                          <div className="font-semibold">{quote.carbonEmissions}g</div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      <Button 
                        onClick={onBook} 
                        className="w-full md:w-48 bg-white text-black hover:bg-white/90 font-bold h-12 text-lg shadow-lg shadow-white/10"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? "Confirming..." : "Confirm Ride"}
                      </Button>
                      <div className="mt-2 text-center">
                        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-primary" /> Fairness Score: {quote.fairnessScore}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
