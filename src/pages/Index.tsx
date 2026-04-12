import { Search, MessageCircle, Bird, Loader2, User, LogOut, Briefcase } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseDestination } from "@/lib/destinations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TravelChat from "@/components/TravelChat";

const Index = () => {
  const [query, setQuery] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const directMatch = parseDestination(trimmed);
    const isSimple = trimmed.split(/\s+/).length <= 2 && directMatch;

    if (isSimple) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-search", {
        body: { query: trimmed },
      });

      if (error) throw error;

      if (data?.destination_city) {
        const params = new URLSearchParams({ q: data.destination_city });
        if (data.origin_iata) params.set("origin", data.origin_iata);
        if (data.travel_date) params.set("date", data.travel_date);
        if (data.cabin && data.cabin !== "economy") params.set("cabin", data.cabin);
        if (data.mentioned_card) params.set("card", data.mentioned_card);
        navigate(`/search?${params.toString()}`);
      } else {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    } catch (err) {
      console.error("AI parse error:", err);
      toast.error("AI parsing failed, searching directly...");
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } finally {
      setIsParsing(false);
    }
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
          <Bird className="text-primary" size={28} strokeWidth={2.5} />
          <span className="text-primary font-bold" style={{ fontSize: 32 }}>
            Nesher
          </span>
        </div>
        {user ? (
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => navigate("/my-trips")} className="p-2 rounded-full hover:bg-card transition-colors" aria-label="My Trips">
              <Briefcase size={18} className="text-muted-foreground" />
            </button>
            <div className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <User size={16} className="text-muted-foreground" />
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-card transition-colors">
              <LogOut size={16} className="text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-12">
        <h1
          className="text-foreground font-bold text-center leading-tight animate-fade-in-delay-1"
          style={{ fontSize: 36 }}
        >
          Book smarter. Travel safer. Recover faster.
        </h1>

        <p
          className="text-muted-foreground text-center mt-4 animate-fade-in-delay-2"
          style={{ fontSize: 16 }}
        >
          Your AI travel agent — licensed, intelligent, always watching.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full mt-8 animate-fade-in-delay-2">
          <div className={`relative rounded-2xl p-[2px] ${isParsing ? "gemini-glow-active" : "gemini-glow"}`}>
            <div className="flex items-center gap-3 w-full bg-card rounded-2xl px-4 py-4 relative z-10">
              {isParsing ? (
                <Loader2 className="text-primary shrink-0 animate-spin" size={22} />
              ) : (
                <Search className="text-primary shrink-0" size={22} />
              )}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where do you want to go?"
                className="bg-transparent text-foreground placeholder:text-muted-foreground w-full outline-none"
                style={{ fontSize: 16, fontFamily: "Inter, sans-serif" }}
                disabled={isParsing}
              />
            </div>
          </div>
          {isParsing && (
            <p className="text-center text-xs mt-3 animate-pulse" style={{ color: "hsl(var(--primary))" }}>
              AI is searching...
            </p>
          )}
        </form>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-0 mt-6 animate-fade-in-delay-3">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            🛡️ Licensed Agent
          </span>
          <span className="text-muted-foreground mx-3 opacity-40">|</span>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            📡 Live Crisis Intel
          </span>
          <span className="text-muted-foreground mx-3 opacity-40">|</span>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            👤 24/7 Human Backup
          </span>
        </div>
      </div>

      {/* Floating AI Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 bg-primary rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity duration-200"
        style={{ width: 56, height: 56 }}
        aria-label="AI Assistant"
      >
        <MessageCircle className="text-accent-foreground" size={26} />
      </button>

      {/* AI Chat */}
      <TravelChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Index;
