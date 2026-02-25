import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  role: "passenger" | "driver" | "admin";
  emailVerified: boolean;
  phoneNumber?: string;
  profileImage?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  refreshUser: () => void;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  role: "passenger" | "driver";
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("smartride-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("smartride-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("smartride-user", JSON.stringify(userData));
      
      toast({
        title: "Welcome Back!",
        description: `Logged in as ${userData.username}`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Signup Failed",
          description: error.message || "Unable to create account",
          variant: "destructive",
        });
        return false;
      }

      const result = await response.json();
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Signup Error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
      return false;
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      
      if (!response.ok) {
        toast({
          title: "Verification Failed",
          description: "Invalid or expired verification token",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Email Verified!",
        description: "You can now log in to your account",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to verify email",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("smartride-user");
    toast({
      title: "Logged Out",
      description: "See you next time!",
    });
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        headers: { "x-user-id": String(user.id) },
      });
      if (res.ok) {
        const fresh = await res.json();
        setUser(fresh);
        localStorage.setItem("smartride-user", JSON.stringify(fresh));
      }
    } catch {
      // silently fail — stale data is fine
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        verifyEmail,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
