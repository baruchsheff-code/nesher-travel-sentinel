import { useEffect, useState } from "react";
import { Eye, X, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PriceWatch {
  id: string;
  origin_iata: string | null;
  destination_iata: string | null;
  current_price_usd: number | null;
  target_price_usd: number | null;
  prediction: string | null;
  prediction_confidence: number | null;
  alert_sent: boolean | null;
}

const predictionConfig = (pred: string | null) => {
  if (pred === "Likely to drop") return { icon: TrendingDown, color: "#22C55E", label: "Likely to drop" };
  if (pred === "Buy soon") return { icon: TrendingUp, color: "#FBBF24", label: "Buy soon" };
  return { icon: Minus, color: "hsl(var(--muted-foreground))", label: "Stable" };
};

const PriceWatchDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watches, setWatches] = useState<PriceWatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("price_watches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setWatches(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWatches();
  }, [user]);

  const removeWatch = async (id: string) => {
    await supabase.from("price_watches").delete().eq("id", id);
    setWatches((prev) => prev.filter((w) => w.id !== id));
    toast.success("Watch removed");
  };

  if (!user || loading || watches.length === 0) return null;

  return (
    <div className="w-full mt-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Eye size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Watching</h3>
        <span className="text-xs text-muted-foreground">({watches.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
        {watches.map((w) => {
          const pred = predictionConfig(w.prediction);
          const PredIcon = pred.icon;
          const hitTarget = w.current_price_usd && w.target_price_usd && w.current_price_usd <= w.target_price_usd;

          return (
            <div
              key={w.id}
              className="shrink-0 rounded-2xl p-3 relative"
              style={{
                width: 200,
                backgroundColor: "hsl(var(--card))",
                border: hitTarget ? "1px solid #22C55E" : "1px solid hsl(var(--border))",
              }}
            >
              <button
                onClick={() => removeWatch(w.id)}
                className="absolute top-2 right-2 p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <X size={12} className="text-muted-foreground" />
              </button>

              <p className="text-xs font-bold text-foreground">
                {w.origin_iata} → {w.destination_iata}
              </p>

              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-lg font-bold text-primary">${w.current_price_usd?.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">/ ${w.target_price_usd?.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <PredIcon size={12} style={{ color: pred.color }} />
                <span className="text-[11px] font-medium" style={{ color: pred.color }}>
                  {pred.label} · {w.prediction_confidence}%
                </span>
              </div>

              {hitTarget && (
                <button
                  onClick={() => navigate(`/search?q=${w.destination_iata}`)}
                  className="w-full mt-2 rounded-lg py-1.5 text-xs font-semibold bg-primary text-primary-foreground"
                >
                  Book Now 🦅
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriceWatchDashboard;
