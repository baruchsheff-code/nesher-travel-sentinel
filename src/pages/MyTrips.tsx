import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bird, Plane, Clock, CheckCircle2, AlertTriangle, MapPin, Calendar,
  Loader2, RefreshCw, X, QrCode, Headphones, MessageCircle, Shield, ChevronRight,
  Luggage, CreditCard, Copy, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  scheduled: { icon: Clock, color: "hsl(var(--primary))", label: "Scheduled" },
  on_time: { icon: CheckCircle2, color: "#34a853", label: "On Time" },
  delayed: { icon: AlertTriangle, color: "#fbbc04", label: "Delayed" },
  cancelled: { icon: AlertTriangle, color: "hsl(var(--destructive))", label: "Cancelled" },
  landed: { icon: CheckCircle2, color: "#34a853", label: "Landed" },
  boarding: { icon: Plane, color: "hsl(var(--primary))", label: "Boarding" },
  departed: { icon: Plane, color: "#34a853", label: "Departed" },
  in_air: { icon: Plane, color: "hsl(var(--primary))", label: "In Air" },
};

const DEMO_STATUS_CYCLE = ["scheduled", "on_time", "boarding", "departed", "in_air", "landed"];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "demo-1",
    booking_status: "confirmed",
    booking_type: "round_trip",
    total_price_usd: 969,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_self_transfer: false,
    ticket_count: 1,
    booking_legs: [
      {
        id: "leg-1",
        airline_name: "El Al",
        airline_code: "LY",
        flight_number: "LY008",
        origin_iata: "JFK",
        destination_iata: "TLV",
        departure_time: new Date(Date.now() + 5 * 86400000).toISOString(),
        arrival_time: new Date(Date.now() + 5 * 86400000 + 11 * 3600000).toISOString(),
        flight_status: "scheduled",
        gate: "B22",
        terminal: "1",
        seat_number: "14A",
        pnr: "NSHRDEMO42",
        leg_number: 1,
      },
    ],
  },
  {
    id: "demo-2",
    booking_status: "completed",
    booking_type: "one_way",
    total_price_usd: 420,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    is_self_transfer: false,
    ticket_count: 1,
    booking_legs: [
      {
        id: "leg-2",
        airline_name: "Turkish Airlines",
        airline_code: "TK",
        flight_number: "TK012",
        origin_iata: "JFK",
        destination_iata: "IST",
        departure_time: new Date(Date.now() - 25 * 86400000).toISOString(),
        arrival_time: new Date(Date.now() - 25 * 86400000 + 10 * 3600000).toISOString(),
        flight_status: "landed",
        gate: null,
        terminal: null,
        seat_number: "22F",
        pnr: "TRKDMO18",
        leg_number: 1,
      },
    ],
  },
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function isUpcoming(booking: Booking) {
  const lastLeg = booking.booking_legs[booking.booking_legs.length - 1];
  if (!lastLeg?.departure_time) return false;
  return new Date(lastLeg.departure_time) > new Date();
}

const FlightStatusBadge = ({ status }: { status: string | null }) => {
  const config = STATUS_CONFIG[status || "scheduled"] || STATUS_CONFIG.scheduled;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} style={{ color: config.color }} />
      <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
    </div>
  );
};

