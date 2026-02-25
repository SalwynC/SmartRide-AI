import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatMessages, useSendMessage, type ChatMessage } from "@/hooks/use-chat";

interface ChatPanelProps {
  rideId: number;
  userId: number;
  userRole: "passenger" | "driver";
  driverName?: string;
}

export default function ChatPanel({ rideId, userId, userRole, driverName }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: messages = [] } = useChatMessages(rideId);
  const sendMessage = useSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = inputValue.trim();
    if (!text) return;
    
    setInputValue("");
    try {
      await sendMessage.mutateAsync({
        rideId,
        senderId: userId,
        senderRole: userRole,
        message: text,
      });
    } catch {
      // Message failed, could show error
    }
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  // Quick reply suggestions
  const quickReplies = [
    "I'm on my way!",
    "Please wait, arriving soon",
    "I'm at the pickup point",
    "Can you share exact location?",
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-emerald-400 shadow-lg shadow-primary/30 flex items-center justify-center text-black"
          >
            <MessageCircle className="w-6 h-6" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {messages.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            style={{ height: isMinimized ? "auto" : "500px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-emerald-400/10 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{driverName || "Driver Chat"}</p>
                  <p className="text-xs text-muted-foreground">Ride #{rideId}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Start a conversation</p>
                      <p className="text-xs text-muted-foreground mt-1">Messages will appear here</p>
                    </div>
                  ) : (
                    messages.map((msg: ChatMessage) => {
                      const isMe = msg.senderId === userId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${
                              isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}>
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                {messages.length === 0 && (
                  <div className="px-4 pb-2 flex gap-2 flex-wrap">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => {
                          setInputValue(reply);
                          inputRef.current?.focus();
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-muted/50 border-0 focus-visible:ring-primary/30"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sendMessage.isPending}
                    size="icon"
                    className="bg-primary text-primary-foreground shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
