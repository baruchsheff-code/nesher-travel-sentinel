import { ArrowLeft, Check, Bird } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const BENEFITS = [
  "All Premium features",
  "Centralized billing for your whole team",
  "Travel policy engine (set cabin class rules, max fare rules)",
  "Duty of care dashboard — see all travelers in real time",
  "Automated expense reports",
  "Dedicated human agent for your account",
  "Crisis alerts for employee destinations",
];

const Business = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-card transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <Bird className="text-primary" size={24} strokeWidth={2.5} />
        <span className="text-foreground font-bold text-xl">Business</span>
      </div>

      <div className="max-w-md mx-auto px-4 mt-8">
        {/* Hero card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: "1px solid rgba(30, 58, 138, 0.3)" }}
        >
          <div
            className="px-6 pt-8 pb-6 text-center"
            style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" }}
          >
            <p className="text-3xl mb-1">🏢</p>
            <h1 className="text-2xl font-bold text-white">Nesher Business</h1>
            <p className="text-sm mt-1 text-blue-200">
              Corporate travel, simplified and protected.
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">$99</span>
              <span className="text-sm text-blue-200">/month</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-3" style={{ backgroundColor: "hsl(var(--card))" }}>
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-2.5">
                <Check size={16} className="shrink-0 mt-0.5 text-blue-400" />
                <span className="text-sm text-foreground">{b}</span>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6" style={{ backgroundColor: "hsl(var(--card))" }}>
            <a
              href="mailto:business@nesher.travel?subject=Nesher Business Inquiry"
              className="block w-full py-3.5 rounded-2xl text-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" }}
            >
              Contact Us
            </a>
            <p className="text-center text-xs mt-3 text-muted-foreground">
              We'll set up your team in under 24 hours
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Business;
