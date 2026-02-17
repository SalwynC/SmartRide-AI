import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRideQuote, useCreateRide, useRides } from "@/hooks/use-rides";
import { useAuth } from "@/contexts/AuthContext";
import { bookingRequestSchema } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MapPin, Clock, Leaf, DollarSign, Car, ShieldCheck, Globe, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IndiaMap } from "@/components/DelhiMap";
import { CITY_LIST, getCityZones } from "@shared/cities";
import AuthModal from "@/components/AuthModal";

const passengerId = 1; // Simulated User ID

export default function PassengerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState("delhi");
  const [quote, setQuote] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
      if (quoteMutation.isPending) return;
      const result = await quoteMutation.mutateAsync(data);
      setQuote(result);
      toast({ title: "Quote Received", description: "AI prediction complete." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get quote", variant: "destructive" });
    }
  }

  async function onBook() {
    if (!quote) return;
    
    // Check authentication before booking - show modal if not authenticated
    if (!isAuthenticated) {
      setShowAuthModal(true);
      toast({ 
        title: "Login Required", 
        description: "Please sign in to book a ride",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (createMutation.isPending) return;
      await createMutation.mutateAsync(form.getValues());
      toast({ title: "Ride Booked!", description: "A driver is on the way." });
      setQuote(null); // Reset
      form.reset();
    } catch (error) {
      toast({ title: "Booking Failed", variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-100px)]">
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
                  
                  {/* City Selector */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-400/20">
                    <label className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2 block flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Select City
                    </label>
                    <Select value={selectedCity} onValueChange={(val) => {
                      setSelectedCity(val);
                      // Reset addresses when city changes
                      form.setValue("pickupAddress", "");
                      form.setValue("dropAddress", "");
                    }}>
                      <SelectTrigger className="bg-black/30 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITY_LIST.map((city) => (
                          <SelectItem key={city.key} value={city.key}>
                            <span className="flex items-center gap-2">
                              <span>{city.emoji}</span>
                              {city.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20">
                              <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                              <SelectValue placeholder="Select pickup zone..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getCityZones(selectedCity).map((zone) => (
                              <SelectItem key={zone.name} value={zone.name}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20">
                              <MapPin className="h-4 w-4 text-primary mr-2" />
                              <SelectValue placeholder="Select destination zone..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getCityZones(selectedCity).map((zone) => (
                              <SelectItem key={zone.name} value={zone.name}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    className="w-full bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-bold h-12 mt-4"
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
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-4 rounded-lg glass-panel">
                    <div className="h-4 w-40 skeleton mb-2" />
                    <div className="h-3 w-24 skeleton" />
                  </div>
                ))}
              </div>
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
                    <div className="font-bold text-primary">₹{ride.finalFare.toFixed(2)}</div>
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
        {/* India Map */}
        <div className="flex-1 rounded-3xl overflow-hidden min-h-[500px]">
          <IndiaMap 
            cityKey={selectedCity}
            pickupZone={form.watch("pickupAddress")}
            dropZone={form.watch("dropAddress")}
            showRoute={!!quote}
          />
        </div>

        {/* QUOTE OVERLAY */}
        <AnimatePresence>
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative lg:absolute lg:bottom-6 lg:left-6 lg:right-6"
            >
              <Card className="bg-card/95 backdrop-blur-xl border border-white/20 shadow-2xl shadow-primary/20 overflow-hidden">
                <motion.div 
                  className="h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-cyan-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    
                    {/* Fare Display */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-center md:text-left"
                    >
                      <div className="text-muted-foreground text-xs uppercase tracking-[0.2em] mb-2 font-semibold">
                        Total Estimate
                      </div>
                      <div className="text-5xl font-display font-bold text-white flex items-baseline gap-2">
                        <motion.span 
                          className="text-primary"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5 }}
                        >
                          ₹
                        </motion.span>
                        <span>{quote.finalFare.toFixed(2)}</span>
                      </div>
                      {quote.surgeMultiplier > 1 && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30"
                        >
                          <motion.span 
                            className="w-2 h-2 rounded-full bg-amber-400"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="text-xs font-semibold text-amber-300">
                            {quote.surgeMultiplier}x Surge Active
                          </span>
                        </motion.div>
                      )}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {quote.city && (
                          <div className="text-xs text-muted-foreground">
                            📍 {quote.city}
                          </div>
                        )}
                        {quote.routeCalculated && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30"
                          >
                            <span className="text-xs font-semibold text-emerald-300">
                              🎯 {quote.distanceKm.toFixed(2)} km (Smart Route)
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    {/* Metrics */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex gap-8"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4 text-blue-400" />
                          Wait
                        </div>
                        <div className="text-2xl font-bold text-blue-400">{quote.predictedWaitTime}</div>
                        <div className="text-xs text-muted-foreground">minutes</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                          <Car className="w-4 h-4 text-purple-400" />
                          Trip
                        </div>
                        <div className="text-2xl font-bold text-purple-400">{quote.predictedDuration}</div>
                        <div className="text-xs text-muted-foreground">minutes</div>
                      </div>
                      
                      <div className="space-y-2 hidden sm:block">
                        <div className="flex items-center gap-2 text-green-400 text-xs uppercase tracking-wider">
                          <Leaf className="w-4 h-4" />
                          CO₂
                        </div>
                        <div className="text-2xl font-bold text-green-400">{quote.carbonEmissions}</div>
                        <div className="text-xs text-muted-foreground">kg</div>
                      </div>
                    </motion.div>

                    {/* Book Button */}
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="w-full md:w-auto"
                    >
                      <Button 
                        onClick={onBook} 
                        className={`w-full md:w-52 h-14 ${
                          isAuthenticated 
                            ? "bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 hover:from-primary/90 hover:via-emerald-400/90 hover:to-cyan-400/90" 
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 animate-pulse"
                        } text-black font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all relative overflow-hidden group`}
                        disabled={createMutation.isPending}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white"
                          initial={{ x: "-100%", opacity: 0.2 }}
                          whileHover={{ x: "100%", opacity: 0.3 }}
                          transition={{ duration: 0.5 }}
                        />
                        <span className="relative z-10 flex items-center gap-2">
                          {createMutation.isPending ? (
                            "Confirming..."
                          ) : isAuthenticated ? (
                            <>🚗 Confirm Ride</>
                          ) : (
                            <>
                              <LogIn className="w-5 h-5" />
                              Login to Book
                            </>
                          )}
                        </span>
                      </Button>
                      
                      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span>Fairness: <span className="font-semibold text-primary">{quote.fairnessScore}/10</span></span>
                        </div>
                        {quote.cancellationProb !== undefined && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Cancel Risk: <span className={`font-semibold ${quote.cancellationProb > 0.5 ? 'text-amber-400' : 'text-green-400'}`}>{(quote.cancellationProb * 100).toFixed(0)}%</span></span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Auth Modal - Shows when user tries to book without being authenticated */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Optionally continue with booking after successful auth
        }}
      />    </div>
  );
}
