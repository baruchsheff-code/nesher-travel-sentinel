import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Plane, Globe, CreditCard, Lock, ChevronDown, Shield, Zap, Eye, Bird, Pencil, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDestination, MOCK_SAFETY, type Destination, DESTINATION_MAP } from "@/lib/destinations";
import { getMockFlightsForDestination, type FlightResult } from "@/lib/mockFlights";
import { useState, useMemo, useEffect, useCallback } from "react";
import PriceWatchModal from "@/components/PriceWatchModal";
import SearchLoadingScreen from "@/components/SearchLoadingScreen";
import FlightSearchBar, { type FlightSearchParams } from "@/components/FlightSearchBar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SortMode = "best" | "cheapest" | "fastest";

const SafetyBanner = ({ iata, city }: { iata: string; city: string }) => {
  const info = MOCK_SAFETY[iata];
  if (!info || info.score >= 7) return null;

  if (info.alertLevel === "advisory") {
    return (
      <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(251, 191, 36, 0.12)", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
        <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: "#FBBF24" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>Safety Advisory — {city}</p>
          <p className="text-xs mt-1 text-muted-foreground">{info.eventSummary}</p>
          <button className="text-xs font-medium mt-2 underline" style={{ color: "#FBBF24" }}>View Crisis-Safe routes →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
      <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: "#EF4444" }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>Critical Warning — {city}</p>
        <p className="text-xs mt-1 text-muted-foreground">We strongly recommend Crisis-Safe routing for this destination.</p>
        <button className="text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#EF4444", color: "#fff" }}>View Crisis-Safe routes</button>
      </div>
    </div>
  );
};

const SafetyBadge = ({ score }: { score: number }) => {
  const color = score >= 7 ? "#22C55E" : score >= 5 ? "#FBBF24" : "#EF4444";
  return (
    <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
      <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: color }} />
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
};

const currencySymbol = (c: string) => {
  const map: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", ILS: "₪" };
  return map[c] || c + " ";
};

const FareExpiry = ({ expiresAt }: { expiresAt: string }) => {
  const [remaining, setRemaining] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
      setIsUrgent(mins < 5);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  return (
    <span className={cn("text-[10px] font-medium", isUrgent ? "text-amber-500" : "text-muted-foreground")}>
      Fare expires in {remaining}
    </span>
  );
};

