import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bird, Pencil, RefreshCw } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFlightSearch, type DuffelOffer } from "@/contexts/FlightSearchContext";
import FlightCard from "@/components/FlightCard";
import FlightSearchBar, { type FlightSearchParams } from "@/components/FlightSearchBar";
import SearchLoadingScreen from "@/components/SearchLoadingScreen";
import { format } from "date-fns";
import { parseDestination, DESTINATION_MAP, type Destination } from "@/lib/destinations";

type SortMode = "best" | "cheapest" | "fastest";

function findDestByIata(iata: string): Destination | null {
  for (const d of Object.values(DESTINATION_MAP)) {
    if (d.iata === iata) return d;
  }
  return null;
}

function parseDurationMinutes(dur: string): number {
  const h = dur.match(/(\d+)h/);
  const m = dur.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0) || 9999;
}

const SearchResults = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const {
    setSearchParams: setCtxParams, setOutboundOffer,
    setAllOutboundOffers, allOutboundOffers,
  } = useFlightSearch();

  const [activeTab, setActiveTab] = useState<SortMode>("best");
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState(false);
  const [offers, setOffers] = useState<DuffelOffer[]>([]);
  const [editSearch, setEditSearch] = useState(false);

  const destIata = sp.get("dest") || "";
  const destCity = sp.get("destCity") || "";
  const destCountry = sp.get("destCountry") || "";
  const destFlag = sp.get("destFlag") || "";
  const originIata = sp.get("origin") || "";
  const originCity = sp.get("originCity") || "";
  const dateStr = sp.get("date") || "";
  const returnDateStr = sp.get("returnDate") || "";
  const cabinClass = sp.get("cabin") || "economy";
  const adultsParam = Number(sp.get("adults") || "1");
  const tripType = sp.get("tripType") || "one-way";

  const destination = useMemo(() => {
    if (destIata) return findDestByIata(destIata) || { iata: destIata, city: destCity, country: destCountry, flag: destFlag, airport: "" };
    return parseDestination(sp.get("q") || "");
  }, [destIata, destCity, destCountry, destFlag, sp]);

  const fetchFlights = useCallback(async () => {
    setSearchError(false);
    if (!destination || !originIata || !dateStr) {
      setSearchError(true);
      setLoading(false);
      return;
    }

    // Store search params in context
    setCtxParams({
      tripType,
      originIata,
      originCity: originCity || findDestByIata(originIata)?.city || originIata,
      destinationIata: destination.iata,
      destinationCity: destination.city,
      departureDate: dateStr,
      returnDate: returnDateStr || undefined,
      cabinClass,
      adults: adultsParam,
      children: 0,
      infants: 0,
    });

    try {
      const { data, error } = await supabase.functions.invoke("search-flights", {
        body: {
          origin: originIata,
          destination: destination.iata,
          departure_date: dateStr,
          cabin_class: cabinClass,
          adult_count: adultsParam,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const rawOffers = data?.offers;
      if (Array.isArray(rawOffers) && rawOffers.length > 0) {
        console.log("Search complete:", rawOffers.length, "offers received");
        setOffers(rawOffers);
        setAllOutboundOffers(rawOffers);
      } else {
        setSearchError(true);
        setOffers([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(true);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [destination, originIata, dateStr, cabinClass, adultsParam, tripType, returnDateStr, originCity, setCtxParams, setAllOutboundOffers]);

  useEffect(() => {
    setLoading(true);
    fetchFlights();
  }, [fetchFlights]);

  const handleSelectFlight = (offer: DuffelOffer) => {
    setOutboundOffer(offer);
    if (tripType === "round-trip" && returnDateStr) {
      navigate("/select-return");
    } else {
      navigate("/add-ons");
    }
  };

  const handleEditSearch = (params: FlightSearchParams) => {
    if (!params.origin || !params.destination || !params.departDate) return;
    const newSp = new URLSearchParams();
    newSp.set("origin", params.origin.iata);
    newSp.set("originCity", params.origin.city);
    newSp.set("dest", params.destination.iata);
    newSp.set("destCity", params.destination.city);
    newSp.set("destCountry", params.destination.country);
    newSp.set("destFlag", params.destination.flag);
    newSp.set("date", params.departDate.toISOString().slice(0, 10));
    if (params.returnDate) newSp.set("returnDate", params.returnDate.toISOString().slice(0, 10));
    newSp.set("cabin", params.cabinClass);
    newSp.set("adults", String(params.adults));
    newSp.set("tripType", params.tripType);
    navigate(`/search?${newSp.toString()}`);
    setEditSearch(false);
  };

  const sortedOffers = useMemo(() => {
    const list = [...offers];
    if (activeTab === "cheapest") {
      list.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount));
    } else if (activeTab === "fastest") {
      list.sort((a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration));
    } else {
      // Best value: price ASC then stops ASC
      list.sort((a, b) => {
        const priceDiff = parseFloat(a.total_amount) - parseFloat(b.total_amount);
        if (priceDiff !== 0) return priceDiff;
        return a.stops - b.stops;
      });
    }
    return list;
  }, [offers, activeTab]);

  const tabs: { key: SortMode; label: string }[] = [
    { key: "best", label: "✓ Best Value" },
    { key: "cheapest", label: "Cheapest" },
    { key: "fastest", label: "Fastest" },
  ];

  const formattedDate = dateStr ? format(new Date(dateStr + "T12:00:00"), "MMM d") : "";
  const cabinLabels: Record<string, string> = { economy: "Economy", premium_economy: "Premium Eco", business: "Business", first: "First" };
  const isRoundTrip = tripType === "round-trip";

  if (loading) return <SearchLoadingScreen />;

  if (searchError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <Bird size={48} className="text-primary" strokeWidth={2.5} />
        <h2 className="text-lg font-semibold text-foreground text-center">We couldn't load live fares right now.</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">Try adjusting your dates or search again.</p>
        <button
          onClick={() => { setLoading(true); fetchFlights(); }}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:brightness-110"
          style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
        >
          <RefreshCw size={16} /> Try again
        </button>
        <button onClick={() => navigate("/")} className="text-sm text-primary underline mt-2">Back to search</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8 animate-fade-in">
      {/* Test mode pill */}
      <div className="flex justify-end px-4 mt-2 mb-1">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#FBBF24" }}>
          Test mode
        </span>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <Bird className="text-primary shrink-0" size={20} strokeWidth={2.5} />
          <span className="text-primary font-bold text-sm">Nesher</span>
        </div>

        {editSearch ? (
          <div className="mt-3">
            <FlightSearchBar
              compact
              onSearch={handleEditSearch}
              initialParams={{
                origin: findDestByIata(originIata),
                destination: destination as any,
                departDate: dateStr ? new Date(dateStr + "T12:00:00") : null,
                returnDate: returnDateStr ? new Date(returnDateStr + "T12:00:00") : null,
                cabinClass: cabinClass as any,
                adults: adultsParam,
                tripType: tripType as any,
              }}
            />
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground font-medium truncate min-w-0">
              <span>{destination?.flag || "✈️"}</span>
              <span className="truncate">{destination?.city}</span>
              {formattedDate && <span className="text-muted-foreground">· {formattedDate}</span>}
              <span className="text-muted-foreground">· {cabinLabels[cabinClass] || "Economy"}</span>
            </div>
            <button onClick={() => setEditSearch(true)} className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <Pencil size={12} /> Edit
            </button>
          </div>
        )}

        {/* Progress bar for round trip */}
        {isRoundTrip && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground font-bold">●</span>
              </div>
              <span className="text-xs font-medium text-primary">Outbound</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border border-border" />
              <span className="text-xs text-muted-foreground">Return</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border border-border" />
              <span className="text-xs text-muted-foreground">Review</span>
            </div>
          </div>
        )}

        <p className="text-sm font-semibold mt-2 text-foreground">
          {sortedOffers.length} flights · {findDestByIata(originIata)?.city || originCity || originIata} → {destination?.city}{formattedDate ? ` · ${formattedDate}` : ""}
        </p>

        {isRoundTrip && (
          <p className="text-xs text-muted-foreground mt-1">Choose your outbound flight</p>
        )}
      </div>

      {/* Sort pills */}
      <div className="flex gap-2 px-4 mt-3 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200"
            style={
              activeTab === tab.key
                ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" }
                : { color: "hsl(var(--muted-foreground))" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Flight cards */}
      <div className="px-4">
        {sortedOffers.map((offer) => (
          <FlightCard
            key={offer.id}
            offer={offer}
            onSelect={() => handleSelectFlight(offer)}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
