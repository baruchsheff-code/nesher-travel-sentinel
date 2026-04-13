import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Plane, Globe, CreditCard, Lock, ChevronDown, Shield, Zap, Eye, Bird, Pencil, RefreshCw, Cloud, Wind, Droplets, Thermometer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDestination, type Destination, DESTINATION_MAP } from "@/lib/destinations";
import { type FlightResult } from "@/lib/mockFlights";
import { useState, useMemo, useEffect, useCallback } from "react";
import PriceWatchModal from "@/components/PriceWatchModal";
import SearchLoadingScreen from "@/components/SearchLoadingScreen";
import FlightSearchBar, { type FlightSearchParams } from "@/components/FlightSearchBar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFlightContext } from "@/contexts/FlightContext";
import { toast } from "sonner";

type SortMode = "best" | "cheapest" | "fastest" | "crisis";

interface SafetyData {
  city: string;
  country: string;
  iata_code: string;
  safety_score: number;
  alert_level: "normal" | "advisory" | "warning" | "critical";
  top_events: string[];
  recommendation: string;
  weather: {
    temp_c: number;
    temp_f: number;
    description: string;
    wind_speed_kmh: number;
    humidity: number;
    has_warning: boolean;
    warning_text?: string;
  };
}

const LiveSafetyBanner = ({ safety, city }: { safety: SafetyData; city: string }) => {
  if (safety.alert_level === "normal") {
    return (
      <div className="mx-4 mb-3 mt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", color: "#22C55E", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
          ✓ No travel advisories for {city}
        </span>
      </div>
    );
  }

  if (safety.alert_level === "advisory") {
    return (
      <div className="mx-4 mb-3 mt-3 rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(251, 191, 36, 0.12)", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
        <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: "#FBBF24" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>⚠️ Safety Advisory — {city}</p>
          {safety.top_events.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {safety.top_events.map((e, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1 shrink-0 w-1 h-1 rounded-full bg-amber-400" />
                  {e}
                </li>
              ))}
            </ul>
          )}
          <button className="text-xs font-medium mt-2 underline" style={{ color: "#FBBF24" }}>View Crisis-Safe routes →</button>
        </div>
      </div>
    );
  }

  if (safety.alert_level === "warning") {
    return (
      <div className="mx-4 mb-3 mt-3 rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
        <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: "#F97316" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F97316" }}>🚨 Travel Warning — {city}</p>
          <p className="text-xs mt-1 text-muted-foreground">Exercise increased caution. Multiple incidents reported.</p>
          {safety.top_events.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {safety.top_events.map((e, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1 shrink-0 w-1 h-1 rounded-full bg-orange-400" />
                  {e}
                </li>
              ))}
            </ul>
          )}
          <button className="text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F97316", color: "#fff" }}>Show me safer routing options</button>
        </div>
      </div>
    );
  }

  // critical
  return (
    <div className="mx-4 mb-3 mt-3 rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
      <AlertTriangle className="shrink-0 mt-0.5" size={18} style={{ color: "#EF4444" }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>🔴 Critical Alert — {city}</p>
        <p className="text-xs mt-1 text-muted-foreground">Most commercial carriers have reduced or suspended service.</p>
        <p className="text-xs mt-0.5 text-muted-foreground">We strongly recommend resilient routing for this destination.</p>
        {safety.top_events.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {safety.top_events.map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="mt-1 shrink-0 w-1 h-1 rounded-full bg-red-400" />
                {e}
              </li>
            ))}
          </ul>
        )}
        <button className="text-xs font-semibold mt-2 px-4 py-2 rounded-lg" style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}>Build my crisis-safe route</button>
      </div>
    </div>
  );
};

const WeatherWidget = ({ weather, city }: { weather: SafetyData["weather"]; city: string }) => {
  return (
    <div className="mx-4 mb-4 rounded-2xl px-4 py-3 bg-card border border-border">
      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <Cloud size={14} className="text-muted-foreground" />
        {city} when you arrive
      </p>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Thermometer size={13} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{weather.temp_c}°C / {weather.temp_f}°F</span>
        </div>
        <span className="text-xs text-muted-foreground">{weather.description}</span>
        <div className="flex items-center gap-1">
          <Wind size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{weather.wind_speed_kmh} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <Droplets size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{weather.humidity}%</span>
        </div>
      </div>
      {weather.has_warning && weather.warning_text && (
        <p className="text-xs font-semibold mt-2" style={{ color: "#EF4444" }}>⛈️ {weather.warning_text}</p>
      )}
    </div>
  );
};

const SafetyScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 8 ? "#22C55E" : score >= 5 ? "#FBBF24" : score >= 3 ? "#F97316" : "#EF4444";
  return (
    <div className="group relative flex items-center justify-center rounded-full w-7 h-7" style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}50` }}>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
      <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-popover border border-border text-popover-foreground text-[10px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap z-50">
        Destination safety score based on live news analysis
      </div>
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

const SkiplagWarningModal = ({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onCancel}>
    <div className="bg-card rounded-2xl max-w-md w-full p-6 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Understanding Hidden-City Fares</h3>
        <button onClick={onCancel}><X size={20} className="text-muted-foreground" /></button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        A hidden-city fare means booking a flight with a connection, then leaving the airport at your connection city — not flying the final leg.
      </p>
      <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
        <p className="text-xs font-semibold mb-2" style={{ color: "#FBBF24" }}>⚠️ Rules you MUST follow:</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#FBBF24" }} />Carry-on bags only — checked bags go to the final destination</li>
          <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#FBBF24" }} />One-way tickets only — return legs get cancelled if you skip</li>
          <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#FBBF24" }} />Cannot be a frequent flyer booking</li>
          <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "#FBBF24" }} />Use sparingly — airlines track this</li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Nesher protects your account automatically. We hide these fares if you've used one on this airline in the last 6 months.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-border text-muted-foreground">Cancel</button>
        <button onClick={onAccept} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}>I understand, show them</button>
      </div>
    </div>
  </div>
);

interface SkiplagProtection {
  airlineCode: string;
  daysAgo: number;
  availableIn: number;
}

const ProtectedSkiplagCard = ({ flight, protection }: { flight: FlightResult; protection: SkiplagProtection }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full rounded-2xl px-4 py-3 flex items-center justify-between bg-card border border-border">
        <span className="text-xs text-muted-foreground">🛡️ 1 hidden-city fare hidden — protecting your {flight.airlineName} account</span>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="mt-1 rounded-2xl px-4 py-3 bg-card border border-border">
          <p className="text-xs text-muted-foreground">
            You used a hidden-city fare on <span className="font-semibold text-foreground">{flight.airlineName}</span> {protection.daysAgo} days ago. We've hidden this fare to protect your frequent flyer account from being flagged.
          </p>
          <p className="text-xs mt-1.5 font-medium" style={{ color: "#FBBF24" }}>Available again in {protection.availableIn} days.</p>
        </div>
      )}
    </div>
  );
};

interface CardPoints {
  cardName: string;
  points: number;
  valueUsd: number;
  multiplier: number;
}

function calcCardPoints(priceUsd: number, cards: { card_name: string; points_multiplier: Record<string, number> }[]): CardPoints[] {
  return cards.map(card => {
    const mult = card.points_multiplier;
    // Use flights/travel multiplier if available, else everything, else other
    const m = mult.flights ?? mult.travel ?? mult.everything ?? mult.other ?? 1;
    const points = Math.round(priceUsd * m);
    return { cardName: card.card_name, points, valueUsd: points * 0.015, multiplier: m };
  }).sort((a, b) => b.points - a.points);
}

const PointsBreakdown = ({ cardPoints, bestCard }: { cardPoints: CardPoints[]; bestCard: string }) => (
  <div className="mt-2 rounded-xl px-3 py-3 bg-background border border-border">
    <p className="text-xs font-semibold text-foreground mb-2">Points breakdown for this flight</p>
    <div className="space-y-1.5">
      {cardPoints.map(cp => (
        <div key={cp.cardName} className="flex items-center justify-between text-xs">
          <span className={cp.cardName === bestCard ? "font-semibold text-foreground" : "text-muted-foreground"}>
            {cp.cardName} {cp.cardName === bestCard && "← best"}
          </span>
          <span className={cp.cardName === bestCard ? "font-semibold" : "text-muted-foreground"} style={cp.cardName === bestCard ? { color: "#C9A84C" } : {}}>
            {cp.points.toLocaleString()} pts (~${cp.valueUsd.toFixed(2)})
          </span>
        </div>
      ))}
    </div>
    <p className="text-[11px] text-muted-foreground mt-2">💡 Use <span className="font-semibold text-foreground">{bestCard}</span> for this booking to maximize your return.</p>
  </div>
);

const FlightCard = ({ flight, onSelect, onWatch, isCritical, isCrisisTab, skiplagProtection, userCards }: { flight: FlightResult; onSelect?: () => void; onWatch?: () => void; isCritical?: boolean; isCrisisTab?: boolean; skiplagProtection?: SkiplagProtection | null; userCards?: { card_name: string; points_multiplier: Record<string, number> }[] }) => {
  const [showPointsBreakdown, setShowPointsBreakdown] = useState(false);

  // If this flight is skiplag-protected, show the protected card
  if (flight.isSkiplag && skiplagProtection) {
    return <ProtectedSkiplagCard flight={flight} protection={skiplagProtection} />;
  }

  const predColor = flight.prediction === "buy" ? "#22C55E" : "hsl(var(--muted-foreground))";
  const cardPoints = userCards && userCards.length > 0 ? calcCardPoints(flight.priceUsd, userCards) : [];
  const bestCard = cardPoints.length > 0 ? cardPoints[0] : null;

  return (
    <div onClick={onSelect} className="rounded-2xl p-4 mb-3 relative cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all duration-200 bg-card border border-border">
      <div className="absolute top-3 right-3">
        <SafetyScoreBadge score={flight.safetyScore} />
      </div>

      {isCrisisTab && flight.isResilientCarrier && (
        <div className="mb-2 group/crisis relative">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201, 168, 76, 0.15)", color: "#C9A84C" }}>🛡️ Crisis-Safe Carrier</span>
          <div className="absolute bottom-full left-0 mb-1 hidden group-hover/crisis:block bg-popover border border-border text-popover-foreground text-xs rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap z-50 max-w-[260px] whitespace-normal">
            This airline has historically maintained service during regional disruptions when other carriers cancelled.
          </div>
        </div>
      )}
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
              : `${flight.stops} stops${flight.stopAirports?.length ? ` · ${flight.stopAirports.join(" · ")}` : ""}`}
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
        <div className="flex items-center gap-2 group relative">
          <span className="text-2xl font-bold text-primary">{currencySymbol(flight.totalCurrency || "USD")}{flight.priceUsd.toLocaleString()}</span>
          {(flight.baseAmount != null || flight.taxAmount != null) && (
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-popover border border-border text-popover-foreground text-xs rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap z-50">
              Base: {currencySymbol(flight.totalCurrency || "USD")}{(flight.baseAmount ?? 0).toFixed(2)} · Taxes: {currencySymbol(flight.totalCurrency || "USD")}{(flight.taxAmount ?? 0).toFixed(2)}
            </div>
          )}
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

      {isCritical && (
        <div className="mb-2 rounded-xl px-3 py-1.5" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <p className="text-[11px] font-medium" style={{ color: "#EF4444" }}>⚠️ This carrier may suspend service</p>
        </div>
      )}

      {flight.isSkiplag && !skiplagProtection && (
        <div className="mb-2 rounded-xl px-3 py-1.5" style={{ backgroundColor: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
          <p className="text-[11px] font-medium" style={{ color: "#FBBF24" }}>🧳 Carry-on only · Read the rules before booking</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {bestCard ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowPointsBreakdown(!showPointsBreakdown); }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <CreditCard size={13} style={{ color: "#C9A84C" }} />
            <span className="text-xs font-semibold" style={{ color: "#C9A84C" }}>
              💳 Best card: {bestCard.cardName} — earn {bestCard.points.toLocaleString()} pts (~${bestCard.valueUsd.toFixed(2)} value)
            </span>
          </button>
        ) : userCards && userCards.length === 0 ? (
          <button onClick={(e) => { e.stopPropagation(); window.location.href = "/settings"; }} className="flex items-center gap-2">
            <CreditCard size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground underline">Add your cards to see points earnings →</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Earn {flight.pointsEarn.toLocaleString()} pts on {flight.pointsCard}</span>
          </div>
        )}
        {showPointsBreakdown && cardPoints.length > 0 && bestCard && (
          <PointsBreakdown cardPoints={cardPoints} bestCard={bestCard.cardName} />
        )}
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

// Transform clean mapped offer from edge function into FlightResult
function transformDuffelOffer(offer: any, index: number, safetyScore: number): FlightResult {
  const depTime = offer.departure_time
    ? new Date(offer.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : "00:00";
  const arrTime = offer.arrival_time
    ? new Date(offer.arrival_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : "00:00";

  const depDate = offer.departure_time ? new Date(offer.departure_time) : null;
  const arrDate = offer.arrival_time ? new Date(offer.arrival_time) : null;
  const dayDiff = depDate && arrDate ? Math.floor((arrDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Parse duration for minutes
  const durationRaw = offer.duration_raw || "";
  const dayMatch = durationRaw.match(/P(\d+)D/);
  const hourMatch = durationRaw.match(/(\d+)H/);
  const minMatch = durationRaw.match(/(\d+)M/);
  const totalHours = (dayMatch ? parseInt(dayMatch[1]) * 24 : 0) + (hourMatch ? parseInt(hourMatch[1]) : 0);
  const totalMins = minMatch ? parseInt(minMatch[1]) : 0;
  const durationMinutes = totalHours * 60 + totalMins;

  const priceUsd = parseFloat(offer.total_amount) || 0;

  return {
    id: offer.id || `duffel-${index}`,
    airlineCode: offer.airline_code || "??",
    airlineName: offer.airline_name || "Unknown Airline",
    flightNumber: offer.flight_number ? `${offer.airline_code || ''}${offer.flight_number}` : "—",
    cabinClass: offer.cabin_class || "Economy",
    originIata: offer.origin_iata || "???",
    originCity: offer.origin_city || "",
    destinationIata: offer.destination_iata || "???",
    destinationCity: offer.destination_city || "",
    departureTime: depTime,
    arrivalTime: arrTime,
    arrivesNextDay: dayDiff > 0,
    durationFormatted: offer.duration || "—",
    durationMinutes,
    stops: offer.stops ?? 0,
    layoverAirport: offer.stops === 1 ? (offer.stop_airports?.[0] || "") : undefined,
    stopAirports: offer.stop_airports || [],
    priceUsd,
    totalCurrency: offer.total_currency || "USD",
    baseAmount: offer.base_amount ? parseFloat(offer.base_amount) : null,
    taxAmount: offer.tax_amount ? parseFloat(offer.tax_amount) : null,
    prediction: priceUsd < 800 ? "buy" : "wait",
    predictionConfidence: Math.floor(60 + Math.random() * 30),
    pointsEarn: Math.floor(priceUsd * 3),
    pointsCard: "Your Card",
    visaInfo: "Check visa requirements",
    safetyScore,
    isSkiplag: false,
    isSplitTicket: false,
    isResilientCarrier: false,
    expiresAt: offer.expires_at || undefined,
    emissionsKg: offer.emissions_kg || null,
  };
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSelectedOffer } = useFlightContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SortMode>("best");
  const [watchFlight, setWatchFlight] = useState<FlightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSearch, setEditSearch] = useState(false);
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ source: "LIVE" | "MOCK" | "NONE"; offersReceived: number; origin: string; destination: string } | null>(null);
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null);

  // Skiplag state
  const [showSkiplags, setShowSkiplags] = useState(false);
  const [skiplagModalOpen, setSkiplagModalOpen] = useState(false);
  const [skiplagProtections, setSkiplagProtections] = useState<Record<string, SkiplagProtection>>({});

  // Crisis-safe state
  const [resilientCodes, setResilientCodes] = useState<string[]>([]);
  const [resilientLoaded, setResilientLoaded] = useState(false);

  // User wallet cards for points optimization
  const [userCards, setUserCards] = useState<{ card_name: string; points_multiplier: Record<string, number> }[]>([]);

  const destIata = searchParams.get("dest") || "";
  const destCity = searchParams.get("destCity") || "";
  const destCountry = searchParams.get("destCountry") || "";
  const destFlag = searchParams.get("destFlag") || "";
  const originIata = searchParams.get("origin") || "";
  const dateStr = searchParams.get("date") || "";
  const cabinClass = searchParams.get("cabin") || "economy";
  const adultsParam = Number(searchParams.get("adults") || "1");
  const tripType = searchParams.get("tripType") || "one-way";

  const legacyQuery = searchParams.get("q") || "";
  const destination = useMemo(() => {
    if (destIata) return findDestByIata(destIata) || { iata: destIata, city: destCity, country: destCountry, flag: destFlag, airport: "" };
    return parseDestination(legacyQuery);
  }, [destIata, destCity, destCountry, destFlag, legacyQuery]);

  // Check skiplag history for a set of airline codes
  const checkSkiplagHistory = useCallback(async (airlineCodes: string[]) => {
    if (!user?.id || airlineCodes.length === 0) return;
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const { data } = await supabase
        .from("travel_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_skiplag", true)
        .gte("travel_date", sixMonthsAgo)
        .in("airline_code", airlineCodes);

      if (data && data.length > 0) {
        const protections: Record<string, SkiplagProtection> = {};
        for (const log of data) {
          const travelDate = new Date(log.travel_date!);
          const daysAgo = Math.floor((Date.now() - travelDate.getTime()) / (1000 * 60 * 60 * 24));
          const availableIn = 180 - daysAgo;
          if (availableIn > 0 && log.airline_code) {
            protections[log.airline_code] = {
              airlineCode: log.airline_code,
              daysAgo,
              availableIn,
            };
          }
        }
        setSkiplagProtections(protections);
      }
    } catch (err) {
      console.error("Skiplag history check failed:", err);
    }
  }, [user?.id]);

  // Fetch flights AND safety data in parallel
  const fetchFlights = useCallback(async () => {
    setSearchError(false);
    setSafetyData(null);
    if (!destination || !originIata || !dateStr) {
      setSearchError(true);
      setFlights([]);
      setLoading(false);
      setDebugInfo({ source: "NONE", offersReceived: 0, origin: originIata || "?", destination: destination?.iata || "?" });
      return;
    }

    const searchParams = {
      origin: originIata,
      destination: destination.iata,
      departure_date: dateStr,
      cabin_class: cabinClass,
      adults: adultsParam,
    };
    console.log("[DEBUG] Search params:", searchParams);

    try {
      const [flightResult, safetyResult] = await Promise.all([
        supabase.functions.invoke("search-flights", {
          body: {
            origin: originIata,
            destination: destination.iata,
            departure_date: dateStr,
            cabin_class: cabinClass,
            adult_count: adultsParam,
          },
        }),
        supabase.functions.invoke("check-destination-safety", {
          body: {
            city: destination.city,
            country: destination.country,
            iata_code: destination.iata,
          },
        }),
      ]);

      const sd = safetyResult.data;
      if (sd?.success) {
        setSafetyData(sd as SafetyData);
      }

      const { data, error } = flightResult;
      console.log("[DEBUG] Duffel response data:", data);
      console.log("[DEBUG] Duffel response error:", error);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const offers = data?.offers;
      console.log("[DEBUG] Offers array:", offers);
      console.log("[DEBUG] Offers count:", Array.isArray(offers) ? offers.length : "not an array");

      const score = sd?.safety_score ?? 8;
      if (Array.isArray(offers) && offers.length > 0) {
        const transformed = offers
          .map((o: any, i: number) => {
            console.log(`[DEBUG] Mapping offer ${i}:`, o);
            return transformDuffelOffer(o, i, score);
          })
          .filter((f: FlightResult) => f.airlineCode !== "ZZ");
        setFlights(transformed);
        setDebugInfo({ source: "LIVE", offersReceived: offers.length, origin: originIata, destination: destination.iata });

        const connectingAirlines = [...new Set(transformed.filter(f => f.stops > 0).map(f => f.airlineCode))];
        if (connectingAirlines.length > 0) {
          checkSkiplagHistory(connectingAirlines);
        }
      } else {
        console.log("[DEBUG] No offers found, falling back to error state");
        setSearchError(true);
        setFlights([]);
        setDebugInfo({ source: "NONE", offersReceived: 0, origin: originIata, destination: destination.iata });
      }
    } catch (err) {
      console.error("[DEBUG] Search error:", err);
      setSearchError(true);
      setFlights([]);
      setDebugInfo({ source: "NONE", offersReceived: 0, origin: originIata, destination: destination?.iata || "?" });
    } finally {
      setLoading(false);
    }
  }, [destination, originIata, dateStr, cabinClass, adultsParam, checkSkiplagHistory]);

  useEffect(() => {
    setLoading(true);
    fetchFlights();
  }, [fetchFlights]);

  // Fetch resilient airlines + user wallet cards once
  useEffect(() => {
    const fetchResilient = async () => {
      try {
        const { data } = await supabase.from("resilient_airlines").select("airline_code");
        if (data) setResilientCodes(data.map(a => a.airline_code).filter(Boolean) as string[]);
      } catch (err) {
        console.error("Failed to fetch resilient airlines:", err);
      } finally {
        setResilientLoaded(true);
      }
    };
    const fetchWallet = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase.from("user_wallet").select("card_name, points_multiplier").eq("user_id", user.id);
        if (data) setUserCards(data.filter(c => c.card_name && c.points_multiplier).map(c => ({ card_name: c.card_name!, points_multiplier: c.points_multiplier as Record<string, number> })));
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };
    fetchResilient();
    fetchWallet();
  }, [user?.id]);

  const handleSelectFlight = (flight: FlightResult) => {
    setSelectedOffer(flight);
    navigate('/flight-detail');
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

  const handleToggleSkiplags = () => {
    if (!showSkiplags) {
      setSkiplagModalOpen(true);
    } else {
      setShowSkiplags(false);
    }
  };

  const handleAcceptSkiplags = () => {
    setSkiplagModalOpen(false);
    setShowSkiplags(true);
  };

  const tabs: { key: SortMode; label: string }[] = [
    { key: "best", label: "Best Value" },
    { key: "cheapest", label: "Cheapest" },
    { key: "fastest", label: "Fastest" },
    { key: "crisis", label: "Crisis-Safe" },
  ];

  const getDurationMins = (f: FlightResult) => {
    if (f.durationMinutes) return f.durationMinutes;
    const m = f.durationFormatted.match(/(\d+)h\s*(\d+)m/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
  };

  // Mark connecting flights as potential skiplagged when toggle is on
  const processedFlights = useMemo(() => {
    return flights.map(f => ({
      ...f,
      isSkiplag: showSkiplags && f.stops > 0,
      isResilientCarrier: resilientCodes.includes(f.airlineCode),
    }));
  }, [flights, showSkiplags, resilientCodes]);

  const crisisSafeFlights = useMemo(() => {
    return processedFlights.filter(f => resilientCodes.includes(f.airlineCode));
  }, [processedFlights, resilientCodes]);

  const sortedFlights = useMemo(() => {
    const base = activeTab === "crisis" ? crisisSafeFlights : processedFlights;
    const list = [...base];
    if (activeTab === "cheapest") list.sort((a, b) => a.priceUsd - b.priceUsd);
    else if (activeTab === "fastest") list.sort((a, b) => getDurationMins(a) - getDurationMins(b));
    else list.sort((a, b) => (a.priceUsd + getDurationMins(a) * 0.5) - (b.priceUsd + getDurationMins(b) * 0.5));
    return list;
  }, [processedFlights, crisisSafeFlights, activeTab]);

  const hasConnectingFlights = flights.some(f => f.stops > 0);
  const isCriticalDestination = safetyData?.alert_level === "critical";

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
      {/* Skiplag warning modal */}
      {skiplagModalOpen && (
        <SkiplagWarningModal
          onAccept={handleAcceptSkiplags}
          onCancel={() => setSkiplagModalOpen(false)}
        />
      )}

      {/* DEBUG BANNER — temporary */}
      {debugInfo && (
        <div className="mx-4 mt-2 mb-1 rounded-xl px-3 py-2 text-xs font-mono border border-border bg-card">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Data source:</span>
            <span className={debugInfo.source === "LIVE" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {debugInfo.source}
            </span>
            <span className="text-muted-foreground">|</span>
            <span>Offers received: <strong className="text-foreground">{debugInfo.offersReceived}</strong></span>
            <span className="text-muted-foreground">|</span>
            <span>Last search: {debugInfo.origin} → {debugInfo.destination}</span>
          </div>
        </div>
      )}


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
          {sortedFlights.length} flights found · {findDestByIata(originIata)?.city || originIata} → {destination.city}{destination.country ? `, ${destination.country}` : ""}{formattedDate ? ` · ${formattedDate}` : ""}
          <span className="text-xs ml-2" style={{ color: "#22C55E" }}>● Live</span>
        </p>
      </div>

      {/* Safety banner */}
      {safetyData && <LiveSafetyBanner safety={safetyData} city={destination.city} />}

      {/* Weather widget */}
      {safetyData?.weather && <WeatherWidget weather={safetyData.weather} city={destination.city} />}

      {/* Skiplag toggle + sort pills */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex gap-2">
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
        {hasConnectingFlights && (
          <button
            onClick={handleToggleSkiplags}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
              showSkiplags
                ? "border-amber-500/40 text-amber-400"
                : "border-border text-muted-foreground"
            )}
            style={showSkiplags ? { backgroundColor: "rgba(251, 191, 36, 0.1)" } : {}}
          >
            <Zap size={12} />
            Hidden-city fares
            <div className={cn(
              "w-7 h-4 rounded-full relative transition-colors",
              showSkiplags ? "bg-amber-500" : "bg-muted"
            )}>
              <div className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                showSkiplags ? "translate-x-3.5" : "translate-x-0.5"
              )} />
            </div>
          </button>
        )}
      </div>

      {/* Crisis-Safe explanation card */}
      {activeTab === "crisis" && (
        <div className="mx-4 mb-4 rounded-2xl px-4 py-4 border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} style={{ color: "#C9A84C" }} />
            <h3 className="text-sm font-bold text-foreground">Why crisis-safe routing?</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When situations escalate, Western carriers often suspend service first. Regional flag carriers like El Al, Turkish Airlines, and Emirates typically maintain flights longer — giving you the best chance of actually reaching your destination.
          </p>
        </div>
      )}

      <div className="px-4">
        {activeTab === "crisis" && sortedFlights.length === 0 && resilientLoaded ? (
          <div className="rounded-2xl px-5 py-5 border border-border bg-card text-center">
            <Shield size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground mb-2">No direct resilient carrier flights found for this route.</p>
            <p className="text-xs text-muted-foreground mb-4">Consider a split-ticket route:</p>
            <p className="text-xs text-muted-foreground mb-3">{originIata} → Hub → {destination?.iata}</p>
            <div className="text-left space-y-1.5 mb-5">
              <p className="text-xs text-muted-foreground font-medium">Common safe hubs for this region:</p>
              <p className="text-xs text-muted-foreground">• Athens (ATH) — 4h from TLV on El Al</p>
              <p className="text-xs text-muted-foreground">• Larnaca (LCA) — 1h from TLV on Arkia</p>
              <p className="text-xs text-muted-foreground">• Dubai (DXB) — 4h from TLV on flydubai</p>
            </div>
            <button
              className="rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
              onClick={() => toast.info("Split-ticket search coming soon!")}
            >
              Search split-ticket routes
            </button>
          </div>
        ) : (
          sortedFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              onSelect={() => handleSelectFlight(flight)}
              onWatch={() => setWatchFlight(flight)}
              isCritical={isCriticalDestination}
              isCrisisTab={activeTab === "crisis"}
              skiplagProtection={flight.isSkiplag ? (skiplagProtections[flight.airlineCode] || null) : undefined}
              userCards={userCards}
            />
          ))
        )}
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
