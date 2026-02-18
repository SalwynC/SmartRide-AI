import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LoadingScreen from "@/components/feedback/LoadingScreen";
import { AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";
import PassengerDashboard from "@/pages/PassengerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

function Router({ 
  role, 
  showHome, 
  setShowHome, 
  showAuth, 
  setShowAuth,
  authMode,
  setAuthMode 
}: { 
  role: string; 
  showHome: boolean; 
  setShowHome: (show: boolean) => void;
  showAuth: boolean;
  setShowAuth: (show: boolean) => void;
  authMode: "login" | "signup";
  setAuthMode: (mode: "login" | "signup") => void;
}) {
  if (showHome) {
    return <Home onGetStarted={() => setShowHome(false)} />;
  }

  if (showAuth) {
    if (authMode === "login") {
      return (
        <Login
          onSuccess={() => setShowAuth(false)}
          onSwitchToSignup={() => setAuthMode("signup")}
        />
      );
    } else {
      return (
        <Signup
          onSuccess={() => setAuthMode("login")}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      );
    }
  }

  return (
    <Switch>
      <Route path="/">
        {role === "passenger" ? <PassengerDashboard /> :
         role === "driver" ? <DriverDashboard /> :
         <AdminDashboard />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Simple client-side state for role simulation
  const [role, setRole] = useState<"passenger" | "driver" | "admin">("passenger");
  const [showHome, setShowHome] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(true);

  // Hide loading screen after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Quick load for better UX

    return () => clearTimeout(timer);
  }, []);

  console.log("%c5️⃣ App component rendering", "color: #10b981; font-weight: bold");
  console.log("   Current role:", role);

  try {
    return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary>
              {/* Loading Screen with AnimatePresence for smooth exit */}
              <AnimatePresence>
                {isLoading && <LoadingScreen />}
              </AnimatePresence>

              <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 app-texture">
                
                {/* Header - Hidden on Home page and Auth pages */}
                {!showHome && !showAuth && (
                  <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-background/70 backdrop-blur-md z-50 px-4 md:px-6 flex items-center justify-between">
                    <button 
                      onClick={() => setShowHome(true)}
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

                    <div className="flex items-center gap-4">
                      {/* Theme Toggle - Clean & Professional */}
                      <ThemeToggle />
                      <RoleSwitcher currentRole={role} onChange={setRole} />
                    </div>
                  </header>
                )}

                {/* Main Content */}
                <main className={showHome || showAuth ? "" : "pt-20 md:pt-24 px-4 md:px-6 max-w-[1600px] mx-auto pb-12"}>
                  <Router 
                    role={role} 
                    showHome={showHome} 
                    setShowHome={setShowHome}
                    showAuth={showAuth}
                    setShowAuth={setShowAuth}
                    authMode={authMode}
                    setAuthMode={setAuthMode}
                  />
                </main>
                
                <Toaster />
              </div>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    );
  } catch (error) {
    console.error("%c❌ CRITICAL ERROR in App component:", "color: #ef4444; font-size: 14px; font-weight: bold");
    console.error(error);
    return (
      <div style={{ 
        padding: "40px", 
        background: "#dc2626", 
        color: "white", 
        fontFamily: "monospace",
        minHeight: "100vh"
      }}>
        <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>❌ App Component Error</h1>
        <pre style={{ background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "8px" }}>
          {String(error)}
        </pre>
        <p style={{ marginTop: "20px" }}>Check browser console (F12) for details.</p>
      </div>
    );
  }
}

export default App;
