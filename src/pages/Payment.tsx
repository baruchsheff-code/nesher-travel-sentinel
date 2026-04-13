import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useFlightSearch } from "@/contexts/FlightSearchContext";
import { useEffect } from "react";

const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", ILS: "₪", CAD: "CA$" };

export default function Payment() {
  const navigate = useNavigate();
  const { outboundOffer, returnOffer } = useFlightSearch();

  useEffect(() => {
    if (!outboundOffer) navigate("/", { replace: true });
  }, [outboundOffer, navigate]);

  if (!outboundOffer) return null;

  const sym = symbols[outboundOffer.total_currency] || "$";
  const outPrice = parseFloat(outboundOffer.total_amount);
  const retPrice = returnOffer ? parseFloat(returnOffer.total_amount) : 0;
  const aiFee = 30;
  const total = outPrice + retPrice + aiFee;

  return (
    <div className="min-h-screen bg-background pb-8 animate-fade-in">
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Payment</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Order summary */}
        <div className="rounded-2xl p-4 bg-card border border-border space-y-2">
          <p className="text-sm font-semibold text-foreground mb-2">Order Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{outboundOffer.airline_name} · {outboundOffer.origin_iata}→{outboundOffer.destination_iata}</span>
            <span className="text-foreground font-medium">{sym}{outPrice.toFixed(0)}</span>
          </div>
          {returnOffer && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{returnOffer.airline_name} · {returnOffer.origin_iata}→{returnOffer.destination_iata}</span>
              <span className="text-foreground font-medium">{sym}{retPrice.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AI Optimization Fee</span>
            <span className="text-foreground font-medium">${aiFee}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
            <span className="text-foreground">Total</span>
            <span style={{ color: "#C9A84C" }}>{sym}{total.toFixed(0)}</span>
          </div>
        </div>

        {/* Payment form placeholder */}
        <div className="rounded-2xl p-4 bg-card border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">Payment Details</p>
          <p className="text-xs text-muted-foreground">Stripe payment integration coming soon. This is a test booking.</p>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Card number</label>
            <div className="h-10 rounded-xl bg-muted/30 border border-border" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">MM / YY</label>
              <div className="h-10 rounded-xl bg-muted/30 border border-border" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">CVC</label>
              <div className="h-10 rounded-xl bg-muted/30 border border-border" />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock size={10} /> 256-bit encrypted · PCI DSS compliant
        </p>

        <button
          onClick={() => navigate("/booking-confirmation")}
          className="w-full font-bold py-4 rounded-2xl text-lg transition-colors"
          style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
        >
          Complete Booking · {sym}{total.toFixed(0)}
        </button>
      </div>
    </div>
  );
}
