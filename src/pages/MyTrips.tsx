import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane, Clock, CheckCircle2, AlertTriangle, MapPin, Calendar,
  Loader2, RefreshCw, X, QrCode, Headphones, MessageCircle, Shield, ChevronRight,
  Copy, Check, CloudSun, Thermometer, ArrowRight, Hand, Download, WifiOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOffline } from "@/contexts/OfflineContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import OfflineQRCode from "@/components/OfflineQRCode";
import { saveTripOffline, getTripOffline, buildOfflineTripData, type OfflineTripData } from "@/lib/offlineStore";

interface BookingLeg {
  id: string;
  airline_name: string | null;
  airline_code: string | null;
  flight_number: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_status: string | null;
  gate: string | null;
  terminal: string | null;
  seat_number: string | null;
  pnr: string | null;
  leg_number: number | null;
}

interface Booking {
  id: string;
  booking_status: string | null;
  booking_type: string | null;
  total_price_usd: number | null;
  created_at: string | null;
  is_self_transfer: boolean | null;
  ticket_count: number | null;
  booking_legs: BookingLeg[];
}

// Country flag + name mapping
const DEST_INFO: Record<string, { flag: string; name: string; weather: string; temp: number; safety: number }> = {
  TLV: { flag: "🇮🇱", name: "Tel Aviv", weather: "☀️", temp: 28, safety: 72 },
  IST: { flag: "🇹🇷", name: "Istanbul", weather: "⛅", temp: 22, safety: 78 },
  CDG: { flag: "🇫🇷", name: "Paris", weather: "🌤️", temp: 18, safety: 85 },
  LHR: { flag: "🇬🇧", name: "London", weather: "🌧️", temp: 14, safety: 88 },
  NRT: { flag: "🇯🇵", name: "Tokyo", weather: "☀️", temp: 24, safety: 92 },
  FCO: { flag: "🇮🇹", name: "Rome", weather: "☀️", temp: 26, safety: 82 },
  FRA: { flag: "🇩🇪", name: "Frankfurt", weather: "⛅", temp: 16, safety: 90 },
  BCN: { flag: "🇪🇸", name: "Barcelona", weather: "☀️", temp: 25, safety: 80 },
  JFK: { flag: "🇺🇸", name: "New York", weather: "🌤️", temp: 20, safety: 75 },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  scheduled: { color: "hsl(var(--primary))", label: "On Time", bg: "hsl(var(--primary) / 0.1)" },
  on_time: { color: "#34a853", label: "On Time", bg: "rgba(52, 168, 83, 0.1)" },
  delayed: { color: "#fbbc04", label: "Delayed", bg: "rgba(251, 188, 4, 0.1)" },
  cancelled: { color: "hsl(var(--destructive))", label: "Cancelled", bg: "hsl(var(--destructive) / 0.1)" },
  landed: { color: "#34a853", label: "Landed", bg: "rgba(52, 168, 83, 0.1)" },
  boarding: { color: "hsl(var(--primary))", label: "Boarding", bg: "hsl(var(--primary) / 0.1)" },
  departed: { color: "#34a853", label: "Departed", bg: "rgba(52, 168, 83, 0.1)" },
  in_air: { color: "hsl(var(--primary))", label: "In Air", bg: "hsl(var(--primary) / 0.1)" },
};

