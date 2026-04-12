import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";

export interface AppNotification {
  id: string;
  type: "delay" | "gate_change" | "status" | "cancellation" | "general";
  title: string;
  message: string;
  flightNumber?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

const ICON_MAP: Record<AppNotification["type"], string> = {
  delay: "⚠️",
  gate_change: "🚪",
  status: "✈️",
  cancellation: "❌",
  general: "ℹ️",
};

const DEMO_NOTIFICATIONS: Omit<AppNotification, "id" | "timestamp" | "read">[] = [
  { type: "gate_change", title: "Gate Changed", message: "LY008 JFK→TLV gate changed from B22 to C11", flightNumber: "LY008" },
  { type: "delay", title: "Flight Delayed", message: "LY008 JFK→TLV delayed by 35 minutes. New departure: 11:06", flightNumber: "LY008" },
  { type: "status", title: "Boarding Soon", message: "LY008 JFK→TLV boarding begins in 30 minutes at Gate C11", flightNumber: "LY008" },
  { type: "gate_change", title: "Gate Update", message: "LY008 JFK→TLV final gate assignment: C11. Proceed to boarding.", flightNumber: "LY008" },
];

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const demoIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    toast(`${ICON_MAP[n.type]} ${n.title}`, { description: n.message, duration: 5000 });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  // Simulate flight status notifications every 45 seconds
  useEffect(() => {
    // Add first notification after 10 seconds
    const initialTimeout = setTimeout(() => {
      if (demoIndexRef.current < DEMO_NOTIFICATIONS.length) {
        addNotification(DEMO_NOTIFICATIONS[demoIndexRef.current]);
        demoIndexRef.current += 1;
      }
    }, 10000);

    intervalRef.current = setInterval(() => {
      if (demoIndexRef.current < DEMO_NOTIFICATIONS.length) {
        addNotification(DEMO_NOTIFICATIONS[demoIndexRef.current]);
        demoIndexRef.current += 1;
      }
    }, 45000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
