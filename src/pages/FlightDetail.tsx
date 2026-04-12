import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Plane, Shield, Umbrella, Signal, Coffee, Lock,
  Ticket, RefreshCw, CheckCircle2, Loader2, Info, Zap, AlertTriangle
} from "lucide-react";
import PassengerForm, { type PassengerData } from "@/components/PassengerForm";
import { getMockFlightsForDestination, type FlightResult } from "@/lib/mockFlights";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COUNTRY_MAP: Record<string, string> = {
  TLV: "Israel", IST: "Turkey", CDG: "France", LHR: "United Kingdom",
  NRT: "Japan", FCO: "Italy", FRA: "Germany", BCN: "Spain",
};

const FlightDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const flightId = searchParams.get("id") || "";
  const dest = searchParams.get("dest") || "";

  const flight = useMemo(() => {
    const allFlights = getMockFlightsForDestination(dest);
    return allFlights.find((f) => f.id === flightId) || null;
  }, [flightId, dest]);

  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null);

  // Add-on toggles
  const [addConnectionGuarantee, setAddConnectionGuarantee] = useState(false);
  const [addInsurance, setAddInsurance] = useState(false);
  const [addEsim, setAddEsim] = useState(false);
  const [addLounge, setAddLounge] = useState(false);
  const [addPriceFreeze, setAddPriceFreeze] = useState(false);
  const [addAutoCheckin, setAddAutoCheckin] = useState(false);
  const [addAutoRecovery, setAddAutoRecovery] = useState(false);

  // Mock states
  const hasPassport = false;
  const hasCardMandate = false;

  if (!flight) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Flight not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm font-medium underline text-primary">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const country = COUNTRY_MAP[flight.destinationIata] || "your destination";
  const baseFare = Math.round(flight.priceUsd * 0.85);
  const taxes = flight.priceUsd - baseFare;
  const aiFee = 30;
  const connectionGuaranteeCost = 49;
  const insuranceCost = 49;
  const esimCost = 8;
  const loungeCost = 45;
  const freezeCost = 29;

  // Parse duration for lounge eligibility
  const durationMatch = flight.durationFormatted.match(/(\d+)h/);
  const durationHours = durationMatch ? parseInt(durationMatch[1]) : 0;
  const showLounge = flight.stops > 0 && durationHours > 3;

  const extrasTotal =
    (addConnectionGuarantee ? connectionGuaranteeCost : 0) +
    (addInsurance ? insuranceCost : 0) +
    (addEsim ? esimCost : 0) +
    (addLounge ? loungeCost : 0) +
    (addPriceFreeze ? freezeCost : 0);

  const grandTotal = flight.priceUsd + aiFee + extrasTotal;

  const handleBookClick = () => {
    setShowPassengerForm(true);
  };

  const handlePassengerSubmit = async (data: PassengerData) => {
    setPassengerData(data);
    setIsBooking(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsBooking(false);
    setBookingComplete(true);
    toast.success("Booking confirmed! (Demo)");
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="rounded-full p-4 mb-6" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}>
          <CheckCircle2 size={48} style={{ color: "#22C55E" }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center">Booking Confirmed</h1>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {flight.airlineName} {flight.flightNumber} · {flight.originIata} → {flight.destinationIata}
        </p>
        <div className="rounded-2xl p-4 mt-6 w-full max-w-sm" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Confirmation</span>
            <span className="font-bold text-foreground">NSHRDEMO42</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Total Charged</span>
            <span className="font-bold text-primary">${grandTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-muted-foreground">Points Earned</span>
            <span className="font-bold text-foreground">{flight.pointsEarn.toLocaleString()} pts</span>
          </div>
        </div>
        <span className="text-[10px] mt-3 px-2 py-0.5 rounded bg-muted text-muted-foreground">DEMO</span>
        <button
          onClick={() => navigate("/")}
          className="mt-8 px-6 py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-32 animate-fade-in">
        {/* Top bar */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft size={22} className="text-foreground" />
            </button>
            <h1 className="text-base font-semibold text-foreground truncate flex-1">Flight Details</h1>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">DEMO</span>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* 1. FLIGHT SUMMARY */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full flex items-center justify-center text-xs font-bold" style={{ width: 44, height: 44, backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                {flight.airlineCode}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{flight.airlineName}</p>
                <p className="text-xs text-muted-foreground">{flight.flightNumber} · {flight.cabinClass} · Apr 28, 2026</p>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{flight.departureTime}</p>
                <p className="text-xs font-medium text-muted-foreground">{flight.originIata}</p>
              </div>
              <div className="flex-1 flex flex-col items-center px-4">
                <p className="text-xs text-muted-foreground">{flight.durationFormatted}</p>
                <div className="flex items-center gap-1 w-full my-1">
                  <div className="flex-1 h-px bg-border" />
                  <Plane size={14} className="text-muted-foreground" />
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {flight.arrivalTime}
                  {flight.arrivesNextDay && <sup className="text-[10px] ml-0.5 text-muted-foreground">+1</sup>}
                </p>
                <p className="text-xs font-medium text-muted-foreground">{flight.destinationIata}</p>
              </div>
            </div>

            {/* Price */}
            <div className="mt-4 text-center">
              <span className="text-3xl font-bold text-primary">${flight.priceUsd.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground ml-1">per person</span>
            </div>
          </div>

          {/* Split ticket / skiplag warnings */}
          {flight.isSplitTicket && (
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary">Split Ticket</p>
                <p className="text-xs text-muted-foreground mt-0.5">{flight.splitDetails}</p>
              </div>
            </div>
          )}
          {flight.isSkiplag && (
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
              <Zap size={16} style={{ color: "#FBBF24" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold" style={{ color: "#FBBF24" }}>Hidden City Fare</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deplaning before final destination. Checked bags routed to ticketed city.</p>
              </div>
            </div>
          )}

          {/* 2. FARE BREAKDOWN */}
          <div className="rounded-2xl p-4 space-y-2.5" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm font-semibold text-foreground mb-3">Fare Breakdown</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Base fare</span>
              <span className="text-foreground">${baseFare.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taxes & fees</span>
              <span className="text-foreground">${taxes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                AI Optimization Fee
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    Covers real-time safety scanning, points optimization, and route intelligence
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-foreground">${aiFee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">${(flight.priceUsd + aiFee).toLocaleString()}</span>
            </div>
          </div>

          {/* 3. ADD-ONS */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Add-ons</p>
            <div className="space-y-3">
              {/* A) Connection Guarantee */}
              {flight.isSplitTicket && (
                <AddonToggle
                  icon={<Shield size={18} style={{ color: "#22C55E" }} />}
                  title="Connection Guarantee"
                  subtitle="Protect your connection — $49"
                  description="If Flight 1 is late and you miss Flight 2, our team immediately rebooks you at no extra cost."
                  price={connectionGuaranteeCost}
                  checked={addConnectionGuarantee}
                  onToggle={() => setAddConnectionGuarantee(!addConnectionGuarantee)}
                />
              )}

              {/* B) Travel Insurance */}
              <AddonToggle
                icon={<Umbrella size={18} className="text-primary" />}
                title="Travel Insurance"
                subtitle="Trip protection — from $49"
                description="Covers cancellations, medical, and lost baggage."
                price={insuranceCost}
                checked={addInsurance}
                onToggle={() => setAddInsurance(!addInsurance)}
              />

              {/* C) eSIM */}
              <AddonToggle
                icon={<Signal size={18} className="text-primary" />}
                title="eSIM"
                subtitle={`Stay connected in ${country} from $8`}
                description="5GB data, 30 days. Activate before you land."
                price={esimCost}
                checked={addEsim}
                onToggle={() => setAddEsim(!addEsim)}
              />

              {/* D) Lounge Access */}
              {showLounge && (
                <AddonToggle
                  icon={<Coffee size={18} className="text-primary" />}
                  title="Lounge Access"
                  subtitle={`Priority Lounge at layover — $45`}
                  description={`Food, WiFi, showers during your layover.`}
                  price={loungeCost}
                  checked={addLounge}
                  onToggle={() => setAddLounge(!addLounge)}
                />
              )}

              {/* E) Price Freeze */}
              <AddonToggle
                icon={<Lock size={18} className="text-primary" />}
                title="Price Freeze"
                subtitle="Lock this price for 24hrs — $29"
                description="If the price goes up, we cover the difference."
                price={freezeCost}
                checked={addPriceFreeze}
                onToggle={() => setAddPriceFreeze(!addPriceFreeze)}
              />

              {/* F) Auto Check-In */}
              <AddonToggle
                icon={<Ticket size={18} className={hasPassport ? "text-primary" : "text-muted-foreground"} />}
                title="Auto Check-In"
                subtitle="Check me in automatically"
                description={hasPassport
                  ? "We'll grab the best seat the moment the window opens."
                  : "Add passport in profile to enable"}
                price={0}
                checked={addAutoCheckin}
                onToggle={() => hasPassport && setAddAutoCheckin(!addAutoCheckin)}
                disabled={!hasPassport}
              />

              {/* G) Auto Recovery */}
              <AddonToggle
                icon={<RefreshCw size={18} className={hasCardMandate ? "text-primary" : "text-muted-foreground"} />}
                title="Auto Recovery"
                subtitle="Auto-rebook if cancelled — free"
                description={hasCardMandate
                  ? "We'll secure your seat on the next flight before you even know yours was cancelled."
                  : "Set up payment mandate in settings to enable"}
                price={0}
                checked={addAutoRecovery}
                onToggle={() => hasCardMandate && setAddAutoRecovery(!addAutoRecovery)}
                disabled={!hasCardMandate}
              />
            </div>
          </div>
        </div>

        {/* 4. BOOK BUTTON - Fixed bottom */}
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 z-30 bg-background border-t border-border">
          <button
            onClick={handleBook}
            disabled={isBooking}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex flex-col items-center justify-center gap-0.5 disabled:opacity-60"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {isBooking ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <span>Book for ${grandTotal.toLocaleString()}</span>
                <span className="text-[10px] font-normal opacity-80">Price verified live — no surprises</span>
              </>
            )}
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
};

const AddonToggle = ({
  icon,
  title,
  subtitle,
  description,
  price,
  checked,
  onToggle,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`w-full rounded-2xl p-4 flex items-start gap-3 text-left transition-colors duration-200 ${disabled ? "opacity-50" : ""}`}
    style={{
      backgroundColor: checked ? "hsl(var(--primary) / 0.06)" : "hsl(var(--card))",
      border: `1px solid ${checked ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
    }}
  >
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {price > 0 && <span className="text-sm font-bold text-primary shrink-0">+${price}</span>}
        {price === 0 && <span className="text-xs text-muted-foreground shrink-0">Free</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
    <div
      className="mt-1 shrink-0 rounded-full flex items-center justify-center transition-colors duration-200"
      style={{
        width: 22,
        height: 22,
        backgroundColor: checked ? "hsl(var(--primary))" : "transparent",
        border: checked ? "none" : `2px solid ${disabled ? "hsl(var(--muted))" : "hsl(var(--border))"}`,
      }}
    >
      {checked && <CheckCircle2 size={14} className="text-primary-foreground" />}
    </div>
  </button>
);

export default FlightDetail;
