import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bird, Plane, Clock, CheckCircle2, AlertTriangle, MapPin, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
};

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

const TripCard = ({ booking }: { booking: Booking }) => {
  const firstLeg = booking.booking_legs[0];
  const lastLeg = booking.booking_legs[booking.booking_legs.length - 1];
  const upcoming = isUpcoming(booking);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 animate-fade-in">
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
        <Badge variant={upcoming ? "default" : "secondary"} className="text-xs">
          {upcoming ? "Upcoming" : "Past"}
        </Badge>
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

const MyTrips = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Show demo data for non-authenticated users
      setBookings(MOCK_BOOKINGS);
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !bookingsData?.length) {
        // Fall back to mock data if no real bookings
        setBookings(MOCK_BOOKINGS);
        setLoading(false);
        return;
      }

      // Fetch legs for each booking
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
      setLoading(false);
    };

    fetchBookings();
  }, [user, authLoading]);

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((b) => !isUpcoming(b));

  return (
    <div className="min-h-screen bg-background px-4 pb-8">
      {/* Header */}
      <div className="pt-6 flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-card transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Bird className="text-primary" size={24} strokeWidth={2.5} />
          <span className="text-foreground font-bold text-xl">My Trips</span>
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
              upcoming.map((b) => <TripCard key={b.id} booking={b} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-4">
            {past.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Clock size={40} className="text-muted-foreground mx-auto opacity-40" />
                <p className="text-muted-foreground text-sm">No past trips yet</p>
              </div>
            ) : (
              past.map((b) => <TripCard key={b.id} booking={b} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MyTrips;
