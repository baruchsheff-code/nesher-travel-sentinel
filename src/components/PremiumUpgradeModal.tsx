import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TIERS } from "@/lib/subscriptionTiers";

const BENEFITS = [
  "Zero AI optimization fees on all bookings",
  "Real-time safety alerts for your destinations",
  "Priority human support (< 5 min response)",
  "Automatic check-in on all flights",
  "Auto-recovery enabled (fastest rebooking)",
  "Waitlist monitoring",
  "Offline trip packages",
];

const PremiumUpgradeModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Sign in first");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: TIERS.premium.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden animate-scale-in"
        style={{ backgroundColor: "hsl(var(--card))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold gradient header */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{
            background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
          }}
        >
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/30 transition-colors">
            <X size={16} style={{ color: "#fff" }} />
          </button>
          <p className="text-3xl mb-1">🦅</p>
          <h2 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Nesher Premium</h2>
          <p className="text-sm mt-1 font-medium" style={{ color: "#1a1a1a", opacity: 0.7 }}>
            Travel smarter. Recover faster.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-3">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-2.5">
              <Check size={16} className="shrink-0 mt-0.5" style={{ color: "#C9A84C" }} />
              <span className="text-sm text-foreground">{b}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-opacity disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)",
              color: "#1a1a1a",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin inline" />
            ) : (
              "Start for $19/month — cancel anytime"
            )}
          </button>
          <p className="text-center text-xs mt-3" style={{ color: "hsl(var(--muted-foreground))" }}>
            Most travelers save $60+ per booking
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradeModal;
