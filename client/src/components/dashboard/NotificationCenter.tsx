import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, CheckCheck, X, Car, CreditCard, Megaphone, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead, type NotificationItem } from "@/hooks/use-notifications";

interface NotificationCenterProps {
  userId: number;
}

const typeIcons: Record<string, any> = {
  ride_update: Car,
  driver_arrival: Car,
  payment: CreditCard,
  promo: Megaphone,
  system: Settings,
};

const typeColors: Record<string, string> = {
  ride_update: "text-blue-400 bg-blue-500/10",
  driver_arrival: "text-emerald-400 bg-emerald-500/10",
  payment: "text-violet-400 bg-violet-500/10",
  promo: "text-amber-400 bg-amber-500/10",
  system: "text-slate-400 bg-slate-500/10",
};

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [] } = useNotifications(userId);
  const { data: unreadData } = useUnreadCount(userId);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.count || 0;

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
          >
            <BellRing className="w-5 h-5" />
          </motion.div>
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllRead.mutate(userId)}
                      className="text-xs gap-1 h-7"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Read All
                    </Button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                    <p className="text-xs text-muted-foreground mt-1">We'll notify you about ride updates</p>
                  </div>
                ) : (
                  notifications.map((notif: NotificationItem) => {
                    const IconComp = typeIcons[notif.type] || AlertCircle;
                    const colorClass = typeColors[notif.type] || "text-slate-400 bg-slate-500/10";
                    
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${
                          !notif.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => !notif.read && markRead.mutate(notif.id)}
                      >
                        <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${colorClass}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(notif.createdAt)}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