const FlightCard = ({ flight, isHiddenBySkiplag, onSelect, onWatch, apiSource }: { flight: FlightResult; isHiddenBySkiplag?: boolean; onSelect?: () => void; onWatch?: () => void; apiSource?: "duffel" | "mock" }) => {
  const [expanded, setExpanded] = useState(false);

  if (isHiddenBySkiplag && !expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full rounded-2xl px-4 py-3 flex items-center justify-between mb-3 bg-card border border-border">
        <span className="text-xs text-muted-foreground">1 hidden-city fare hidden — protecting your {flight.airlineName} account 🛡️</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
    );
  }

  const predColor = flight.prediction === "buy" ? "#22C55E" : "hsl(var(--muted-foreground))";

  return (
    <div onClick={onSelect} className="rounded-2xl p-4 mb-3 relative cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all duration-200 bg-card border border-border">
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <SafetyBadge score={flight.safetyScore} />
        {apiSource === "mock" && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">DEMO</span>}
      </div>

      {flight.isSkiplag && (
        <div className="mb-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#FBBF24" }}>Hidden City Fare ⚡</span>
        </div>
      )}
      {flight.isSplitTicket && (
        <div className="mb-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Split Ticket · {flight.splitDetails}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 mb-3">
        <div className="rounded-full flex items-center justify-center text-xs font-bold w-9 h-9 bg-muted text-foreground">{flight.airlineCode}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">{flight.airlineName}</p>
          <p className="text-xs text-muted-foreground">{flight.flightNumber} · {flight.cabinClass}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{flight.departureTime}</p>
          <p className="text-xs font-medium text-muted-foreground">{flight.originIata}</p>
        </div>
        <div className="flex-1 flex flex-col items-center px-3">
          <p className="text-[11px] text-muted-foreground">{flight.durationFormatted}</p>
          <div className="flex items-center gap-1 w-full my-1">
            <div className="flex-1 h-px bg-border" />
            <Plane size={14} className="text-muted-foreground" />
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {flight.stops === 0 ? "Nonstop" : flight.stops === 1
              ? `1 stop${flight.stopAirports?.[0] ? ` · ${flight.stopAirports[0]}` : flight.layoverAirport ? ` · ${flight.layoverAirport}` : ""}`
              : `${flight.stops} stops`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">
            {flight.arrivalTime}
            {flight.arrivesNextDay && <sup className="text-[10px] ml-0.5 text-muted-foreground">+1</sup>}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{flight.destinationIata}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">{currencySymbol(flight.totalCurrency || "USD")}{flight.priceUsd.toLocaleString()}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${predColor}18`, color: predColor }}>
            {flight.prediction === "buy" ? "Buy Now" : "Wait"} · {flight.predictionConfidence}%
          </span>
        </div>
        <button className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-primary text-primary">
          <Lock size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />Freeze Price
        </button>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onWatch?.(); }} className="w-full rounded-xl py-2 text-xs font-medium flex items-center justify-center gap-1.5 mb-3 transition-colors hover:opacity-80 bg-muted text-muted-foreground">
        <Eye size={13} /> Watch this fare 👁️
      </button>

      {flight.expiresAt && (
        <div className="mb-2">
          <FareExpiry expiresAt={flight.expiresAt} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <CreditCard size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Earn {flight.pointsEarn.toLocaleString()} pts on {flight.pointsCard}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{flight.visaInfo}</span>
        </div>
        {flight.isResilientCarrier && (
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: "#22C55E" }} />
            <span className="text-xs" style={{ color: "#22C55E" }}>Resilient carrier</span>
          </div>
        )}
      </div>

      {isHiddenBySkiplag && expanded && (
        <div className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
          <p className="text-xs" style={{ color: "#FBBF24" }}>⚠️ Hidden-city ticketing on {flight.airlineName} may risk your frequent flyer account.</p>
        </div>
      )}
    </div>
  );
};

// Find destination from IATA
function findDestByIata(iata: string): Destination | null {
  for (const d of Object.values(DESTINATION_MAP)) {
    if (d.iata === iata) return d;
  }
  return null;
}

