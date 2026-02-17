import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "passenger",
  });
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
        toast({ title: "Success", description: "Logged in successfully!" });
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        await signup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          role: formData.role as "passenger" | "driver",
        });
        toast({ title: "Success", description: "Account created successfully!" });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <Card className="glass-panel border-white/20 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {mode === "login" ? "Welcome Back" : "Join SmartRide.AI"}
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {mode === "login" ? "Continue your journey" : "Start your ride today"}
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Role Selection (Signup only) */}
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-3 mb-4"
                    >
                      <label className="relative cursor-pointer group">
                        <input
                          type="radio"
                          name="role"
                          value="passenger"
                          checked={formData.role === "passenger"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                          formData.role === "passenger"
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:border-white/20"
                        }`}>
                          <div className="text-2xl mb-1">👤</div>
                          <div className="text-sm font-semibold">Passenger</div>
                        </div>
                      </label>
                      <label className="relative cursor-pointer group">
                        <input
                          type="radio"
                          name="role"
                          value="driver"
                          checked={formData.role === "driver"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                          formData.role === "driver"
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:border-white/20"
                        }`}>
                          <div className="text-2xl mb-1">🚗</div>
                          <div className="text-sm font-semibold">Driver</div>
                        </div>
                      </label>
                    </motion.div>
                  )}

                  {/* Username (Signup only) */}
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">
                        Username
                      </label>
                      <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose your username"
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </motion.div>
                  )}

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="bg-white/5 border-white/10"
                      required
                    />
                  </motion.div>

                  {/* Phone (Signup only) */}
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </motion.div>
                  )}

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: mode === "signup" ? 0.15 : 0.1 }}
                  >
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">
                      Password
                    </label>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="bg-white/5 border-white/10"
                      required
                    />
                  </motion.div>

                  {/* Confirm Password (Signup only) */}
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black font-bold mt-2"
                      disabled={isLoading}
                    >
                      {isLoading 
                        ? "Processing..." 
                        : mode === "login" 
                          ? "Login & Confirm Ride" 
                          : "Create Account & Book"}
                    </Button>
                  </motion.div>

                  {/* Toggle Mode */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-sm text-muted-foreground mt-4"
                  >
                    {mode === "login" ? (
                      <>
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("signup")}
                          className="text-primary hover:underline font-semibold"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("login")}
                          className="text-primary hover:underline font-semibold"
                        >
                          Login
                        </button>
                      </>
                    )}
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
