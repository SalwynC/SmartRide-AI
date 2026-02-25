import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserPayments, type PaymentData } from "@/hooks/use-payments";
import { useAnalytics } from "@/hooks/use-tracking";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  Shield,
  Car,
  CreditCard,
  TrendingUp,
  Leaf,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = user?.id ?? 0;
  const { data: payments = [] } = useUserPayments(userId);
  const { data: analytics } = useAnalytics(userId);

  // Profile form state
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Update failed" }));
        throw new Error(body.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      if (refreshUser) refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveProfile = () => {
    const data: Record<string, string> = {};
    if (username !== user?.username) data.username = username;
    if (email !== (user?.email ?? "")) data.email = email;
    if (phoneNumber !== (user?.phoneNumber ?? "")) data.phoneNumber = phoneNumber;

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
        return;
      }
      data.currentPassword = currentPassword;
      data.newPassword = newPassword;
    }

    if (Object.keys(data).length === 0) {
      toast({ title: "No changes", description: "Nothing to update." });
      return;
    }

    updateProfile.mutate(data);
  };

  const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
    passenger: { label: "Passenger", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: User },
    driver: { label: "Driver", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Car },
    admin: { label: "Admin", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Shield },
  };
  const rc = roleConfig[user?.role ?? "passenger"];
  const RoleIcon = rc.icon;

  const paymentStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-400" />;
      case "refunded": return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Page Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account, view payment history, and ride stats.</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left column — Profile Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          {/* Account Details */}
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Account Details
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant="outline" className={`${rc.color} gap-1.5 px-3 py-1 text-xs font-medium`}>
                  <RoleIcon className="w-3 h-3" />
                  {rc.label}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                </span>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5" /> Username
                  </Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </Label>
                  <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 XXXXXXXXXX" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Change Password
              </CardTitle>
              <CardDescription>Leave blank to keep current password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw" className="text-sm">Current Password</Label>
                <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw" className="text-sm">New Password</Label>
                <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw" className="text-sm">Confirm New Password</Label>
                <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </motion.div>

        {/* Right column — Stats & Payment History */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          {/* Ride Stats */}
          {analytics && (
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Ride Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <StatBlock icon={<MapPin className="w-4 h-4 text-blue-400" />} label="Total Rides" value={analytics.totalRides} />
                  <StatBlock icon={<CreditCard className="w-4 h-4 text-emerald-400" />} label="Total Spent" value={`₹${analytics.totalSpent.toFixed(0)}`} />
                  <StatBlock icon={<TrendingUp className="w-4 h-4 text-violet-400" />} label="Avg Fare" value={`₹${analytics.avgFare.toFixed(0)}`} />
                  <StatBlock icon={<Leaf className="w-4 h-4 text-green-400" />} label="CO₂ Saved" value={`${analytics.totalCarbon.toFixed(1)} kg`} />
                </div>

                {/* Popular routes */}
                {analytics.popularRoutes?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequent Routes</p>
                    {analytics.popularRoutes.slice(0, 3).map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                        <span className="truncate mr-2">{r.route}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">{r.count}x</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment History
              </CardTitle>
              <CardDescription>{payments.length} transaction{payments.length !== 1 ? "s" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="py-8 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {payments.map((p: PaymentData) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 hover:bg-muted/30 transition-colors">
                      {paymentStatusIcon(p.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Ride #{p.rideId}</span>
                          <span className="text-sm font-bold text-foreground">₹{p.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{p.method} · {p.status}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border/30 p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
