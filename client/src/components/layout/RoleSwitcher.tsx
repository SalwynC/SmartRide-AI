import { User, Car, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "passenger" | "driver" | "admin";

interface RoleSwitcherProps {
  currentRole: Role;
  onChange: (role: Role) => void;
}

export function RoleSwitcher({ currentRole, onChange }: RoleSwitcherProps) {
  return (
    <div className="flex p-1 bg-white/5 rounded-full border border-white/10 gap-1">
      <RoleButton 
        active={currentRole === "passenger"} 
        onClick={() => onChange("passenger")}
        icon={<User className="w-4 h-4" />}
        label="Passenger"
      />
      <RoleButton 
        active={currentRole === "driver"} 
        onClick={() => onChange("driver")}
        icon={<Car className="w-4 h-4" />}
        label="Driver"
      />
      <RoleButton 
        active={currentRole === "admin"} 
        onClick={() => onChange("admin")}
        icon={<Shield className="w-4 h-4" />}
        label="Admin"
      />
    </div>
  );
}

function RoleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        active 
          ? "bg-gradient-to-r from-primary to-emerald-400 text-black shadow-lg shadow-emerald-500/20" 
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
