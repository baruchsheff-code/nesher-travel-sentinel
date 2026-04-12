import { Bird } from "lucide-react";
import { useState, useEffect } from "react";

const messages = [
  "Searching 300+ airlines...",
  "Checking live safety conditions...",
  "Calculating your points value...",
  "Finding hidden fares...",
  "Comparing split-ticket routes...",
];

export default function SearchLoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="animate-pulse">
        <Bird size={48} className="text-primary" strokeWidth={2.5} />
      </div>
      <p className="text-sm text-muted-foreground animate-fade-in transition-all" key={msgIndex}>
        {messages[msgIndex]}
      </p>
    </div>
  );
}
