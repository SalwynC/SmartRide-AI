import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LoadingScreen from "@/components/feedback/LoadingScreen";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { AnimatePresence } from "framer-motion";
import { Zap, LogOut, User, Car, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";
import PassengerDashboard from "@/pages/PassengerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

/** Renders the correct dashboard based on the user's actual role */
function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "passenger";
  
  // Admin override: allow admin to view other dashboards
  const [adminView, setAdminView] = useState<"admin" | "passenger" | "driver">("admin");
  
  if (role === "admin") {
    return (
      <div>
        {/* Admin view switcher — only for admins */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground mr-2">View as:</span>
          {(["admin", "passenger", "driver"] as const).map((v) => (
            <Button
              key={v}
              variant={adminView === v ? "default" : "outline"}
              size="sm"
              onClick={() => setAdminView(v)}
              className="capitalize"
            >
              {v === "admin" && <Shield className="w-3.5 h-3.5 mr-1.5" />}
              {v === "passenger" && <User className="w-3.5 h-3.5 mr-1.5" />}
              {v === "driver" && <Car className="w-3.5 h-3.5 mr-1.5" />}
              {v}
            </Button>
          ))}
        </div>
        {adminView === "admin" && <AdminDashboard />}
        {adminView === "passenger" && <PassengerDashboard />}
        {adminView === "driver" && <DriverDashboard />}
      </div>
    );
  }
  
  return role === "driver" ? <DriverDashboard /> : <PassengerDashboard />;
}

/** Renders the role badge in header based on user's actual role */
function RoleBadge() {
  const { user } = useAuth();
  if (!user) return null;
  
  const roleConfig = {
    passenger: { label: "Passenger", icon: User, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    driver: { label: "Driver", icon: Car, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    admin: { label: "Admin", icon: Shield, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  };
  
  const config = roleConfig[user.role] || roleConfig.passenger;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.color} gap-1.5 px-3 py-1 text-xs font-medium`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// Protected route — redirects to /login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Hide loading screen after initial render
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Determine if we should show the header (not on home, login, or signup pages)
  const showHeader = isAuthenticated && !["/", "/login", "/signup"].includes(location);

  return (
    <ErrorBoundary>
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 app-texture">
        
        {/* Header — visible on dashboard routes only */}
        {showHeader && (
          <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-background/70 backdrop-blur-md z-50 px-4 md:px-6 flex items-center justify-between">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Return to home page"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="text-black w-5 h-5 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold font-display tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  SmartRide<span className="text-primary">.ai</span>
                </span>
                <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Mobility Control</span>
              </div>
              <span className="ml-2 hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </button>

            <div className="flex items-center gap-3">
              <RoleBadge />
              <NotificationCenter />
              <ThemeToggle />
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground gap-2"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={showHeader ? "pt-20 md:pt-24 px-4 md:px-6 max-w-[1600px] mx-auto pb-12" : ""}>
          <Switch>
            <Route path="/"><Home /></Route>
            <Route path="/login"><Login /></Route>
            <Route path="/signup"><Signup /></Route>
            <Route path="/dashboard">
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </Route>
            <Route><NotFound /></Route>
          </Switch>
        </main>
        
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
