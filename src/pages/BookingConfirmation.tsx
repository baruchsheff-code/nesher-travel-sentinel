import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useFlightSearch } from "@/contexts/FlightSearchContext";

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const { outboundOffer, returnOffer } = useFlightSearch();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
      <CheckCircle2 size={64} className="text-green-500 mb-4" />
      <h1 className="text-xl font-bold text-foreground mb-1">You're booked!</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Your trip is confirmed. Our team is monitoring your flight 24/7.
      </p>

      {outboundOffer && (
        <div className="w-full max-w-sm rounded-2xl p-4 bg-card border border-border mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Outbound</p>
          <p className="text-sm font-semibold text-foreground">{outboundOffer.airline_name}</p>
          <p className="text-xs text-muted-foreground">
            {outboundOffer.origin_iata} → {outboundOffer.destination_iata} · {formatDate(outboundOffer.departure_time)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Confirmation: {outboundOffer.offer_id.slice(0, 12)}…
          </p>
        </div>
      )}

      {returnOffer && (
        <div className="w-full max-w-sm rounded-2xl p-4 bg-card border border-border mb-6">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Return</p>
          <p className="text-sm font-semibold text-foreground">{returnOffer.airline_name}</p>
          <p className="text-xs text-muted-foreground">
            {returnOffer.origin_iata} → {returnOffer.destination_iata} · {formatDate(returnOffer.departure_time)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Confirmation: {returnOffer.offer_id.slice(0, 12)}…
          </p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => navigate("/")}
          className="w-full font-bold py-3 rounded-2xl transition-colors"
          style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
        >
          Back to Home
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Our team has been notified and will monitor your trip 24/7 🦅
      </p>
    </div>
  );
}
