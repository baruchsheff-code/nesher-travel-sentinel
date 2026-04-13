import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Umbrella, Lock, RefreshCw, CheckCircle2, Plane } from "lucide-react";
import { useFlightSearch } from "@/contexts/FlightSearchContext";
import { useState, useEffect } from "react";

const formatTime = (iso: string) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};
const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", ILS: "₪", CAD: "CA$" };

const AddonToggle = ({ icon, title, subtitle, description, price, checked, onToggle, free }: {
  icon: React.ReactNode; title: string; subtitle: string; description: string;
  price?: number; checked: boolean; onToggle: () => void; free?: boolean;
}) => (
  <div
    className={`rounded-2xl p-4 border transition-all cursor-pointer ${checked ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
    onClick={onToggle}
  >
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

export default function AddOns() {
  const navigate = useNavigate();
  const { outboundOffer, returnOffer, searchParams } = useFlightSearch();

  useEffect(() => {
    if (!outboundOffer) {
      navigate("/", { replace: true });
    }
  }, [outboundOffer, navigate]);

  const [addInsurance, setAddInsurance] = useState(false);
  const [addConnectionGuarantee, setAddConnectionGuarantee] = useState(false);
  const [addPriceFreeze, setAddPriceFreeze] = useState(false);
  const [addAutoCheckin, setAddAutoCheckin] = useState(false);
  const [addAutoRecovery, setAddAutoRecovery] = useState(false);

  if (!outboundOffer) return null;

  const sym = symbols[outboundOffer.total_currency] || "$";
  const outPrice = parseFloat(outboundOffer.total_amount);
  const retPrice = returnOffer ? parseFloat(returnOffer.total_amount) : 0;
  const flightTotal = outPrice + retPrice;
  const aiFee = 30;

  const insuranceCost = 49;
  const connectionGuaranteeCost = 49;
  const freezeCost = 12;

  const hasStops = outboundOffer.stops > 0 || (returnOffer?.stops ?? 0) > 0;

  const addonsTotal =
    (addInsurance ? insuranceCost : 0) +
    (addConnectionGuarantee ? connectionGuaranteeCost : 0) +
    (addPriceFreeze ? freezeCost : 0);

  const grandTotal = flightTotal + aiFee + addonsTotal;

  return (
    <div className="min-h-screen bg-background pb-44 animate-fade-in">
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Customize your trip</h1>
        </div>
      </div>

      {/* Flight summary */}
      <div className="px-4 mt-4 space-y-3">
        <div className="rounded-2xl p-3 bg-card border border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Outbound</p>
          <p className="text-sm font-semibold text-foreground">{outboundOffer.airline_name} · {outboundOffer.airline_code}{outboundOffer.flight_number}</p>
          <p className="text-xs text-muted-foreground">{outboundOffer.origin_iata} → {outboundOffer.destination_iata} · {formatTime(outboundOffer.departure_time)} · {outboundOffer.duration}</p>
        </div>
        {returnOffer && (
          <div className="rounded-2xl p-3 bg-card border border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Return</p>
            <p className="text-sm font-semibold text-foreground">{returnOffer.airline_name} · {returnOffer.airline_code}{returnOffer.flight_number}</p>
            <p className="text-xs text-muted-foreground">{returnOffer.origin_iata} → {returnOffer.destination_iata} · {formatTime(returnOffer.departure_time)} · {returnOffer.duration}</p>
          </div>
        )}

        {/* Add-ons */}
        <h2 className="text-base font-semibold text-foreground pt-2">Add-ons</h2>
        <div className="space-y-3">
          <AddonToggle
            icon={<Umbrella size={18} className="text-primary" />}
            title="Travel Insurance"
            subtitle={`${sym}${insuranceCost}`}
            description="Covers cancellations, delays, and medical emergencies."
            price={insuranceCost}
            checked={addInsurance}
            onToggle={() => setAddInsurance(!addInsurance)}
          />

          {hasStops && (
            <AddonToggle
              icon={<Shield size={18} style={{ color: "#22C55E" }} />}
              title="Connection Guarantee"
              subtitle={`${sym}${connectionGuaranteeCost}`}
              description="If you miss your connection we rebook you immediately at no extra cost."
              price={connectionGuaranteeCost}
              checked={addConnectionGuarantee}
              onToggle={() => setAddConnectionGuarantee(!addConnectionGuarantee)}
            />
          )}

          <AddonToggle
            icon={<Lock size={18} className="text-primary" />}
            title="Price Freeze"
            subtitle={`${sym}${freezeCost}`}
            description="Lock this price for 24 hours."
            price={freezeCost}
            checked={addPriceFreeze}
            onToggle={() => setAddPriceFreeze(!addPriceFreeze)}
          />

          <AddonToggle
            icon={<CheckCircle2 size={18} className="text-primary" />}
            title="Auto Check-in"
            subtitle="Free"
            description="We check you in the moment the window opens and grab the best available seat."
            checked={addAutoCheckin}
            onToggle={() => setAddAutoCheckin(!addAutoCheckin)}
            free
          />

          <AddonToggle
            icon={<RefreshCw size={18} className="text-primary" />}
            title="Auto Recovery"
            subtitle="Free"
            description="If your flight is cancelled we automatically rebook you on the next available flight. Requires saved payment method."
            checked={addAutoRecovery}
            onToggle={() => setAddAutoRecovery(!addAutoRecovery)}
            free
          />
        </div>
      </div>

      {/* Bottom pricing */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Flight{returnOffer ? "s" : ""}</span>
            <span className="text-foreground">{sym}{flightTotal.toFixed(0)}</span>
          </div>
          {addonsTotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Add-ons</span>
              <span className="text-foreground">{sym}{addonsTotal}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">AI Fee</span>
            <span className="text-foreground">{sym}{aiFee}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold" style={{ color: "#C9A84C" }}>{sym}{grandTotal.toFixed(0)}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/payment")}
          className="w-full rounded-2xl py-3.5 text-base font-semibold transition-all hover:brightness-110"
          style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
        >
          Book for {sym}{grandTotal.toFixed(0)}
        </button>
      </div>
    </div>
  );
}
