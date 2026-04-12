import { User, LogOut, Briefcase } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import FlightSearchBar, { type FlightSearchParams } from "@/components/FlightSearchBar";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TravelChat from "@/components/TravelChat";
import PriceWatchDashboard from "@/components/PriceWatchDashboard";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";

const NesherLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path
      d="M4 18C5 14 8 10 12 8C14 7 17 6 20 6C20 9 19 12 17 15C15 18 12 20 8 20C6 20 4 19 4 18Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 8C10 10 8 14 8 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20 6C16 8 12 12 8 20"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

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
          <span className="text-primary"><NesherLogo /></span>
          <span className="text-primary font-bold text-2xl sm:text-[32px]">Nesher</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <>
              <NotificationBell />
              <button onClick={() => navigate("/my-trips")} className="p-2 rounded-full hover:bg-card transition-colors" aria-label="My Trips">
                <Briefcase size={18} className="text-muted-foreground" />
              </button>
              <button onClick={() => navigate("/settings")} className="rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all shrink-0 bg-card border border-border" style={{ width: 36, height: 36 }}>
                <User size={16} className="text-muted-foreground" />
              </button>
              <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-card transition-colors">
                <LogOut size={16} className="text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />

        <h1 className="text-foreground font-bold text-center leading-tight animate-fade-in-delay-1 text-[28px] sm:text-[40px] relative z-10">
          Book smarter. Travel safer. Recover faster.
        </h1>
        <p className="text-muted-foreground text-center mt-3 mb-8 animate-fade-in-delay-2 text-sm sm:text-base relative z-10">
          Your AI travel agent — licensed, intelligent, always looking out for you.
        </p>

        {/* Flight Search Bar */}
        <div className="w-full animate-fade-in-delay-2 relative z-10">
          <FlightSearchBar onSearch={handleSearch} />
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-0 mt-8 animate-fade-in-delay-3 flex-wrap relative z-10">
          <span className="flex items-center gap-1 text-muted-foreground text-xs sm:text-[13px]">
            <span style={{ color: "#C9A84C" }}>🛡️</span> Licensed Agent
          </span>
          <span className="mx-2 sm:mx-3 opacity-40 text-muted-foreground">|</span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs sm:text-[13px]">
            <span style={{ color: "#C9A84C" }}>📡</span> Live Crisis Intel
          </span>
          <span className="mx-2 sm:mx-3 opacity-40 text-muted-foreground">|</span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs sm:text-[13px]">
            <span style={{ color: "#C9A84C" }}>👤</span> 24/7 Human Backup
          </span>
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