// Transform Duffel offer into FlightResult
function transformDuffelOffer(offer: any, index: number): FlightResult {
  const slice = offer.slices?.[0];
  const segments = slice?.segments || [];
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  // Prefer offer.owner for airline info (more reliable than segment carrier)
  const owner = offer.owner || {};
  const airlineCode = owner.iata_code || firstSeg?.operating_carrier?.iata_code || firstSeg?.marketing_carrier?.iata_code || "??";
  const airlineName = owner.name || firstSeg?.operating_carrier?.name || "Unknown Airline";

  const depTime = firstSeg?.departing_at ? format(new Date(firstSeg.departing_at), "HH:mm") : "00:00";
  const arrTime = lastSeg?.arriving_at ? format(new Date(lastSeg.arriving_at), "HH:mm") : "00:00";
  const depDate = firstSeg?.departing_at ? new Date(firstSeg.departing_at).getDate() : 0;
  const arrDate = lastSeg?.arriving_at ? new Date(lastSeg.arriving_at).getDate() : 0;

  const stops = Math.max(segments.length - 1, 0);

  // Layover airport for 1-stop flights
  const layoverAirport = stops === 1 ? (segments[0]?.destination?.iata_code || "") : undefined;

  // Duration from slice
  const durationIso = slice?.duration || "";
  const durationMatch = durationIso.match(/PT(\d+)H(?:(\d+)M)?/);
  const durationFormatted = durationMatch
    ? `${durationMatch[1]}h ${durationMatch[2] || "0"}m`
    : "—";

  const cabinMap: Record<string, string> = { economy: "Economy", premium_economy: "Premium Eco", business: "Business", first: "First" };

  const flightNum = firstSeg?.marketing_carrier_flight_number
    ? `${firstSeg?.marketing_carrier?.iata_code || airlineCode}${firstSeg.marketing_carrier_flight_number}`
    : "—";

  return {
    id: offer.id || `duffel-${index}`,
    airlineCode,
    airlineName,
    flightNumber: flightNum,
    cabinClass: cabinMap[offer.cabin_class] || offer.cabin_class || "Economy",
    originIata: firstSeg?.origin?.iata_code || slice?.origin?.iata_code || "???",
    destinationIata: lastSeg?.destination?.iata_code || slice?.destination?.iata_code || "???",
    departureTime: depTime,
    arrivalTime: arrTime,
    arrivesNextDay: arrDate !== depDate,
    durationFormatted,
    stops,
    layoverAirport,
    priceUsd: parseFloat(offer.total_amount) || 0,
    totalCurrency: offer.total_currency || "USD",
    prediction: parseFloat(offer.total_amount) < 800 ? "buy" : "wait",
    predictionConfidence: Math.floor(60 + Math.random() * 30),
    pointsEarn: Math.floor((parseFloat(offer.total_amount) || 0) * 3),
    pointsCard: "Your Card",
    visaInfo: "Check visa requirements",
    safetyScore: 8,
    isSkiplag: false,
    isSplitTicket: false,
    isResilientCarrier: false,
    stopAirports: segments.length > 1 ? segments.slice(0, -1).map((s: any) => s.destination?.iata_code || "") : [],
    expiresAt: offer.expires_at || undefined,
  };
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SortMode>("best");
  const [watchFlight, setWatchFlight] = useState<FlightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSearch, setEditSearch] = useState(false);
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [apiSource, setApiSource] = useState<"duffel" | "mock">("mock");
  const [searchError, setSearchError] = useState(false);

  // Parse params
  const destIata = searchParams.get("dest") || "";
  const destCity = searchParams.get("destCity") || "";
  const destCountry = searchParams.get("destCountry") || "";
  const destFlag = searchParams.get("destFlag") || "";
  const originIata = searchParams.get("origin") || "";
  const dateStr = searchParams.get("date") || "";
  const cabinClass = searchParams.get("cabin") || "economy";
  const adultsParam = Number(searchParams.get("adults") || "1");
  const tripType = searchParams.get("tripType") || "one-way";

  // Legacy support
  const legacyQuery = searchParams.get("q") || "";
  const destination = useMemo(() => {
    if (destIata) return findDestByIata(destIata) || { iata: destIata, city: destCity, country: destCountry, flag: destFlag, airport: "" };
    return parseDestination(legacyQuery);
  }, [destIata, destCity, destCountry, destFlag, legacyQuery]);

  // Fetch flights from Duffel API via edge function
  const fetchFlights = useCallback(async () => {
    setSearchError(false);
    if (!destination || !originIata || !dateStr) {
      setFlights(destination ? getMockFlightsForDestination(destination.iata) : []);
      setApiSource("mock");
      setLoading(false);
      return;
    }

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

      const offers = data?.offers;
      if (Array.isArray(offers) && offers.length > 0) {
        setFlights(offers.map((o: any, i: number) => transformDuffelOffer(o, i)));
        setApiSource("duffel");
      } else {
        console.warn("No Duffel offers returned, using mock data");
        setFlights(getMockFlightsForDestination(destination.iata));
        setApiSource("mock");
      }
    } catch (err) {
      console.error("Duffel API error:", err);
      setSearchError(true);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [destination, originIata, dateStr, cabinClass, adultsParam]);

  useEffect(() => {
    setLoading(true);
    fetchFlights();
  }, [fetchFlights]);

  const handleSelectFlight = (flight: FlightResult) => {
    if (destination) navigate(`/flight?id=${flight.id}&dest=${destination.iata}`);
  };

  const handleEditSearch = (params: FlightSearchParams) => {
    if (!params.origin || !params.destination || !params.departDate) return;
    const sp = new URLSearchParams();
    sp.set("origin", params.origin.iata);
    sp.set("dest", params.destination.iata);
    sp.set("destCity", params.destination.city);
    sp.set("destCountry", params.destination.country);
    sp.set("destFlag", params.destination.flag);
    sp.set("date", params.departDate.toISOString().slice(0, 10));
    if (params.returnDate) sp.set("returnDate", params.returnDate.toISOString().slice(0, 10));
    sp.set("cabin", params.cabinClass);
    sp.set("adults", String(params.adults));
    sp.set("tripType", params.tripType);
    navigate(`/search?${sp.toString()}`);
    setEditSearch(false);
  };

  const recentAirlines = ["UA"];
  const tabs: { key: SortMode; label: string }[] = [
    { key: "best", label: "Best Value" },
    { key: "cheapest", label: "Cheapest" },
    { key: "fastest", label: "Fastest" },
  ];

  // Parse duration string like "10h 30m" to minutes for sorting
  const parseDuration = (d: string) => {
    const m = d.match(/(\d+)h\s*(\d+)m/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
  };

  const sortedFlights = useMemo(() => {
    const list = [...flights];
    if (activeTab === "cheapest") list.sort((a, b) => a.priceUsd - b.priceUsd);
    else if (activeTab === "fastest") list.sort((a, b) => parseDuration(a.durationFormatted) - parseDuration(b.durationFormatted));
    else list.sort((a, b) => a.priceUsd * (a.stops + 1) - b.priceUsd * (b.stops + 1)); // best value heuristic
    return list;
  }, [flights, activeTab]);

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

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Destination not found</p>
          <p className="text-sm mt-2 text-muted-foreground">Try searching for a city like "Tel Aviv" or "Istanbul"</p>
          <button onClick={() => navigate("/")} className="mt-4 text-sm font-medium underline text-primary">Back to search</button>
        </div>
      </div>
    );
  }

  const formattedDate = dateStr ? format(new Date(dateStr + "T12:00:00"), "MMM d") : "";
  const cabinLabels: Record<string, string> = { economy: "Economy", premium_economy: "Premium Eco", business: "Business", first: "First" };

  return (
    <div className="min-h-screen bg-background pb-8 animate-fade-in">
      {/* Condensed search header */}
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
                cabinClass: cabinClass as any,
                adults: adultsParam,
                tripType: tripType as any,
              }}
            />
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground font-medium truncate min-w-0">
              <span>{destination.flag || "✈️"}</span>
              <span className="truncate">{destination.city}</span>
              {formattedDate && <span className="text-muted-foreground">· {formattedDate}</span>}
              <span className="text-muted-foreground">· {adultsParam} {adultsParam === 1 ? "Adult" : "Adults"}</span>
              <span className="text-muted-foreground">· {cabinLabels[cabinClass] || "Economy"}</span>
            </div>
            <button onClick={() => setEditSearch(true)} className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <Pencil size={12} /> Edit
            </button>
          </div>
        )}

        <p className="text-sm font-semibold mt-2 text-foreground">
          {sortedFlights.length} flights found · {destination.city}{destination.country ? `, ${destination.country}` : ""}{formattedDate ? ` · ${formattedDate}` : ""}
          {apiSource === "mock" && <span className="text-xs text-muted-foreground ml-2">(Demo data)</span>}
          {apiSource === "duffel" && <span className="text-xs ml-2" style={{ color: "#22C55E" }}>● Live</span>}
        </p>
      </div>

      <SafetyBanner iata={destination.iata} city={destination.city} />

      <div className="flex gap-2 px-4 mb-4 mt-4">
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

      <div className="px-4">
        {sortedFlights.map((flight) => {
          const isHiddenBySkiplag = flight.isSkiplag && recentAirlines.includes(flight.airlineCode);
          return (
            <FlightCard
              key={flight.id}
              flight={flight}
              isHiddenBySkiplag={isHiddenBySkiplag}
              apiSource={apiSource}
              onSelect={() => handleSelectFlight(flight)}
              onWatch={() => setWatchFlight(flight)}
            />
          );
        })}
      </div>

      {watchFlight && destination && (
        <PriceWatchModal
          open={!!watchFlight}
          onClose={() => setWatchFlight(null)}
          originIata={watchFlight.originIata}
          destinationIata={destination.iata}
          currentPrice={watchFlight.priceUsd}
          prediction={watchFlight.prediction}
          predictionConfidence={watchFlight.predictionConfidence}
        />
      )}
    </div>
  );
};

export default SearchResults;
