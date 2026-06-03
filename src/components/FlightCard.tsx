import { Plane } from "lucide-react";
import { type DuffelOffer } from "@/contexts/FlightSearchContext";
import { useState, useEffect } from "react";

const formatTime = (isoString: string) => {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const getDayDiff = (dep: string, arr: string) => {
  if (!dep || !arr) return 0;
  const d = new Date(dep);
  const a = new Date(arr);
  const depDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const arrDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round((arrDay.getTime() - depDay.getTime()) / 86400000);
};

const currencySymbols: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", ILS: "₪", CAD: "CA$",
};

const airlineColors: Record<string, string> = {
  AA: "#0078D2", DL: "#003366", UA: "#002244", BA: "#2E5090",
  LH: "#05164D", AF: "#002157", TK: "#E31837", LY: "#003DA5",
  EK: "#D71920", QR: "#5C0632", SQ: "#F5A623", JL: "#E60012",
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
    <span className={`text-[10px] font-medium ${isUrgent ? "text-amber-500" : "text-muted-foreground"}`}>
      Fare expires in {remaining}
    </span>
  );
};

interface FlightCardProps {
  offer: DuffelOffer;
  onSelect: () => void;
  pointsInfo?: {
    best: { card_name: string; points: number; value: number };
    all: { card_name: string; points: number; value: number }[];
  } | null;
  skiplagBadge?: boolean;
}

export default function FlightCard({ offer, onSelect, pointsInfo, skiplagBadge }: FlightCardProps) {
  console.log('Card rendering offer:', offer);
  const [pointsExpanded, setPointsExpanded] = useState(false);
  const symbol = currencySymbols[offer.total_currency] || "$";
  const price = parseFloat(offer.total_amount);
  const bgColor = airlineColors[offer.airline_code] || "#4A5568";
  const dayDiff = getDayDiff(offer.departure_time, offer.arrival_time);

  return (
    <div
      onClick={onSelect}
      className="rounded-2xl p-4 mb-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all duration-200 bg-card border border-border"
    >
      {skiplagBadge && (
        <div className="mb-2 -mt-1">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.18)", color: "#F59E0B" }}
            >
              Hidden City ⚡
            </span>
            <span
              className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-border text-muted-foreground"
            >
              DEMO
            </span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "#F59E0B" }}>
            Carry-on only · airline may penalize repeat use
          </p>
        </div>
      )}
      {/* Row 1: Airline info */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="rounded-full flex items-center justify-center text-[11px] font-bold w-9 h-9 text-white"
          style={{ backgroundColor: bgColor }}
        >
          {offer.airline_code}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{offer.airline_name}</p>
          <p className="text-xs text-muted-foreground">
            {offer.airline_code}{offer.flight_number} · {offer.cabin_class}
          </p>
        </div>
      </div>

      {/* Row 2: Times + duration */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{formatTime(offer.departure_time)}</p>
          <p className="text-xs font-medium text-muted-foreground">{offer.origin_iata}</p>
        </div>
        <div className="flex-1 flex flex-col items-center px-3">
          <p className="text-[11px] text-muted-foreground">{offer.duration}</p>
          <div className="flex items-center gap-1 w-full my-1">
            <div className="flex-1 h-px bg-border" />
            <Plane size={14} className="text-muted-foreground" />
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-[11px]">
            {offer.stops === 0 ? (
              <span style={{ color: "#22C55E" }}>Nonstop</span>
            ) : offer.stops === 1 ? (
              <span className="text-muted-foreground">
                {offer.stop_airports?.[0] || ""} · 1 stop
              </span>
            ) : (
              <span className="text-muted-foreground">
                {offer.stop_airports?.join(" · ")} · {offer.stops} stops
              </span>
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">
            {formatTime(offer.arrival_time)}
            {dayDiff > 0 && (
              <sup className="text-[10px] ml-0.5 text-amber-500 font-semibold">+{dayDiff}</sup>
            )}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{offer.destination_iata}</p>
        </div>
      </div>

      {/* Row 3: Price + expiry */}
      <div className="flex items-center justify-between mb-2">
        <div className="group relative">
          <span className="text-2xl font-bold" style={{ color: "#C9A84C" }}>
            {symbol}{price.toFixed(0)}
          </span>
          {/* Hover tooltip for price breakdown */}
          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-popover border border-border text-popover-foreground text-xs rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap z-50">
            Base: {symbol}{parseFloat(offer.base_amount).toFixed(0)} · Tax: {symbol}{parseFloat(offer.tax_amount).toFixed(0)}
          </div>
        </div>
        {offer.expires_at && <FareExpiry expiresAt={offer.expires_at} />}
      </div>

      {/* Row 4: Emissions */}
      {offer.emissions_kg != null && (
        <p className="text-[11px] text-muted-foreground">
          🌱 {offer.emissions_kg} kg CO₂
        </p>
      )}

      {pointsInfo && (
        <div
          className="mt-2"
          onClick={(e) => { e.stopPropagation(); setPointsExpanded((v) => !v); }}
        >
          <p className="text-[12px] font-semibold cursor-pointer" style={{ color: "#C9A84C" }}>
            💳 Best: {pointsInfo.best.card_name} — earn {pointsInfo.best.points.toLocaleString()} pts (~${pointsInfo.best.value})
          </p>
          {pointsExpanded && pointsInfo.all.length > 1 && (
            <div className="mt-1.5 space-y-0.5">
              {pointsInfo.all.map((c) => (
                <p key={c.card_name} className="text-[11px] text-muted-foreground">
                  {c.card_name}: {c.points.toLocaleString()} pts (~${c.value})
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
