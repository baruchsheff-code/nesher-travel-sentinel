import { Bird, User, LogOut, Briefcase } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import FlightSearchBar, { type FlightSearchParams } from "@/components/FlightSearchBar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TravelChat from "@/components/TravelChat";
import PriceWatchDashboard from "@/components/PriceWatchDashboard";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";

const Index = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSearch = (params: FlightSearchParams) => {
    if (!params.origin || !params.destination || !params.departDate) return;

    const sp = new URLSearchParams();
    sp.set("origin", params.origin.iata);
    sp.set("dest", params.destination.iata);
    sp.set("destCity", params.destination.city);
    sp.set("destCountry", params.destination.country);
    sp.set("destFlag", params.destination.flag);
    sp.set("date", params.departDate.toISOString().slice(0, 10));
    if (params.returnDate) sp.set("returnDate", params.returnDate.toISOString().slice(0, 10));
    sp.set("cabin", params.cabinClass);
    sp.set("adults", String(params.adults));
    if (params.children) sp.set("children", String(params.children));
    if (params.infants) sp.set("infants", String(params.infants));
    sp.set("tripType", params.tripType);
    if (params.directOnly) sp.set("direct", "1");
    if (params.maxPrice < 5000) sp.set("maxPrice", String(params.maxPrice));

    navigate(`/search?${sp.toString()}`);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 relative">
      {/* Top bar */}
      <div className="pt-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <Bird className="text-primary shrink-0" size={28} strokeWidth={2.5} />
          <span className="text-primary font-bold text-2xl sm:text-[32px]">Nesher</span>
        </div>
        {user && (
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => navigate("/my-trips")} className="p-2 rounded-full hover:bg-card transition-colors" aria-label="My Trips">
              <Briefcase size={18} className="text-muted-foreground" />
            </button>
            <button onClick={() => navigate("/settings")} className="rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all shrink-0" style={{ width: 36, height: 36, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <User size={16} className="text-muted-foreground" />
            </button>
            <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-card transition-colors">
              <LogOut size={16} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-8">
        <h1 className="text-foreground font-bold text-center leading-tight animate-fade-in-delay-1 text-[28px] sm:text-[36px]">
          Book smarter. Travel safer. Recover faster.
        </h1>
        <p className="text-muted-foreground text-center mt-3 mb-8 animate-fade-in-delay-2 text-sm sm:text-base">
          Your AI travel agent — licensed, intelligent, always looking out for you.
        </p>

        {/* Flight Search Bar */}
        <div className="w-full animate-fade-in-delay-2">
          <FlightSearchBar onSearch={handleSearch} />
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-0 mt-8 animate-fade-in-delay-3 flex-wrap">
          <span className="text-muted-foreground text-xs sm:text-[13px]">🛡️ Licensed Agent</span>
          <span className="text-muted-foreground mx-2 sm:mx-3 opacity-40">|</span>
          <span className="text-muted-foreground text-xs sm:text-[13px]">📡 Live Crisis Intel</span>
          <span className="text-muted-foreground mx-2 sm:mx-3 opacity-40">|</span>
          <span className="text-muted-foreground text-xs sm:text-[13px]">👤 24/7 Human Backup</span>
        </div>

        <PriceWatchDashboard />
      </div>

      <TravelChat open={chatOpen} onClose={() => setChatOpen(false)} />
      <PremiumUpgradeModal open={showPremium} onClose={() => setShowPremium(false)} />
      <BottomNav />
    </div>
  );
};

export default Index;
