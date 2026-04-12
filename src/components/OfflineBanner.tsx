import { WifiOff } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";

const OfflineBanner = () => {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium animate-fade-in"
      style={{ backgroundColor: "rgba(251, 188, 4, 0.15)", color: "#fbbc04", borderBottom: "1px solid rgba(251, 188, 4, 0.3)" }}
    >
      <WifiOff size={14} />
      Offline mode — showing saved trip data
    </div>
  );
};

export default OfflineBanner;
