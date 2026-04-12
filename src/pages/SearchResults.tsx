import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Plane, Globe, CreditCard, Lock, ChevronDown, Shield, Zap } from "lucide-react";
import { parseDestination, MOCK_SAFETY } from "@/lib/destinations";
import { getMockFlightsForDestination, type FlightResult } from "@/lib/mockFlights";
import { useState, useMemo } from "react";

type Tab = "best" | "direct" | "crisis";

const SafetyBanner = ({ iata, city }: { iata: string; city: string }) => {
  const info = MOCK_SAFETY[iata];
  if (!info || info.score >= 7) return null;

  if (info.alertLevel === "advisory") {
    return (
      <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(251, 191, 36, 0.12)", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
        <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: "#FBBF24" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>Safety Advisory — {city}</p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{info.eventSummary}</p>
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
        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>We strongly recommend Crisis-Safe routing for this destination.</p>
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

const FlightCard = ({ flight, isHiddenBySkiplag, onSelect }: { flight: FlightResult; isHiddenBySkiplag?: boolean; onSelect?: () => void }) => {
  const [expanded, setExpanded] = useState(false);

  if (isHiddenBySkiplag && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-2xl px-4 py-3 flex items-center justify-between mb-3"
        style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          1 hidden-city fare hidden — protecting your {flight.airlineName} account 🛡️
        </span>
        <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
      </button>
    );
  }

  const predColor = flight.prediction === "buy" ? "#22C55E" : "hsl(var(--muted-foreground))";

  return (
    <div onClick={onSelect} className="rounded-2xl p-4 mb-3 relative cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all duration-200" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      {/* DEMO badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <SafetyBadge score={flight.safetyScore} />
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>DEMO</span>
      </div>

      {/* Skiplag badge */}
      {flight.isSkiplag && (
        <div className="mb-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#FBBF24" }}>
            Hidden City Fare ⚡
          </span>
        </div>
      )}

      {/* Split ticket badge */}
      {flight.isSplitTicket && (
        <div className="mb-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
            Split Ticket · {flight.splitDetails}
          </span>
        </div>
      )}

      {/* Airline row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="rounded-full flex items-center justify-center text-xs font-bold" style={{ width: 36, height: 36, backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
          {flight.airlineCode}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{flight.airlineName}</p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{flight.flightNumber} · {flight.cabinClass}</p>
        </div>
      </div>

      {/* Time row */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{flight.departureTime}</p>
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{flight.originIata}</p>
        </div>

        <div className="flex-1 flex flex-col items-center px-3">
          <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{flight.durationFormatted}</p>
          <div className="flex items-center gap-1 w-full my-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
            <Plane size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
            <div className="flex-1 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
          </div>
          <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
            {flight.arrivalTime}
            {flight.arrivesNextDay && <sup className="text-[10px] ml-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>+1</sup>}
          </p>
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{flight.destinationIata}</p>
        </div>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: "hsl(var(--primary))" }}>${flight.priceUsd.toLocaleString()}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${predColor}18`, color: predColor }}>
            {flight.prediction === "buy" ? "Buy Now" : "Wait"} · {flight.predictionConfidence}%
          </span>
        </div>
        <button className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ border: "1px solid hsl(var(--primary))", color: "hsl(var(--primary))" }}>
          <Lock size={12} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
          Freeze Price
        </button>
      </div>

      {/* Info lines */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <CreditCard size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Earn {flight.pointsEarn.toLocaleString()} pts on {flight.pointsCard}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{flight.visaInfo}</span>
        </div>
        {flight.isResilientCarrier && (
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: "#22C55E" }} />
            <span className="text-xs" style={{ color: "#22C55E" }}>Resilient carrier</span>
          </div>
        )}
      </div>

      {/* Skiplag warning if expanded */}
      {isHiddenBySkiplag && expanded && (
        <div className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
          <p className="text-xs" style={{ color: "#FBBF24" }}>
            ⚠️ Hidden-city ticketing on {flight.airlineName} may risk your frequent flyer account. You've flown with them recently.
          </p>
        </div>
      )}
    </div>
  );
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const originParam = searchParams.get("origin");
  const dateParam = searchParams.get("date");
  const cardParam = searchParams.get("card");
  const [activeTab, setActiveTab] = useState<Tab>("best");

  const destination = useMemo(() => parseDestination(query), [query]);
  const flights = useMemo(
    () => (destination ? getMockFlightsForDestination(destination.iata) : []),
    [destination]
  );

  // Mock: user flew United in the last 6 months
  const recentAirlines = ["UA"];

  const tabs: { key: Tab; label: string }[] = [
    { key: "best", label: "Best Value" },
    { key: "direct", label: "Most Direct" },
    { key: "crisis", label: "Crisis-Safe" },
  ];

  const sortedFlights = useMemo(() => {
    const list = [...flights];
    if (activeTab === "direct") {
      list.sort((a, b) => a.stops - b.stops || a.priceUsd - b.priceUsd);
    } else if (activeTab === "crisis") {
      list.sort((a, b) => (b.isResilientCarrier ? 1 : 0) - (a.isResilientCarrier ? 1 : 0));
    } else {
      list.sort((a, b) => a.priceUsd - b.priceUsd);
    }
    return list;
  }, [flights, activeTab]);

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>Destination not found</p>
          <p className="text-sm mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>Try searching for a city like "Tel Aviv" or "Istanbul"</p>
          <button onClick={() => navigate("/")} className="mt-4 text-sm font-medium underline" style={{ color: "hsl(var(--primary))" }}>Back to search</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8 animate-fade-in">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft size={22} style={{ color: "hsl(var(--foreground))" }} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 rounded-full px-4 py-2 text-sm text-left truncate"
            style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
          >
            {query}
          </button>
        </div>
        <p className="text-sm font-semibold mt-3" style={{ color: "hsl(var(--foreground))" }}>
          {sortedFlights.length} flights to {destination.city}, {destination.country}
        </p>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Showing flights to {destination.city}, {destination.country}
        </p>
      </div>

      {/* Safety Banner */}
      <SafetyBanner iata={destination.iata} city={destination.city} />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
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

      {/* Flight Cards */}
      <div className="px-4">
        {sortedFlights.map((flight) => {
          const isHiddenBySkiplag = flight.isSkiplag && recentAirlines.includes(flight.airlineCode);
          return (
            <FlightCard
              key={flight.id}
              flight={flight}
              isHiddenBySkiplag={isHiddenBySkiplag}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
