import { useState, useEffect } from "react";
import { ArrowLeft, Lock, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const stripePromise = loadStripe("pk_test_51TLQqX1tkgu9VsdtzwyfxRr1wtUMUqm2QbuRTamYV1vBv2tlzT982XZ78aB7h3K2YMaipaHtS7omdD3wFv1KYiYH00U4n4vB6h");

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

const PaymentScreen = (props: PaymentScreenProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createIntent = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("create-payment-intent", {
          body: {
            amount: Math.round(props.grandTotal * 100),
            currency: "usd",
            metadata: { source: "nesher-booking" },
          },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error("Payment intent error:", err);
        setError(err.message || "Failed to initialize payment");
        toast.error("Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };
    createIntent();
  }, [props.grandTotal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Setting up payment...</p>
        </div>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-sm text-destructive">{error || "Payment initialization failed"}</p>
        <button onClick={props.onBack} className="text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#C9A84C",
            colorBackground: "#1A2332",
            colorText: "#FFFFFF",
            colorDanger: "#E74C3C",
            fontFamily: "Inter, sans-serif",
            borderRadius: "12px",
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
};

const CheckoutForm = ({
  grandTotal,
  baseFare,
  taxes,
  aiFee,
  extrasTotal,
  onBack,
  onComplete,
  isProcessing,
}: PaymentScreenProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [saveCard, setSaveCard] = useState(false);
  const [maxAutoCharge, setMaxAutoCharge] = useState([500]);
  const [authorizeMandate, setAuthorizeMandate] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);

  const canPay = ready && !paying && !isProcessing && (!saveCard || authorizeMandate);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setPaying(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/my-trips",
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setPaying(false);
        return;
      }

      toast.success("Payment successful!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      setPaying(false);
    }
  };

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

        {/* Stripe Payment Element */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Card Details</p>
          </div>
          <PaymentElement
            onReady={() => setReady(true)}
            options={{ layout: "tabs" }}
          />
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
          onClick={handleSubmit}
          disabled={!canPay}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-colors duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {paying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Booking"
          )}
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
