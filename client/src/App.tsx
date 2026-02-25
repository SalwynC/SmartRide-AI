import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LoadingScreen from "@/components/feedback/LoadingScreen";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { AnimatePresence } from "framer-motion";
import { Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";
import PassengerDashboard from "@/pages/PassengerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

function DashboardPage({ role }: { role: string }) {
  return role === "driver" ? <DriverDashboard /> :
         role === "admin" ? <AdminDashboard /> :
         <PassengerDashboard />;
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
  const [role, setRole] = useState<"passenger" | "driver" | "admin">("passenger");
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Set initial role from user data
  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

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
              <NotificationCenter />
              <ThemeToggle />
              <RoleSwitcher currentRole={role} onChange={setRole} />
              
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
                <DashboardPage role={role} />
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
