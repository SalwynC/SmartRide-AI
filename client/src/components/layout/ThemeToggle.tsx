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
        className="relative w-10 h-10 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-border transition-all duration-150 shadow-sm hover:shadow"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {/* Dark Mode Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: theme === "dark" ? 1 : 0,
            opacity: theme === "dark" ? 1 : 0,
            rotate: theme === "dark" ? 0 : 180,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute"
        >
          <Moon className="w-5 h-5 text-blue-400" />
        </motion.div>

        {/* Light Mode Icon */}
        <motion.div
          initial={false}
          animate={{
            scale: theme === "light" ? 1 : 0,
            opacity: theme === "light" ? 1 : 0,
            rotate: theme === "light" ? 0 : -180,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute"
        >
          <Sun className="w-5 h-5 text-amber-500" />
        </motion.div>
      </Button>
    </motion.div>
  );
}
