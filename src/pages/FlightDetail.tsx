import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Plane, Globe, CreditCard, Lock, Shield, Clock,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Loader2,
  Users, Luggage, Wifi, UtensilsCrossed, Zap, Info
} from "lucide-react";
import { getMockFlightsForDestination, type FlightResult } from "@/lib/mockFlights";
import { MOCK_SAFETY } from "@/lib/destinations";
import { toast } from "sonner";

type BookingStep = "details" | "passengers" | "extras" | "review";

const STEPS: { key: BookingStep; label: string }[] = [
  { key: "details", label: "Flight" },
  { key: "passengers", label: "Passengers" },
  { key: "extras", label: "Extras" },
  { key: "review", label: "Review" },
];

const FlightDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const flightId = searchParams.get("id") || "";
  const dest = searchParams.get("dest") || "";

  const flight = useMemo(() => {
    const allFlights = getMockFlightsForDestination(dest);
    return allFlights.find((f) => f.id === flightId) || null;
  }, [flightId, dest]);

  const [step, setStep] = useState<BookingStep>("details");
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Passenger form
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");

  // Extras
  const [addInsurance, setAddInsurance] = useState(false);
  const [addEsim, setAddEsim] = useState(false);
  const [addPriceFreeze, setAddPriceFreeze] = useState(false);

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

  const safety = MOCK_SAFETY[flight.destinationIata];
  const predColor = flight.prediction === "buy" ? "#22C55E" : "hsl(var(--muted-foreground))";

  const insuranceCost = 49;
  const esimCost = 8;
  const freezeCost = 29;
  const curationFee = 30;

  const extrasTotal =
    (addInsurance ? insuranceCost : 0) +
    (addEsim ? esimCost : 0) +
    (addPriceFreeze ? freezeCost : 0);
  const grandTotal = flight.priceUsd + curationFee + extrasTotal;

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  const canProceed = () => {
    if (step === "passengers") return passengerName.trim().length > 0 && passengerEmail.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    const idx = currentStepIdx;
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };

  const handleBack = () => {
    const idx = currentStepIdx;
    if (idx > 0) setStep(STEPS[idx - 1].key);
    else navigate(-1);
  };

  const handleBook = async () => {
    setIsBooking(true);
    // Simulate booking delay
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
        <span className="text-[10px] mt-3 px-2 py-0.5 rounded" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>DEMO</span>
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
    <div className="min-h-screen bg-background pb-28 animate-fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="shrink-0">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground truncate flex-1">
            {step === "details" ? "Flight Details" : STEPS[currentStepIdx].label}
          </h1>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>DEMO</span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mt-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="h-1 w-full rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i <= currentStepIdx ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
              />
              <span className="text-[10px]" style={{ color: i <= currentStepIdx ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2">
        {/* STEP 1: Flight Details */}
        {step === "details" && (
          <div className="space-y-4">
            {/* Flight header card */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full flex items-center justify-center text-xs font-bold" style={{ width: 40, height: 40, backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                  {flight.airlineCode}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{flight.airlineName}</p>
                  <p className="text-xs text-muted-foreground">{flight.flightNumber} · {flight.cabinClass}</p>
                </div>
                {safety && (
                  <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{
                    backgroundColor: `${safety.score >= 7 ? "#22C55E" : safety.score >= 5 ? "#FBBF24" : "#EF4444"}20`,
                    border: `1px solid ${safety.score >= 7 ? "#22C55E" : safety.score >= 5 ? "#FBBF24" : "#EF4444"}40`
                  }}>
                    <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: safety.score >= 7 ? "#22C55E" : safety.score >= 5 ? "#FBBF24" : "#EF4444" }} />
                    <span className="text-xs font-bold" style={{ color: safety.score >= 7 ? "#22C55E" : safety.score >= 5 ? "#FBBF24" : "#EF4444" }}>{safety.score}</span>
                  </div>
                )}
              </div>

              {/* Time row */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{flight.departureTime}</p>
                  <p className="text-xs font-medium text-muted-foreground">{flight.originIata}</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-4">
                  <p className="text-xs text-muted-foreground">{flight.durationFormatted}</p>
                  <div className="flex items-center gap-1 w-full my-1">
                    <div className="flex-1 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
                    <Plane size={14} className="text-muted-foreground" />
                    <div className="flex-1 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
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
            </div>

            {/* Split ticket warning */}
            {flight.isSplitTicket && (
              <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary">Split Ticket</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{flight.splitDetails}. If the first flight is delayed, you may need to rebook the second leg separately.</p>
                </div>
              </div>
            )}

            {/* Skiplag warning */}
            {flight.isSkiplag && (
              <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
                <Zap size={16} style={{ color: "#FBBF24" }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#FBBF24" }}>Hidden City Fare</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This fare involves deplaning before the final destination. Check-in bags will be routed to the ticketed destination.</p>
                </div>
              </div>
            )}

            {/* Price prediction */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Price Prediction</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${predColor}18`, color: predColor }}>
                  {flight.prediction === "buy" ? "Buy Now" : "Wait"} · {flight.predictionConfidence}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--border))" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${flight.predictionConfidence}%`, backgroundColor: predColor }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {flight.prediction === "buy"
                  ? "Our AI predicts this price is likely to increase. We recommend booking now."
                  : "Our AI predicts this price may drop. Consider setting a price watch."}
              </p>
            </div>

            {/* Fare breakdown */}
            <button
              onClick={() => setShowFareDetails(!showFareDetails)}
              className="w-full rounded-2xl p-4 flex items-center justify-between"
              style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <span className="text-sm font-semibold text-foreground">Fare Breakdown</span>
              {showFareDetails ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>
            {showFareDetails && (
              <div className="rounded-2xl p-4 -mt-2 space-y-2" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderTop: "none", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Base fare</span><span className="text-foreground">${flight.priceUsd.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Curation fee</span><span className="text-foreground">${curationFee}</span></div>
                <div className="h-px my-1" style={{ backgroundColor: "hsl(var(--border))" }} />
                <div className="flex justify-between text-sm font-semibold"><span className="text-foreground">Total</span><span className="text-primary">${(flight.priceUsd + curationFee).toLocaleString()}</span></div>
              </div>
            )}

            {/* Info rows */}
            <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Earn {flight.pointsEarn.toLocaleString()} pts on {flight.pointsCard}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{flight.visaInfo}</span>
              </div>
              {flight.isResilientCarrier && (
                <div className="flex items-center gap-3">
                  <Shield size={16} style={{ color: "#22C55E" }} />
                  <span className="text-xs" style={{ color: "#22C55E" }}>Resilient carrier — priority rebooking guaranteed</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Luggage size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">1 carry-on + 1 checked bag included</span>
              </div>
              <div className="flex items-center gap-3">
                <Wifi size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Wi-Fi available (paid)</span>
              </div>
              <div className="flex items-center gap-3">
                <UtensilsCrossed size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Meal included</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Passengers */}
        {step === "passengers" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Passenger 1</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Full Name (as on passport)</label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-background text-foreground outline-none"
                    style={{ border: "1px solid hsl(var(--border))" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-background text-foreground outline-none"
                    style={{ border: "1px solid hsl(var(--border))" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-background text-foreground outline-none"
                    style={{ border: "1px solid hsl(var(--border))" }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">Passport details will be collected after booking confirmation. Names must match your travel document exactly.</p>
            </div>
          </div>
        )}

        {/* STEP 3: Extras */}
        {step === "extras" && (
          <div className="space-y-3">
            <ExtraToggle
              icon={<Shield size={18} style={{ color: "#22C55E" }} />}
              title="Travel Insurance"
              description="Full coverage including delays, cancellations, and medical. Powered by Nesher's community pool."
              price={insuranceCost}
              checked={addInsurance}
              onToggle={() => setAddInsurance(!addInsurance)}
            />
            <ExtraToggle
              icon={<Globe size={18} className="text-primary" />}
              title="Travel eSIM"
              description={`5GB data in ${flight.destinationIata === "TLV" ? "Israel" : "destination country"} · 30 days validity`}
              price={esimCost}
              checked={addEsim}
              onToggle={() => setAddEsim(!addEsim)}
            />
            <ExtraToggle
              icon={<Lock size={18} className="text-primary" />}
              title="Price Freeze"
              description="Lock this price for 48 hours while you decide. Refundable if you don't book."
              price={freezeCost}
              checked={addPriceFreeze}
              onToggle={() => setAddPriceFreeze(!addPriceFreeze)}
            />
          </div>
        )}

        {/* STEP 4: Review */}
        {step === "review" && (
          <div className="space-y-4">
            {/* Flight summary */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-xs text-muted-foreground mb-2">Flight</p>
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center text-xs font-bold" style={{ width: 32, height: 32, backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                  {flight.airlineCode}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{flight.airlineName} {flight.flightNumber}</p>
                  <p className="text-xs text-muted-foreground">{flight.departureTime} {flight.originIata} → {flight.arrivalTime} {flight.destinationIata}</p>
                </div>
              </div>
            </div>

            {/* Passenger summary */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-xs text-muted-foreground mb-2">Passenger</p>
              <p className="text-sm font-semibold text-foreground">{passengerName}</p>
              <p className="text-xs text-muted-foreground">{passengerEmail}</p>
            </div>

            {/* Price summary */}
            <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-xs text-muted-foreground mb-2">Price Summary</p>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Base fare</span><span className="text-foreground">${flight.priceUsd.toLocaleString()}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Curation fee</span><span className="text-foreground">${curationFee}</span></div>
              {addInsurance && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Travel Insurance</span><span className="text-foreground">${insuranceCost}</span></div>}
              {addEsim && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Travel eSIM</span><span className="text-foreground">${esimCost}</span></div>}
              {addPriceFreeze && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Price Freeze</span><span className="text-foreground">${freezeCost}</span></div>}
              <div className="h-px my-1" style={{ backgroundColor: "hsl(var(--border))" }} />
              <div className="flex justify-between text-base font-bold"><span className="text-foreground">Total</span><span className="text-primary">${grandTotal.toLocaleString()}</span></div>
              <div className="flex items-center gap-1.5 mt-1">
                <CreditCard size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Earn {flight.pointsEarn.toLocaleString()} pts on {flight.pointsCard}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 z-30" style={{ backgroundColor: "hsl(var(--background))", borderTop: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-primary">${grandTotal.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-1">total</span>
          </div>
          {step !== "details" && (
            <button onClick={handleBack} className="text-xs font-medium text-muted-foreground underline">
              Back
            </button>
          )}
        </div>
        {step === "review" ? (
          <button
            onClick={handleBook}
            disabled={isBooking}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isBooking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>Confirm & Book · ${grandTotal.toLocaleString()}</>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

const ExtraToggle = ({
  icon,
  title,
  description,
  price,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: number;
  checked: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full rounded-2xl p-4 flex items-start gap-3 text-left transition-colors duration-200"
    style={{
      backgroundColor: checked ? "hsl(var(--primary) / 0.06)" : "hsl(var(--card))",
      border: `1px solid ${checked ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
    }}
  >
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-sm font-bold text-primary">+${price}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
    <div
      className="mt-1 shrink-0 rounded-full flex items-center justify-center transition-colors duration-200"
      style={{
        width: 22,
        height: 22,
        backgroundColor: checked ? "hsl(var(--primary))" : "transparent",
        border: checked ? "none" : "2px solid hsl(var(--border))",
      }}
    >
      {checked && <CheckCircle2 size={14} className="text-primary-foreground" />}
    </div>
  </button>
);

export default FlightDetail;
