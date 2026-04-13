import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plane } from "lucide-react";
import { useFlightSearch } from "@/contexts/FlightSearchContext";
import { useEffect } from "react";
import { format } from "date-fns";

const formatTime = (iso: string) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  return format(new Date(iso), "MMM d, yyyy");
};

const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", ILS: "₪", CAD: "CA$" };

export default function TripReview() {
  const navigate = useNavigate();
  const { outboundOffer, returnOffer } = useFlightSearch();

  useEffect(() => {
    if (!outboundOffer || !returnOffer) {
      navigate("/", { replace: true });
    }
  }, [outboundOffer, returnOffer, navigate]);

  if (!outboundOffer || !returnOffer) return null;

  const sym = symbols[outboundOffer.total_currency] || "$";
  const outPrice = parseFloat(outboundOffer.total_amount);
  const retPrice = parseFloat(returnOffer.total_amount);
  const subtotal = outPrice + retPrice;
  const aiFee = 30;
  const total = subtotal + aiFee;

  const stopsText = (stops: number, airports: string[]) => {
    if (stops === 0) return "Nonstop";
    if (stops === 1) return `1 stop${airports[0] ? ` · ${airports[0]}` : ""}`;
    return `${stops} stops`;
  };

  const FlightSummary = ({ label, labelColor, offer }: { label: string; labelColor: string; offer: typeof outboundOffer }) => (
    <div className="rounded-2xl p-4 bg-card border border-border">
      <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: labelColor }}>{label}</p>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm font-semibold text-foreground">{offer.airline_name}</p>
        <span className="text-xs text-muted-foreground">{offer.airline_code}{offer.flight_number}</span>
      </div>
      <p className="text-sm text-foreground mb-1">
        {offer.origin_city || offer.origin_iata} → {offer.destination_city || offer.destination_iata}
      </p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span>{formatDate(offer.departure_time)}</span>
        <span>{formatTime(offer.departure_time)} → {formatTime(offer.arrival_time)}</span>
        <span>{offer.duration}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{stopsText(offer.stops, offer.stop_airports)}</p>
      <p className="text-lg font-bold" style={{ color: "#C9A84C" }}>{sym}{parseFloat(offer.total_amount).toFixed(0)}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 animate-fade-in">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          {["Outbound", "Return", "Review"].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5">
              {i > 0 && <div className="flex-1 h-px bg-border min-w-[16px]" />}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i < 2 ? "bg-primary" : "bg-primary"}`}>
                <span className="text-[10px] text-primary-foreground font-bold">{i < 2 ? "✓" : "●"}</span>
              </div>
              <span className={`text-xs font-medium ${i === 2 ? "text-primary" : "text-primary"}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4 mt-2">
        <h1 className="text-xl font-bold text-foreground">Your trip</h1>

        <FlightSummary label="Outbound" labelColor="#C9A84C" offer={outboundOffer} />
        <FlightSummary label="Return" labelColor="#8899AA" offer={returnOffer} />

        {/* Total */}
        <div className="rounded-2xl p-4 bg-card border border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{sym}{subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AI Optimization Fee</span>
            <span className="text-foreground">{sym}{aiFee}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold" style={{ color: "#C9A84C" }}>{sym}{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
        <button
          onClick={() => navigate("/add-ons")}
          className="w-full rounded-2xl py-3.5 text-base font-semibold transition-all hover:brightness-110"
          style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
        >
          Continue — {sym}{total.toFixed(0)}
        </button>
      </div>
    </div>
  );
}
