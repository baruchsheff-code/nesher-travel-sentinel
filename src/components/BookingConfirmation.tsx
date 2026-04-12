import { useState, useEffect } from "react";
import { CheckCircle2, Copy, Smartphone, Download, ArrowRight, Wifi, QrCode } from "lucide-react";
import { toast } from "sonner";
import type { FlightResult } from "@/lib/mockFlights";

interface BookingConfirmationProps {
  flight: FlightResult;
  firstName: string;
  grandTotal: number;
  pnr: string;
  pnr2?: string;
  selectedSeat: string | null;
  addEsim: boolean;
  addLounge: boolean;
  esimActivationCode?: string;
  onViewTrip: () => void;
  onGoHome: () => void;
}

const TEAM_AVATARS = ["A", "S", "M", "J", "R"];

const BookingConfirmation = ({
  flight,
  firstName,
  grandTotal,
  pnr,
  pnr2,
  selectedSeat,
  addEsim,
  addLounge,
  esimActivationCode = "SM-DP+: lpa.live.onomondo.com\n$ICCID: 893700000000000000",
  onViewTrip,
  onGoHome,
}: BookingConfirmationProps) => {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 100);
    return () => clearTimeout(t);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background px-4 py-10 animate-fade-in">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div
            className={`rounded-full flex items-center justify-center transition-all duration-700 ${showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
            style={{
              width: 80,
              height: 80,
              backgroundColor: "hsl(var(--primary) / 0.15)",
            }}
          >
            <CheckCircle2
              size={48}
              className="text-primary"
              style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.4))" }}
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">You're booked, {firstName}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Confirmation details below</p>
        </div>

        {/* Flight Summary Card */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center text-xs font-bold"
              style={{ width: 40, height: 40, backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              {flight.airlineCode}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{flight.airlineName} {flight.flightNumber}</p>
              <p className="text-xs text-muted-foreground">Apr 28, 2026 · {flight.cabinClass}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{flight.departureTime}</p>
              <p className="text-xs text-muted-foreground">{flight.originIata}</p>
            </div>
            <div className="text-xs text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{flight.arrivalTime}</p>
              <p className="text-xs text-muted-foreground">{flight.destinationIata}</p>
            </div>
          </div>

          {selectedSeat && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Seat</span>
              <span className="text-foreground font-medium">{selectedSeat}</span>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* PNR */}
          {flight.isSplitTicket && pnr2 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Leg 1 PNR</span>
                <button onClick={() => copyToClipboard(pnr)} className="flex items-center gap-1 font-mono font-bold text-foreground">
                  {pnr} <Copy size={10} />
                </button>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Leg 2 PNR</span>
                <button onClick={() => copyToClipboard(pnr2)} className="flex items-center gap-1 font-mono font-bold text-foreground">
                  {pnr2} <Copy size={10} />
                </button>
              </div>
              <div
                className="rounded-xl px-3 py-2 mt-1"
                style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.25)" }}
              >
                <p className="text-[11px] leading-relaxed" style={{ color: "#FBBF24" }}>
                  ⚠️ These are separate tickets. Keep both confirmation numbers saved. Our team is monitoring your connection.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">PNR</span>
              <button onClick={() => copyToClipboard(pnr)} className="flex items-center gap-1 font-mono font-bold text-foreground">
                {pnr} <Copy size={10} />
              </button>
            </div>
          )}

          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total charged</span>
            <span className="font-bold text-primary">${grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* eSIM Card */}
        {addEsim && (
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}
          >
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">eSIM Activation</p>
            </div>
            <div className="rounded-xl bg-background p-3 font-mono text-xs text-foreground break-all">
              {esimActivationCode}
            </div>
            <button
              onClick={() => copyToClipboard(esimActivationCode)}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <Copy size={12} /> Copy activation code
            </button>
          </div>
        )}

        {/* Lounge QR */}
        {addLounge && (
          <div
            className="rounded-2xl p-4 flex flex-col items-center gap-3"
            style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">Lounge Access Pass</p>
            </div>
            <div
              className="rounded-xl flex items-center justify-center"
              style={{ width: 120, height: 120, backgroundColor: "hsl(var(--muted))" }}
            >
              <QrCode size={64} className="text-foreground opacity-40" />
            </div>
            <p className="text-[11px] text-muted-foreground">Show this QR at the lounge entrance</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {(isIOS || !isAndroid) && (
            <ActionButton icon={<Smartphone size={16} />} label="Add to Apple Wallet" onClick={() => toast.info("Apple Wallet integration coming soon")} />
          )}
          {(isAndroid || !isIOS) && (
            <ActionButton icon={<Smartphone size={16} />} label="Add to Google Wallet" onClick={() => toast.info("Google Wallet integration coming soon")} />
          )}
          <ActionButton icon={<Download size={16} />} label="Download trip offline" onClick={() => toast.info("Offline download coming soon")} />
          <ActionButton icon={<ArrowRight size={16} />} label="View my trip" onClick={onViewTrip} highlight />
        </div>

        {/* Monitoring footer */}
        <div className="text-center space-y-3 pt-4">
          <div className="flex justify-center -space-x-2">
            {TEAM_AVATARS.map((letter, i) => (
              <div
                key={i}
                className="rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: `hsl(${210 + i * 30}, 60%, 45%)`,
                  color: "white",
                }}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed px-6">
            Our team has been notified of your trip and will monitor it 24/7
          </p>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  icon,
  label,
  onClick,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) => (
  <button
    onClick={onClick}
    className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200"
    style={{
      backgroundColor: highlight ? "hsl(var(--primary))" : "hsl(var(--card))",
      color: highlight ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
      border: highlight ? "none" : "1px solid hsl(var(--border))",
    }}
  >
    {icon}
    {label}
  </button>
);

export default BookingConfirmation;
