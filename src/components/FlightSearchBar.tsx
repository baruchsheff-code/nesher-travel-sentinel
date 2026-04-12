import { useState, useRef, useEffect, useCallback } from "react";
import { Bird, ArrowRightLeft, CalendarDays, Users, ChevronDown, ChevronUp, Minus, Plus, Search } from "lucide-react";
import { searchDestinations, type Destination } from "@/lib/destinations";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay, startOfDay, isAfter, getDay } from "date-fns";
import { cn } from "@/lib/utils";

type TripType = "one-way" | "round-trip" | "multi-city";
type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSearchParams {
  tripType: TripType;
  origin: Destination | null;
  destination: Destination | null;
  departDate: Date | null;
  returnDate: Date | null;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
  directOnly: boolean;
  maxPrice: number;
}

interface Props {
  onSearch: (params: FlightSearchParams) => void;
  initialParams?: Partial<FlightSearchParams>;
  compact?: boolean;
}

// Airport autocomplete dropdown
const AirportInput = ({ label, value, onChange, placeholder }: {
  label: string;
  value: Destination | null;
  onChange: (d: Destination) => void;
  placeholder: string;
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Destination[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    setOpen(true);
    setResults(searchDestinations(v));
  };

  const select = (d: Destination) => {
    onChange(d);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">{label}</label>
      <div
        className="input-gold-focus flex items-center gap-2 bg-input border border-border rounded-2xl px-3 cursor-text hover:border-primary/40 transition-all duration-150"
        style={{ height: 56 }}
        onClick={() => { if (!open) setOpen(true); }}
      >
        <Search size={14} className="text-muted-foreground shrink-0" />
        {value && !query ? (
          <button onClick={() => { setQuery(""); onChange(null as any); }} className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{value.flag} {value.city}</span>
            <span className="text-xs text-muted-foreground">{value.iata}</span>
          </button>
        ) : (
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => { if (query) setOpen(true); }}
            placeholder={value ? `${value.flag} ${value.city} (${value.iata})` : placeholder}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none min-w-0"
          />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-xl z-[60] max-h-60 overflow-y-auto">
          {results.map((d) => (
            <button
              key={d.iata}
              onClick={() => select(d)}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <span className="text-lg">{d.flag}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{d.city}</p>
                <p className="text-xs text-muted-foreground truncate">{d.airport} · {d.iata}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Inline calendar
const InlineCalendar = ({ selectedStart, selectedEnd, onSelect, isRange }: {
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelect: (d: Date) => void;
  isRange: boolean;
}) => {
  const [baseMonth, setBaseMonth] = useState(startOfMonth(new Date()));
  const today = startOfDay(new Date());

  const renderMonth = (monthStart: Date) => {
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = getDay(monthStart);

    return (
      <div className="flex-1 min-w-[220px]">
        <p className="text-sm font-semibold text-foreground text-center mb-2">{format(monthStart, "MMMM yyyy")}</p>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="text-[10px] text-muted-foreground py-1">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {days.map(day => {
            const past = isBefore(day, today);
            const isStart = selectedStart && isSameDay(day, selectedStart);
            const isEnd = selectedEnd && isSameDay(day, selectedEnd);
            const inRange = isRange && selectedStart && selectedEnd && isAfter(day, selectedStart) && isBefore(day, selectedEnd);

            return (
              <button
                key={day.toISOString()}
                disabled={past}
                onClick={() => !past && onSelect(day)}
                className={cn(
                  "text-xs py-1.5 rounded-lg transition-colors",
                  past && "text-muted-foreground/30 cursor-not-allowed",
                  !past && !isStart && !isEnd && !inRange && "text-foreground hover:bg-primary/10",
                  (isStart || isEnd) && "bg-primary text-primary-foreground font-bold",
                  inRange && "bg-primary/15 text-primary"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setBaseMonth(addMonths(baseMonth, -1))} className="text-muted-foreground hover:text-foreground p-1">←</button>
        <button onClick={() => setBaseMonth(addMonths(baseMonth, 1))} className="text-muted-foreground hover:text-foreground p-1">→</button>
      </div>
      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        {renderMonth(baseMonth)}
        <div className="hidden sm:block">{renderMonth(addMonths(baseMonth, 1))}</div>
      </div>
    </div>
  );
};

// Counter component
const Counter = ({ label, sub, value, onChange, min = 0, max = 9 }: {
  label: string; sub: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
    <div className="flex items-center gap-3">
      <button disabled={value <= min} onClick={() => onChange(value - 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted/50 text-foreground"><Minus size={14} /></button>
      <span className="text-sm font-semibold w-4 text-center text-foreground">{value}</span>
      <button disabled={value >= max} onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted/50 text-foreground"><Plus size={14} /></button>
    </div>
  </div>
);

const cabinLabels: Record<CabinClass, string> = {
  economy: "Economy",
  premium_economy: "Premium Eco",
  business: "Business",
  first: "First",
};

export default function FlightSearchBar({ onSearch, initialParams, compact }: Props) {
  const [tripType, setTripType] = useState<TripType>(initialParams?.tripType || "round-trip");
  const [origin, setOrigin] = useState<Destination | null>(initialParams?.origin || null);
  const [destination, setDestination] = useState<Destination | null>(initialParams?.destination || null);
  const [departDate, setDepartDate] = useState<Date | null>(initialParams?.departDate || null);
  const [returnDate, setReturnDate] = useState<Date | null>(initialParams?.returnDate || null);
  const [adults, setAdults] = useState(initialParams?.adults || 1);
  const [children, setChildren] = useState(initialParams?.children || 0);
  const [infants, setInfants] = useState(initialParams?.infants || 0);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialParams?.cabinClass || "economy");
  const [directOnly, setDirectOnly] = useState(initialParams?.directOnly || false);
  const [maxPrice, setMaxPrice] = useState(initialParams?.maxPrice || 5000);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarFor, setCalendarFor] = useState<"depart" | "return">("depart");
  const [showTravelers, setShowTravelers] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const calRef = useRef<HTMLDivElement>(null);
  const travRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
      if (travRef.current && !travRef.current.contains(e.target as Node)) setShowTravelers(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const swap = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  const handleDateSelect = (d: Date) => {
    if (tripType === "round-trip") {
      if (calendarFor === "depart") {
        setDepartDate(d);
        if (returnDate && isBefore(returnDate, d)) setReturnDate(null);
        setCalendarFor("return");
      } else {
        if (departDate && isBefore(d, departDate)) {
          setDepartDate(d);
        } else {
          setReturnDate(d);
          setShowCalendar(false);
        }
      }
    } else {
      setDepartDate(d);
      setShowCalendar(false);
    }
  };

  const totalTravelers = adults + children + infants;

  const handleSearch = () => {
    if (!origin || !destination || !departDate) return;
    onSearch({
      tripType, origin, destination, departDate, returnDate,
      adults, children, infants, cabinClass, directOnly, maxPrice
    });
  };

  const tripTypes: { key: TripType; label: string }[] = [
    { key: "one-way", label: "One Way" },
    { key: "round-trip", label: "Round Trip" },
    { key: "multi-city", label: "Multi-City" },
  ];

  return (
    <div className={cn("w-full max-w-3xl mx-auto", compact && "max-w-4xl")}>
      {/* Row 1: Trip type pills */}
      <div className="flex gap-2 mb-4">
        {tripTypes.map(t => (
          <button
            key={t.key}
            onClick={() => { setTripType(t.key); if (t.key === "one-way") setReturnDate(null); }}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200",
              tripType === t.key
                ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Row 2: Origin / Destination */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-3">
        <AirportInput label="From" value={origin} onChange={setOrigin} placeholder="City or airport" />
        <button onClick={swap} className="swap-btn self-center shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-all duration-200 bg-card text-muted-foreground hover:text-primary">
          <ArrowRightLeft size={16} />
        </button>
        <AirportInput label="To" value={destination} onChange={setDestination} placeholder="City or airport" />
      </div>

      {/* Row 2b: Date + Travelers */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        {/* Depart */}
        <div ref={calRef} className="relative flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Depart</label>
          <button
            onClick={() => { setCalendarFor("depart"); setShowCalendar(!showCalendar); }}
            className="input-gold-focus w-full flex items-center gap-2 bg-input border border-border rounded-2xl px-3 text-left hover:border-primary/40 transition-all duration-150"
            style={{ height: 56 }}
          >
            <CalendarDays size={14} className="text-muted-foreground" />
            <span className={cn("text-sm", departDate ? "text-foreground font-medium" : "text-muted-foreground")}>
              {departDate ? format(departDate, "MMM d, yyyy") : "Select date"}
            </span>
          </button>
          {showCalendar && (
            <div className="absolute bottom-full left-0 mb-1 z-[60]">
              <InlineCalendar
                selectedStart={departDate}
                selectedEnd={tripType === "round-trip" ? returnDate : null}
                onSelect={handleDateSelect}
                isRange={tripType === "round-trip"}
              />
            </div>
          )}
        </div>

        {/* Return */}
        <div className="relative flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Return</label>
          <button
            disabled={tripType === "one-way"}
            onClick={() => { setCalendarFor("return"); setShowCalendar(!showCalendar); }}
            className={cn(
              "input-gold-focus w-full flex items-center gap-2 border rounded-2xl px-3 text-left transition-all duration-150",
              tripType === "one-way"
                ? "bg-muted/30 border-border/50 cursor-not-allowed"
                : "bg-input border-border hover:border-primary/40"
            )}
            style={{ height: 56 }}
          >
            <CalendarDays size={14} className="text-muted-foreground" />
            <span className={cn("text-sm", tripType === "one-way" ? "text-muted-foreground/50" : returnDate ? "text-foreground font-medium" : "text-muted-foreground")}>
              {tripType === "one-way" ? "Add return" : returnDate ? format(returnDate, "MMM d, yyyy") : "Select date"}
            </span>
          </button>
        </div>

        {/* Travelers */}
        <div ref={travRef} className="relative flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Travelers</label>
          <button
            onClick={() => setShowTravelers(!showTravelers)}
            className="input-gold-focus w-full flex items-center gap-2 bg-input border border-border rounded-2xl px-3 text-left hover:border-primary/40 transition-all duration-150"
            style={{ height: 56 }}
          >
            <Users size={14} className="text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">
              {totalTravelers} {totalTravelers === 1 ? "Traveler" : "Travelers"}, {cabinLabels[cabinClass]}
            </span>
          </button>
          {showTravelers && (
            <div className="absolute bottom-full left-0 right-0 sm:right-auto sm:min-w-[280px] mb-1 bg-card border border-border rounded-2xl shadow-xl z-[60] p-4">
              <Counter label="Adults" sub="18+" value={adults} onChange={setAdults} min={1} />
              <Counter label="Children" sub="2–17" value={children} onChange={setChildren} />
              <Counter label="Infants" sub="Under 2" value={infants} onChange={setInfants} />
              <div className="border-t border-border mt-3 pt-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Cabin class</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(cabinLabels) as [CabinClass, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setCabinClass(k)}
                      className={cn(
                        "text-xs py-1.5 rounded-lg font-medium transition-colors",
                        cabinClass === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowTravelers(false)} className="w-full mt-3 text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground">Done</button>
            </div>
          )}
        </div>
      </div>

      {/* More options */}
      <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-3 transition-colors">
        More options {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showMore && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Direct flights only</span>
            <button
              onClick={() => setDirectOnly(!directOnly)}
              className={cn("w-10 h-5 rounded-full transition-colors relative", directOnly ? "bg-primary" : "bg-muted")}
            >
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", directOnly ? "left-5" : "left-0.5")} />
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-foreground">Max price</span>
              <span className="text-sm font-semibold text-primary">${maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={!origin || !destination || !departDate}
        className={cn(
          "w-full sm:w-auto sm:ml-auto sm:flex flex items-center justify-center gap-2 px-8 rounded-full font-bold text-base transition-all duration-150",
          origin && destination && departDate
            ? "hover:brightness-110 hover:scale-[1.02] shadow-lg"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
        style={
          origin && destination && departDate
            ? { height: 56, backgroundColor: "#C9A84C", color: "#0A0F1E" }
            : { height: 56 }
        }
      >
        <Search size={18} strokeWidth={2.5} />
        Search flights
      </button>
    </div>
  );
}
