import { useState } from "react";
import { X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PriceWatchModalProps {
  open: boolean;
  onClose: () => void;
  originIata: string;
  destinationIata: string;
  currentPrice: number;
  prediction: "buy" | "wait";
  predictionConfidence: number;
}

const PriceWatchModal = ({ open, onClose, originIata, destinationIata, currentPrice, prediction, predictionConfidence }: PriceWatchModalProps) => {
  const { user } = useAuth();
  const suggestedTarget = Math.round(currentPrice * 0.85);
  const [targetPrice, setTargetPrice] = useState(suggestedTarget);
  const [alertMethod, setAlertMethod] = useState<"email" | "push" | "both">("both");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!user) {
      toast.error("Sign in to watch fares");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("price_watches").insert({
        user_id: user.id,
        origin_iata: originIata,
        destination_iata: destinationIata,
        current_price_usd: currentPrice,
        target_price_usd: targetPrice,
        prediction: prediction === "buy" ? "Buy soon" : "Likely to drop",
        prediction_confidence: predictionConfidence,
      });
      if (error) throw error;
      toast.success(`Watching ${originIata}→${destinationIata} for $${targetPrice}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save watch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md rounded-t-3xl p-6 pb-8 animate-slide-up"
        style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-foreground">Watch This Fare</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-1">
          {originIata} → {destinationIata} · Currently <span className="text-primary font-semibold">${currentPrice}</span>
        </p>

        {/* Target price */}
        <label className="block mt-4 mb-1 text-sm font-medium text-foreground">What's your target price?</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
            className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm bg-background text-foreground border border-border focus:ring-2 focus:ring-primary/30 outline-none"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Pre-filled at 15% below current price</p>

        {/* Alert method */}
        <label className="block mt-5 mb-2 text-sm font-medium text-foreground">Alert me by:</label>
        <div className="flex gap-2">
          {(["email", "push", "both"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setAlertMethod(m)}
              className="flex-1 rounded-xl py-2 text-xs font-medium capitalize transition-colors"
              style={
                alertMethod === m
                  ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                  : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
              }
            >
              {m === "both" ? "Both" : m === "email" ? "Email" : "Push"}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 rounded-xl py-3 text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : "Start Watching 👁️"}
        </button>
      </div>
    </div>
  );
};

export default PriceWatchModal;