const MOCK_ALTERNATIVES = [
  { airline: "United", flight: "UA456", departs: "14:30", price: 0 },
  { airline: "Delta", flight: "DL789", departs: "16:15", price: 45 },
  { airline: "American", flight: "AA321", departs: "18:00", price: 0 },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "demo-1",
    booking_status: "confirmed",
    booking_type: "round_trip",
    total_price_usd: 969,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_self_transfer: false,
    ticket_count: 1,
    booking_legs: [{
      id: "leg-1", airline_name: "El Al", airline_code: "LY", flight_number: "LY008",
      origin_iata: "JFK", destination_iata: "TLV",
      departure_time: new Date(Date.now() + 2 * 86400000 + 14 * 3600000).toISOString(),
      arrival_time: new Date(Date.now() + 3 * 86400000 + 1 * 3600000).toISOString(),
      flight_status: "scheduled", gate: "B22", terminal: "1", seat_number: "14A",
      pnr: "NSHRDEMO42", leg_number: 1,
    }],
  },
  {
    id: "demo-delayed",
    booking_status: "confirmed",
    booking_type: "one_way",
    total_price_usd: 620,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    is_self_transfer: false,
    ticket_count: 1,
    booking_legs: [{
      id: "leg-d", airline_name: "Turkish Airlines", airline_code: "TK", flight_number: "TK012",
      origin_iata: "JFK", destination_iata: "IST",
      departure_time: new Date(Date.now() + 1 * 86400000 + 8 * 3600000).toISOString(),
      arrival_time: new Date(Date.now() + 1 * 86400000 + 18 * 3600000).toISOString(),
      flight_status: "delayed", gate: "C11", terminal: "4", seat_number: "22F",
      pnr: "TKDLY0099", leg_number: 1,
    }],
  },
  {
    id: "demo-past",
    booking_status: "completed",
    booking_type: "one_way",
    total_price_usd: 420,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    is_self_transfer: false,
    ticket_count: 1,
    booking_legs: [{
      id: "leg-2", airline_name: "Air France", airline_code: "AF", flight_number: "AF007",
      origin_iata: "JFK", destination_iata: "CDG",
      departure_time: new Date(Date.now() - 25 * 86400000).toISOString(),
      arrival_time: new Date(Date.now() - 25 * 86400000 + 7 * 3600000).toISOString(),
      flight_status: "landed", gate: null, terminal: null, seat_number: "8C",
      pnr: "AFPST2024", leg_number: 1,
    }],
  },
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getCountdown(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `Departs in ${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `Departs in ${hours}h ${mins}m`;
}

function isUpcoming(booking: Booking) {
  const lastLeg = booking.booking_legs[booking.booking_legs.length - 1];
  if (!lastLeg?.departure_time) return false;
  return new Date(lastLeg.departure_time) > new Date();
}

function isDisrupted(status: string | null) {
  return status === "delayed" || status === "cancelled";
}

// ─── Trip Card ───
const TripCard = ({ booking, onDetail }: { booking: Booking; onDetail: () => void }) => {
  const firstLeg = booking.booking_legs[0];
  const destIata = firstLeg?.destination_iata || "JFK";
  const destInfo = DEST_INFO[destIata] || { flag: "🌍", name: destIata, weather: "☀️", temp: 20, safety: 75 };
  const status = firstLeg?.flight_status || "scheduled";
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  const countdown = getCountdown(firstLeg?.departure_time);
  const disrupted = isDisrupted(status);
  const upcoming = isUpcoming(booking);

  const [showChangeGate, setShowChangeGate] = useState(false);
  const [findingAlts, setFindingAlts] = useState(false);
  const [showAlts, setShowAlts] = useState(false);

  // Auto-expand disrupted cards
  useEffect(() => {
    if (disrupted && upcoming) {
      setFindingAlts(true);
      const t = setTimeout(() => {
        setFindingAlts(false);
        setShowAlts(true);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [disrupted, upcoming]);

  const handleChangeFlight = () => {
    if (disrupted) {
      toast.info("Finding alternatives...");
    } else {
      setShowChangeGate(true);
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-3 animate-fade-in" style={{ backgroundColor: "hsl(var(--card))", border: `1px solid ${disrupted ? statusCfg.color : "hsl(var(--border))"}` }}>
      {/* Header: destination + status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{destInfo.flag}</span>
            <h3 className="text-lg font-bold text-foreground">{destInfo.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {firstLeg?.origin_iata} → {destIata} · {firstLeg?.airline_name} {firstLeg?.flight_number}
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
          {statusCfg.label}
        </div>
      </div>

      {/* Date, time, countdown */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{formatDate(firstLeg?.departure_time)}</p>
          <p className="text-xs text-muted-foreground">{formatTime(firstLeg?.departure_time)}</p>
        </div>
        {upcoming && countdown && (
          <p className="text-xs font-medium text-primary">{countdown}</p>
        )}
      </div>

      {/* Weather + Safety row */}
      {upcoming && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {destInfo.weather} {destInfo.temp}°C
          </span>
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-primary" />
            Safety: {destInfo.safety}/100
          </span>
          {firstLeg?.gate && <span>Gate {firstLeg.gate}</span>}
          {firstLeg?.seat_number && <span>Seat {firstLeg.seat_number}</span>}
        </div>
      )}

      {/* Quick action row */}
      {upcoming && (
        <div className="flex gap-2">
          <QuickAction label="Boarding Pass" icon={<QrCode size={14} />} onClick={() => toast.info("Boarding pass — coming soon")} />
          <QuickAction label="Check In" icon={<CheckCircle2 size={14} />} onClick={() => toast.info("Check-in — coming soon")} />
          <QuickAction label="Get Help" icon={<Headphones size={14} />} onClick={() => toast.info("Support — coming soon")} />
        </div>
      )}

      {/* Disruption auto-expand */}
      {disrupted && upcoming && (
        <div className="rounded-xl p-3 space-y-3" style={{ backgroundColor: statusCfg.bg, border: `1px solid ${statusCfg.color}30` }}>
          {findingAlts ? (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: statusCfg.color }} />
              <p className="text-xs font-medium" style={{ color: statusCfg.color }}>
                Your flight is {status}. We're finding alternatives now...
              </p>
            </div>
          ) : showAlts ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: statusCfg.color }}>
                {status === "cancelled" ? "Your flight was cancelled." : "Your flight is delayed."} Here are alternatives:
              </p>
              {MOCK_ALTERNATIVES.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => toast.success(`Switching to ${alt.flight}...`)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:opacity-80"
                  style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{alt.airline} {alt.flight}</p>
                    <p className="text-xs text-muted-foreground">Departs {alt.departs}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {alt.price === 0 ? "Free" : `+$${alt.price}`}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Change Flight + View Details */}
      {upcoming && (
        <div className="flex gap-2">
          <button
            onClick={handleChangeFlight}
            className="flex-1 py-2 rounded-xl text-xs font-medium border border-border text-foreground hover:border-primary/40 transition-colors"
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            Change Flight
          </button>
          <button
            onClick={onDetail}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-primary-foreground"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          >
            View Details
          </button>
        </div>
      )}

      {!upcoming && (
        <button
          onClick={onDetail}
          className="w-full py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:border-primary/40 transition-colors"
        >
          View Details
        </button>
      )}

      {/* Anti-exploitation gate modal */}
      {showChangeGate && (
        <div className="rounded-xl p-4 space-y-2 animate-fade-in" style={{ backgroundColor: "rgba(251, 188, 4, 0.06)", border: "1px solid rgba(251, 188, 4, 0.2)" }}>
          <div className="flex items-center gap-2">
            <Hand size={18} style={{ color: "#fbbc04" }} />
            <p className="text-sm font-bold text-foreground">Flight changes are locked.</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your flight is currently on time. Automated changes are only available during genuine disruptions to prevent misuse.
          </p>
          <p className="text-xs text-muted-foreground">
            If you have an emergency, contact our support team.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowChangeGate(false)}
              className="flex-1 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground"
            >
              Got it
            </button>
            <button
              onClick={() => { setShowChangeGate(false); toast.info("Support — coming soon"); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Contact Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickAction = ({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background transition-colors border border-border"
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// ─── Trip Detail Panel (kept from original) ───
function getDuration(dep: string | null, arr: string | null) {
  if (!dep || !arr) return "—";
  const ms = new Date(arr).getTime() - new Date(dep).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const TripDetail = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
  const firstLeg = booking.booking_legs[0];
  const lastLeg = booking.booking_legs[booking.booking_legs.length - 1];
  const upcoming = isUpcoming(booking);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background h-full overflow-y-auto animate-fade-in" style={{ animationDuration: "0.25s" }}>
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-5 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{firstLeg?.origin_iata} → {lastLeg?.destination_iata}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{firstLeg?.airline_name} · {formatDate(firstLeg?.departure_time)}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-card transition-colors"><X size={20} className="text-foreground" /></button>
          </div>
        </div>
        <div className="px-5 py-6 space-y-6">
          {/* Itinerary legs */}
          {booking.booking_legs.map((leg) => {
            const st = STATUS_CONFIG[leg.flight_status || "scheduled"] || STATUS_CONFIG.scheduled;
            return (
              <div key={leg.id} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane size={14} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">{leg.flight_number}</span>
                    <span className="text-xs text-muted-foreground">{leg.airline_name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-xl font-bold text-foreground">{formatTime(leg.departure_time)}</p><p className="text-xs text-muted-foreground">{leg.origin_iata}</p></div>
                  <div className="text-center"><p className="text-xs text-muted-foreground">{getDuration(leg.departure_time, leg.arrival_time)}</p></div>
                  <div className="text-right"><p className="text-xl font-bold text-foreground">{formatTime(leg.arrival_time)}</p><p className="text-xs text-muted-foreground">{leg.destination_iata}</p></div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {leg.terminal && <span>Terminal {leg.terminal}</span>}
                  {leg.gate && <span>Gate {leg.gate}</span>}
                  {leg.seat_number && <span>Seat {leg.seat_number}</span>}
                </div>
                {leg.pnr && (
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-xs text-muted-foreground">PNR</span>
                    <button onClick={() => handleCopy(leg.pnr!)} className="flex items-center gap-1 text-xs font-mono font-bold text-foreground">
                      {leg.pnr}
                      {copied === leg.pnr ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Booking summary */}
          <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Paid</span><span className="font-bold text-foreground">${booking.total_price_usd}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Booked</span><span className="text-foreground">{formatDate(booking.created_at)}</span></div>
          </div>

          {/* Support */}
          <div className="space-y-2">
            {[
              { icon: MessageCircle, label: "Chat with Agent" },
              { icon: Headphones, label: "Call Support" },
              { icon: Shield, label: "File Insurance Claim" },
            ].map((action) => (
              <button key={action.label} onClick={() => toast.info(`${action.label} — coming soon`)} className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/40 transition-colors text-left" style={{ backgroundColor: "hsl(var(--card))" }}>
                <action.icon size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
                <ChevronRight size={14} className="text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main MyTrips ───
const MyTrips = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(30);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);

    if (!user) {
      setBookings(MOCK_BOOKINGS);
      setIsRefreshing(false);
      setLoading(false);
      setSecondsUntilRefresh(30);
      return;
    }

    const { data: bookingsData, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !bookingsData?.length) {
      setBookings(MOCK_BOOKINGS);
      setIsRefreshing(false);
      setLoading(false);
      setSecondsUntilRefresh(30);
      return;
    }

    const bookingIds = bookingsData.map((b) => b.id);
    const { data: legsData } = await supabase
      .from("booking_legs")
      .select("*")
      .in("booking_id", bookingIds)
      .order("leg_number", { ascending: true });

    const merged: Booking[] = bookingsData.map((b) => ({
      ...b,
      booking_legs: (legsData || []).filter((l) => l.booking_id === b.id),
    }));

    setBookings(merged.length ? merged : MOCK_BOOKINGS);
    setIsRefreshing(false);
    setLoading(false);
    setSecondsUntilRefresh(30);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchBookings(false);
  }, [user, authLoading, fetchBookings]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => fetchBookings(true), 30000);
    return () => clearInterval(interval);
  }, [loading, fetchBookings]);

  useEffect(() => {
    if (loading) return;
    const tick = setInterval(() => setSecondsUntilRefresh((p) => (p <= 1 ? 30 : p - 1)), 1000);
    return () => clearInterval(tick);
  }, [loading]);

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">My Trips</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchBookings(true)} disabled={isRefreshing} className="p-2 rounded-full hover:bg-card transition-colors">
            <RefreshCw size={16} className={`text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
              <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: "#34a853" }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#34a853" }} />
            </div>
            <span className="text-xs text-muted-foreground">{secondsUntilRefresh}s</span>
          </div>
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center mt-24">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="mt-2">
            <TabsList className="w-full bg-card border border-border">
              <TabsTrigger value="upcoming" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Past ({past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4 space-y-4">
              {upcoming.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <MapPin size={40} className="text-muted-foreground mx-auto opacity-40" />
                  <p className="text-muted-foreground text-sm">No upcoming trips</p>
                  <button onClick={() => navigate("/")} className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    Search Flights
                  </button>
                </div>
              ) : (
                upcoming.map((b) => <TripCard key={b.id} booking={b} onDetail={() => setSelectedBooking(b)} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 space-y-4">
              {past.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Clock size={40} className="text-muted-foreground mx-auto opacity-40" />
                  <p className="text-muted-foreground text-sm">No past trips yet</p>
                </div>
              ) : (
                past.map((b) => <TripCard key={b.id} booking={b} onDetail={() => setSelectedBooking(b)} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {selectedBooking && <TripDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
      <BottomNav />
    </div>
  );
};

export default MyTrips;
