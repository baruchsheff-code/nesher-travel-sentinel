import { useLocation, useNavigate } from "react-router-dom";
import { Search, Plane, User, MessageCircle } from "lucide-react";

const tabs = [
  { path: "/", icon: Search, label: "Search" },
  { path: "/my-trips", icon: Plane, label: "Trips" },
  { path: "/settings", icon: User, label: "Profile" },
  { path: "/support", icon: MessageCircle, label: "Support" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-4 py-1 relative"
            >
              <tab.icon
                size={20}
                style={isActive ? { color: "#C9A84C" } : undefined}
                className={isActive ? "" : "text-muted-foreground"}
              />
              <span
                className="text-[10px] font-medium"
                style={isActive ? { color: "#C9A84C" } : undefined}
              >
                {isActive ? undefined : <span className="text-muted-foreground">{tab.label}</span>}
                {isActive && tab.label}
              </span>
              {/* Gold dot indicator */}
              {isActive && (
                <div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 4, height: 4, backgroundColor: "#C9A84C" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
