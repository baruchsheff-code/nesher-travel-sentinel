import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bird, Plane, Loader2 } from "lucide-react";
import { useFlightSearch, type DuffelOffer } from "@/contexts/FlightSearchContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import FlightCard from "@/components/FlightCard";
import SearchLoadingScreen from "@/components/SearchLoadingScreen";

const formatTime = (iso: string) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", ILS: "₪", CAD: "CA$" };

export default function SelectReturn() {
  const navigate = useNavigate();
  const { searchParams, outboundOffer, setReturnOffer, allReturnOffers, setAllReturnOffers } = useFlightSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!outboundOffer || !searchParams) {
      navigate("/", { replace: true });
    }
  }, [outboundOffer, searchParams, navigate]);

  const fetchReturnFlights = useCallback(async () => {
    if (!searchParams?.returnDate || !searchParams) return;
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase.functions.invoke("search-flights", {
        body: {
          origin: searchParams.destinationIata,
          destination: searchParams.originIata,
          departure_date: searchParams.returnDate,
          cabin_class: searchParams.cabinClass,
          adult_count: searchParams.adults,
        },
      });
      if (err) throw err;
      if (data?.offers && Array.isArray(data.offers)) {
        console.log("Search complete:", data.offers.length, "return offers received");
        setAllReturnOffers(data.offers);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error("Return search error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [searchParams, setAllReturnOffers]);

  useEffect(() => {
    fetchReturnFlights();
  }, [fetchReturnFlights]);

  const handleSelect = (offer: DuffelOffer) => {
    setReturnOffer(offer);
    navigate("/trip-review");
  };

  if (!outboundOffer || !searchParams) return null;

  const sym = symbols[outboundOffer.total_currency] || "$";

  if (loading) return <SearchLoadingScreen />;

  return (
    <div className="min-h-screen bg-background pb-8 animate-fade-in">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] text-primary-foreground font-bold">✓</span>
            </div>
            <span className="text-xs font-medium text-primary">Outbound</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] text-primary-foreground font-bold">●</span>
            </div>
            <span className="text-xs font-medium text-primary">Return</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">○</span>
            </div>
            <span className="text-xs text-muted-foreground">Review</span>
          </div>
        </div>
      </div>

      {/* Outbound summary */}
      <div className="mx-4 mb-4 rounded-2xl p-3 bg-card border border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold" style={{ color: "#22C55E" }}>✓ Outbound selected</span>
        </div>
        <p className="text-sm text-foreground">
          {outboundOffer.airline_name} · {outboundOffer.origin_iata}→{outboundOffer.destination_iata}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTime(outboundOffer.departure_time)} · {outboundOffer.duration} · {sym}{parseFloat(outboundOffer.total_amount).toFixed(0)}
        </p>
      </div>

      <h2 className="px-4 text-base font-semibold text-foreground mb-3">Choose your return flight</h2>

      {error ? (
        <div className="px-4 text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">No return flights found.</p>
          <button onClick={() => { setLoading(true); fetchReturnFlights(); }} className="text-sm text-primary underline">Try again</button>
        </div>
      ) : (
        <div className="px-4">
          <p className="text-sm text-muted-foreground mb-3">{allReturnOffers.length} flights found</p>
          {allReturnOffers.map((offer) => (
            <FlightCard key={offer.id} offer={offer} onSelect={() => handleSelect(offer)} />
          ))}
        </div>
      )}
    </div>
  );
}
