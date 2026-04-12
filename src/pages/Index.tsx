import { Search, MessageCircle, Bird } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col px-4 relative">
      {/* Logo */}
      <div className="pt-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Bird className="text-primary" size={28} strokeWidth={2.5} />
          <span className="text-primary font-bold" style={{ fontSize: 32 }}>
            Nesher
          </span>
        </div>
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
        <div className="w-full mt-8 animate-fade-in-delay-2">
          <div
            className="flex items-center gap-3 w-full bg-card rounded-2xl px-4 py-4"
            style={{ border: "1px solid rgba(201, 168, 76, 0.15)" }}
          >
            <Search className="text-primary shrink-0" size={22} />
            <input
              type="text"
              placeholder="Where do you want to go?"
              className="bg-transparent text-foreground placeholder:text-muted-foreground w-full outline-none"
              style={{ fontSize: 16, fontFamily: "Inter, sans-serif" }}
            />
          </div>
        </div>

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
        className="fixed bottom-6 right-6 bg-primary rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity duration-200"
        style={{ width: 56, height: 56 }}
        aria-label="AI Assistant"
      >
        <MessageCircle className="text-accent-foreground" size={26} />
      </button>
    </div>
  );
};

export default Index;
