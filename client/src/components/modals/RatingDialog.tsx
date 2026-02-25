import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRating } from "@/hooks/use-ratings";
import { useToast } from "@/hooks/use-toast";

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: number;
  passengerId: number;
  driverId?: number;
  driverName?: string;
}

export default function RatingDialog({ isOpen, onClose, rideId, passengerId, driverId, driverName }: RatingDialogProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const createRating = useCreateRating();
  const { toast } = useToast();

  const starLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  async function handleSubmit() {
    if (stars === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    try {
      await createRating.mutateAsync({
        rideId,
        passengerId,
        driverId,
        stars,
        comment: comment.trim() || undefined,
      });
      toast({ title: "Thank you!", description: "Your rating has been submitted" });
      setStars(0);
      setComment("");
      onClose();
    } catch {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display">Rate Your Ride</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Driver Info */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🚗</span>
              </div>
              <p className="font-semibold text-lg">{driverName || "Your Driver"}</p>
              <p className="text-sm text-muted-foreground">How was your experience?</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setStars(i)}
                  className="p-1"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      i <= (hoveredStar || stars)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {/* Star Label */}
            <div className="text-center mb-6">
              <motion.p
                key={hoveredStar || stars}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-primary"
              >
                {starLabels[hoveredStar || stars] || "Tap a star"}
              </motion.p>
            </div>

            {/* Comment */}
            <Textarea
              placeholder="Share your experience (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-6 resize-none bg-muted/50 border-border"
              rows={3}
            />

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={stars === 0 || createRating.isPending}
              className="w-full h-12 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold text-base shadow-lg"
            >
              {createRating.isPending ? (
                "Submitting..."
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Submit Rating
                </span>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