const TripCard = ({ booking, onClick }: { booking: Booking; onClick: () => void }) => {
  const firstLeg = booking.booking_legs[0];
  const lastLeg = booking.booking_legs[booking.booking_legs.length - 1];
  const upcoming = isUpcoming(booking);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 animate-fade-in cursor-pointer hover:border-primary/40 transition-colors" onClick={onClick}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {firstLeg?.origin_iata} → {lastLeg?.destination_iata}
            </p>
            <p className="text-xs text-muted-foreground">{firstLeg?.airline_name} · {firstLeg?.flight_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={upcoming ? "default" : "secondary"} className="text-xs">
            {upcoming ? "Upcoming" : "Past"}
          </Badge>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>

      {/* Legs */}
      {booking.booking_legs.map((leg) => (
        <div key={leg.id} className="bg-background rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatTime(leg.departure_time)}</p>
              <p className="text-xs text-muted-foreground">{leg.origin_iata}</p>
            </div>
            <div className="flex-1 mx-4 flex items-center">
              <div className="h-px flex-1 bg-border" />
              <Plane size={14} className="text-muted-foreground mx-2" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatTime(leg.arrival_time)}</p>
              <p className="text-xs text-muted-foreground">{leg.destination_iata}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <FlightStatusBadge status={leg.flight_status} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {leg.gate && <span>Gate {leg.gate}</span>}
              {leg.seat_number && <span>Seat {leg.seat_number}</span>}
            </div>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>{formatDate(firstLeg?.departure_time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">PNR:</span>
          <span className="text-xs font-mono font-semibold text-foreground">{firstLeg?.pnr || "—"}</span>
        </div>
        <p className="text-sm font-bold text-foreground">${booking.total_price_usd}</p>
      </div>
    </div>
  );
};

/* ─── Helper ─── */
function getDuration(dep: string | null, arr: string | null) {
  if (!dep || !arr) return "—";
  const ms = new Date(arr).getTime() - new Date(dep).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

/* ─── Boarding Pass ─── */
const BoardingPass = ({ leg }: { leg: BookingLeg }) => {
  const [copied, setCopied] = useState(false);
  const handleCopyPnr = () => {
    if (leg.pnr) {
      navigator.clipboard.writeText(leg.pnr);
      setCopied(true);
      toast.success("PNR copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{leg.airline_name}</p>
          <p className="text-xs text-muted-foreground">{leg.flight_number}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{leg.origin_iata}</p>
            <p className="text-xs text-muted-foreground">{formatTime(leg.departure_time)}</p>
          </div>
          <div className="flex-1 mx-4 flex flex-col items-center gap-1">
            <p className="text-xs text-muted-foreground">{getDuration(leg.departure_time, leg.arrival_time)}</p>
            <div className="w-full flex items-center">
              <div className="h-px flex-1 bg-border" />
              <Plane size={14} className="text-primary mx-2" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <FlightStatusBadge status={leg.flight_status} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{leg.destination_iata}</p>
            <p className="text-xs text-muted-foreground">{formatTime(leg.arrival_time)}</p>
          </div>
        </div>
      </div>
      {/* Dashed divider */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-background" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-background" />
        <div className="border-t border-dashed border-border mx-6" />
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div><p className="text-xs text-muted-foreground">Terminal</p><p className="text-sm font-semibold text-foreground">{leg.terminal || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Gate</p><p className="text-sm font-semibold text-foreground">{leg.gate || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Seat</p><p className="text-sm font-semibold text-foreground">{leg.seat_number || "—"}</p></div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">PNR / Booking Ref</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-mono font-bold text-foreground tracking-wider">{leg.pnr || "—"}</p>
              {leg.pnr && (
                <button onClick={handleCopyPnr} className="p-1 rounded hover:bg-background transition-colors">
                  {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} className="text-muted-foreground" />}
                </button>
              )}
            </div>
          </div>
          <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center">
            <QrCode size={28} className="text-muted-foreground opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Trip Detail Panel ─── */
const TripDetail = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
  const firstLeg = booking.booking_legs[0];
  const lastLeg = booking.booking_legs[booking.booking_legs.length - 1];
  const upcoming = isUpcoming(booking);
  const supportActions = [
    { icon: MessageCircle, label: "Chat with Agent", desc: "Get help from our AI or human agents" },
    { icon: Headphones, label: "Call Support", desc: "24/7 priority phone line" },
    { icon: Shield, label: "File Insurance Claim", desc: "Submit a claim for disruptions" },
  ];
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
          {/* Status */}
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Booking Status</p><p className="text-sm font-semibold text-foreground capitalize mt-0.5">{booking.booking_status || "Confirmed"}</p></div>
            <Badge variant={upcoming ? "default" : "secondary"}>{upcoming ? "Upcoming" : "Completed"}</Badge>
          </div>
          {/* Itinerary */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Full Itinerary</h3>
            <div className="space-y-3">
              {booking.booking_legs.map((leg, idx) => (
                <div key={leg.id}>
                  {idx > 0 && (
                    <div className="flex items-center gap-2 py-2 px-4">
                      <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground bg-background px-2">{booking.is_self_transfer ? "Self-transfer" : "Connection"}</span><div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Plane size={14} className="text-primary" /><span className="text-sm font-semibold text-foreground">{leg.flight_number}</span><span className="text-xs text-muted-foreground">· {leg.airline_name}</span></div>
                      <FlightStatusBadge status={leg.flight_status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><p className="text-xl font-bold text-foreground">{formatTime(leg.departure_time)}</p><p className="text-xs text-muted-foreground">{leg.origin_iata}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">{getDuration(leg.departure_time, leg.arrival_time)}</p><div className="w-20 h-px bg-border mt-1" /></div>
                      <div className="text-right"><p className="text-xl font-bold text-foreground">{formatTime(leg.arrival_time)}</p><p className="text-xs text-muted-foreground">{leg.destination_iata}</p></div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {leg.terminal && <span>Terminal {leg.terminal}</span>}
                      {leg.gate && <span>Gate {leg.gate}</span>}
                      {leg.seat_number && <span>Seat {leg.seat_number}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Boarding Pass */}
          {upcoming && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Boarding Pass</h3>
              <div className="space-y-3">{booking.booking_legs.map((leg) => <BoardingPass key={leg.id} leg={leg} />)}</div>
            </div>
          )}
          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h3>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total Paid</span><span className="font-bold text-foreground">${booking.total_price_usd}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Booking Type</span><span className="text-foreground capitalize">{booking.booking_type?.replace("_", " ") || "One Way"}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Passengers</span><span className="text-foreground">{booking.ticket_count || 1}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Booked On</span><span className="text-foreground">{formatDate(booking.created_at)}</span></div>
            </div>
          </div>
          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Support</h3>
            <div className="space-y-2">
              {supportActions.map((action) => (
                <button key={action.label} onClick={() => toast.info(`${action.label} — coming soon`)} className="w-full flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/40 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><action.icon size={16} className="text-primary" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground">{action.label}</p><p className="text-xs text-muted-foreground">{action.desc}</p></div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyTrips = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(30);
  const refreshCycleRef = useRef(0);

  const simulateDemoStatusUpdate = useCallback((current: Booking[]): Booking[] => {
    return current.map((b) => ({
      ...b,
      booking_legs: b.booking_legs.map((leg) => {
        if (!isUpcoming({ ...b, booking_legs: [leg] })) return leg;
        const currentIdx = DEMO_STATUS_CYCLE.indexOf(leg.flight_status || "scheduled");
        // Randomly advance status sometimes for demo effect
        const shouldAdvance = Math.random() > 0.5 && currentIdx < DEMO_STATUS_CYCLE.length - 1;
        const newStatus = shouldAdvance ? DEMO_STATUS_CYCLE[currentIdx + 1] : leg.flight_status;
        // Simulate gate changes
        const gates = ["B22", "B24", "C11", "A3", "D17"];
        const newGate = shouldAdvance ? gates[Math.floor(Math.random() * gates.length)] : leg.gate;
        return { ...leg, flight_status: newStatus, gate: newGate };
      }),
    }));
  }, []);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);

    if (!user) {
      setBookings((prev) => {
        const updated = prev.length ? simulateDemoStatusUpdate(prev) : MOCK_BOOKINGS;
        return updated;
      });
      setLastRefresh(new Date());
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
      setBookings((prev) => prev.length ? simulateDemoStatusUpdate(prev) : MOCK_BOOKINGS);
      setLastRefresh(new Date());
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
    setLastRefresh(new Date());
    setIsRefreshing(false);
    setLoading(false);
    setSecondsUntilRefresh(30);
  }, [user, simulateDemoStatusUpdate]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    fetchBookings(false);
  }, [user, authLoading, fetchBookings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      refreshCycleRef.current += 1;
      fetchBookings(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, fetchBookings]);

  // Countdown timer
  useEffect(() => {
    if (loading) return;
    const tick = setInterval(() => {
      setSecondsUntilRefresh((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [loading]);

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div className="min-h-screen bg-background px-4 pb-8">
      {/* Header */}
      <div className="pt-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-card transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Bird className="text-primary" size={24} strokeWidth={2.5} />
            <span className="text-foreground font-bold text-xl">My Trips</span>
          </div>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBookings(true)}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-card transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={`text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
              <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: "#34a853" }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#34a853" }} />
            </div>
            <span className="text-xs text-muted-foreground">
              {secondsUntilRefresh}s
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center mt-24">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="mt-6">
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
                <button
                  onClick={() => navigate("/")}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Search Flights
                </button>
              </div>
            ) : (
              upcoming.map((b) => <TripCard key={b.id} booking={b} onClick={() => setSelectedBooking(b)} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-4">
            {past.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Clock size={40} className="text-muted-foreground mx-auto opacity-40" />
                <p className="text-muted-foreground text-sm">No past trips yet</p>
              </div>
            ) : (
              past.map((b) => <TripCard key={b.id} booking={b} onClick={() => setSelectedBooking(b)} />)
            )}
          </TabsContent>
        </Tabs>
      )}
      {selectedBooking && <TripDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
};

export default MyTrips;
