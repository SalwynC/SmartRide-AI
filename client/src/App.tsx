import { useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { Zap } from "lucide-react";

import NotFound from "@/pages/not-found";
import PassengerDashboard from "@/pages/PassengerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

function Router({ role }: { role: string }) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
          
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
                <Zap className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-white">
                SmartRide<span className="text-primary">.ai</span>
              </span>
            </div>

            <RoleSwitcher currentRole={role} onChange={setRole} />
          </header>

          {/* Main Content */}
          <main className="pt-24 px-6 max-w-[1600px] mx-auto pb-12">
            <Router role={role} />
          </main>
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
