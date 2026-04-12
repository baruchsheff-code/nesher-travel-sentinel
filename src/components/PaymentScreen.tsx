import { useState } from "react";
import { ArrowLeft, Lock, CreditCard, ShieldCheck } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface PaymentScreenProps {
  grandTotal: number;
  baseFare: number;
  taxes: number;
  aiFee: number;
  extrasTotal: number;
  seatPrice: number;
  onBack: () => void;
  onComplete: () => void;
  isProcessing: boolean;
}

const PaymentScreen = ({
  grandTotal,
  baseFare,
  taxes,
  aiFee,
  extrasTotal,
  seatPrice,
  onBack,
  onComplete,
  isProcessing,
}: PaymentScreenProps) => {
  const [saveCard, setSaveCard] = useState(false);
  const [maxAutoCharge, setMaxAutoCharge] = useState([500]);
  const [authorizeMandate, setAuthorizeMandate] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const canComplete = cardNumber.replace(/\s/g, "").length >= 15 && expiry.length >= 4 && cvc.length >= 3 && (!saveCard || authorizeMandate);

  return (
    <div className="min-h-screen bg-background pb-8 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="shrink-0">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Payment</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Price Summary */}
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <p className="text-sm font-semibold text-foreground mb-3">Order Summary</p>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base fare</span>
            <span className="text-foreground">${baseFare.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Taxes & fees</span>
            <span className="text-foreground">${taxes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">AI Optimization Fee</span>
            <span className="text-foreground">${aiFee.toFixed(2)}</span>
          </div>
          {extrasTotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Add-ons & seat</span>
              <span className="text-foreground">${extrasTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">${grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Card Input */}
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Card Details</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Card number</label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">CVC</label>
              <input
                type="text"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Auto Recovery Toggle */}
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Save card for Auto Recovery</span>
            </div>
            <Switch checked={saveCard} onCheckedChange={setSaveCard} />
          </div>

          {saveCard && (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Maximum auto-charge limit</span>
                  <span className="text-sm font-bold text-primary">${maxAutoCharge[0].toLocaleString()}</span>
                </div>
                <Slider
                  value={maxAutoCharge}
                  onValueChange={setMaxAutoCharge}
                  min={100}
                  max={2000}
                  step={50}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>$100</span>
                  <span>$2,000</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                By enabling this, you authorize Nesher to charge this card for replacement tickets if your flight is cancelled. You can revoke this anytime in settings.
              </p>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="authorize"
                  checked={authorizeMandate}
                  onCheckedChange={(v) => setAuthorizeMandate(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="authorize" className="text-xs text-foreground cursor-pointer leading-relaxed">
                  I understand and authorize this
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Complete Booking Button */}
        <button
          onClick={onComplete}
          disabled={!canComplete || isProcessing}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-colors duration-200"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {isProcessing ? "Processing..." : "Complete Booking"}
        </button>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground text-center px-4">
          <Lock size={10} className="shrink-0" />
          <span>🔒 256-bit encrypted · PCI DSS compliant · Your card is never stored on our servers</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
