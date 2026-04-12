import { useEffect, useState } from "react";
import { Bird } from "lucide-react";

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [phase, setPhase] = useState<"pulse" | "fade">("pulse");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fade"), 1200);
    const t2 = setTimeout(() => onDone(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${phase === "fade" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ backgroundColor: "#0A0F1E" }}
    >
      <Bird
        size={56}
        strokeWidth={2}
        className="splash-icon-pulse"
        style={{ color: "#C9A84C" }}
      />
      <span
        className="mt-4 font-bold text-2xl splash-text-fade"
        style={{ color: "#C9A84C" }}
      >
        Nesher
      </span>
    </div>
  );
};

export default SplashScreen;
