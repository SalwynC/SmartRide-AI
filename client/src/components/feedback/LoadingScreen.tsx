import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(16,185,129,0.3)",
                "0 0 40px rgba(16,185,129,0.6)",
                "0 0 20px rgba(16,185,129,0.3)",
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center"
          >
            <Zap className="w-10 h-10 text-black fill-current" />
          </motion.div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center gap-2"
        >
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-foreground via-primary to-emerald-500 bg-clip-text text-transparent">
            SmartRide<span className="text-primary">.ai</span>
          </h1>
          
          {/* Loading Dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
