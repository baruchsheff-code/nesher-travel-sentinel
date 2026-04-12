import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, Plane, AlertTriangle, DoorOpen, X, Info } from "lucide-react";
import { useNotifications, type AppNotification } from "@/contexts/NotificationContext";

const TYPE_ICON: Record<AppNotification["type"], typeof Plane> = {
  delay: AlertTriangle,
  gate_change: DoorOpen,
  status: Plane,
  cancellation: X,
  general: Info,
};

const TYPE_COLOR: Record<AppNotification["type"], string> = {
  delay: "#fbbc04",
  gate_change: "hsl(var(--primary))",
  status: "#34a853",
  cancellation: "hsl(var(--destructive))",
  general: "hsl(var(--muted-foreground))",
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-card transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "hsl(var(--destructive))", color: "white", padding: "0 4px" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-lg overflow-hidden z-50 animate-fade-in"
          style={{ animationDuration: "0.2s", maxHeight: 420 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="p-1.5 rounded-lg hover:bg-background transition-colors" title="Mark all read">
                  <Check size={14} className="text-muted-foreground" />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="p-1.5 rounded-lg hover:bg-background transition-colors" title="Clear all">
                  <Trash2 size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="text-muted-foreground mx-auto opacity-30 mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type];
                const color = TYPE_COLOR[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-background/50 transition-colors border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 opacity-60">{timeAgo(n.timestamp)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
