import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative w-11 h-11 rounded-full bg-gradient-to-br from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border-2 border-white/30 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-black/40 transition-all"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {/* Background animated pulse */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          style={{ pointerEvents: "none" }}
        />

        {/* Dark Mode Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: theme === "dark" ? 1 : 0,
            opacity: theme === "dark" ? 1 : 0,
            rotate: theme === "dark" ? 0 : 180,
          }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
          className="absolute"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Moon className="w-5 h-5 text-blue-300 drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* Light Mode Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: theme === "light" ? 1 : 0,
            opacity: theme === "light" ? 1 : 0,
            rotate: theme === "light" ? 0 : -180,
          }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
          className="absolute"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sun className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          animate={{
            backgroundColor: theme === "dark" ? "#3b82f6" : "#fbbf24",
            boxShadow: theme === "dark"
              ? "0 0 12px rgba(59, 130, 246, 0.6)"
              : "0 0 12px rgba(251, 191, 36, 0.6)"
          }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
        />
      </Button>
    </motion.div>
  );
}
