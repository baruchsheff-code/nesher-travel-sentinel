import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plane, AlertTriangle, ShieldAlert, Ticket, Eye, UserCheck,
  RefreshCw, Phone, Lock, Activity, MessageSquare, Send
} from "lucide-react";

// ─── Mock data ───────────────────────────────────────────────

const MOCK_TRIPS = [
  { id: "1", traveler: "Sarah Chen", route: "JFK → TLV", departs: "2026-04-12 14:30", status: "on_time", riskLevel: "Normal", type: "standard", isSelfTransfer: false, safetyScore: 8, phone: "+1-555-0101", hasEmergencyTicket: false },
  { id: "2", traveler: "Marco Rossi", route: "LHR → IST → TBS", departs: "2026-04-12 09:15", status: "delayed", riskLevel: "Self-Transfer", type: "self-transfer", isSelfTransfer: true, safetyScore: 7, phone: "+39-555-0202", hasEmergencyTicket: false },
  { id: "3", traveler: "Aisha Patel", route: "SFO → BEY", departs: "2026-04-12 22:00", status: "on_time", riskLevel: "Crisis Route", type: "standard", isSelfTransfer: false, safetyScore: 4, phone: "+1-555-0303", hasEmergencyTicket: false },
  { id: "4", traveler: "James O'Brien", route: "CDG → KHI", departs: "2026-04-12 16:45", status: "cancelled", riskLevel: "Emergency", type: "standard", isSelfTransfer: false, safetyScore: 3, phone: "+33-555-0404", hasEmergencyTicket: true },
  { id: "5", traveler: "Yuki Tanaka", route: "NRT → LAX", departs: "2026-04-13 08:00", status: "on_time", riskLevel: "Normal", type: "standard", isSelfTransfer: false, safetyScore: 9, phone: "+81-555-0505", hasEmergencyTicket: false },
  { id: "6", traveler: "Elena Volkov", route: "DME → DXB → BOM", departs: "2026-04-12 11:20", status: "delayed", riskLevel: "Self-Transfer", type: "self-transfer", isSelfTransfer: true, safetyScore: 5, phone: "+7-555-0606", hasEmergencyTicket: false },
];

const MOCK_TICKETS = [
  { id: "t1", passenger: "James O'Brien", triggerType: "cancellation", priority: "emergency", timeOpen: "12m", status: "open", assignedAgent: null },
  { id: "t2", passenger: "Marco Rossi", triggerType: "user_request", priority: "high", timeOpen: "1h 23m", status: "open", assignedAgent: null },
  { id: "t3", passenger: "Aisha Patel", triggerType: "fraud_flag", priority: "normal", timeOpen: "3h 10m", status: "open", assignedAgent: "Agent Smith" },
];

const MOCK_ESCALATIONS = [
  { time: "14:22", user: "James O'Brien", trigger: "flight cancelled, no alternatives found" },
  { time: "13:55", user: "Marco Rossi", trigger: "connection time < 60min after delay" },
  { time: "12:30", user: "Aisha Patel", trigger: "destination safety score dropped to 4" },
  { time: "11:15", user: "Elena Volkov", trigger: "self-transfer connection at risk, delay >45min" },
  { time: "09:40", user: "System", trigger: "IST airport ground stop — 3 bookings affected" },
];

const MOCK_CHAT: Record<string, { role: string; text: string; time: string }[]> = {
  "1": [
    { role: "user", text: "Will my flight be on time?", time: "13:00" },
    { role: "ai", text: "Yes, your JFK→TLV flight is currently on schedule.", time: "13:01" },
  ],
  "4": [
    { role: "user", text: "My flight was cancelled! What do I do?", time: "14:10" },
    { role: "ai", text: "I'm sorry about that. Let me find alternatives for you.", time: "14:11" },
    { role: "ai", text: "I couldn't find automatic alternatives. Escalating to a human agent.", time: "14:12" },
  ],
};

const AGENTS = ["Agent Smith", "Agent Johnson", "Agent Williams"];

// ─── Helpers ─────────────────────────────────────────────────

function getRowColor(trip: typeof MOCK_TRIPS[0]) {
  if (trip.status === "cancelled" || trip.safetyScore < 4 || trip.hasEmergencyTicket) return "border-l-4 border-l-red-500 bg-red-500/5";
  if (trip.status === "delayed" || trip.isSelfTransfer || trip.safetyScore < 6) return "border-l-4 border-l-amber-500 bg-amber-500/5";
  return "border-l-4 border-l-emerald-500 bg-emerald-500/5";
}

function getRiskBadge(level: string) {
  switch (level) {
    case "Emergency": return <Badge className="bg-red-600 text-white animate-pulse">Emergency</Badge>;
    case "Crisis Route": return <Badge className="bg-red-500 text-white">Crisis Route</Badge>;
    case "Self-Transfer": return <Badge className="bg-amber-500 text-black">Self-Transfer</Badge>;
    default: return <Badge className="bg-emerald-600 text-white">Normal</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
    case "delayed": return <Badge className="bg-amber-500 text-black">Delayed</Badge>;
    default: return <Badge className="bg-emerald-600 text-white">On Time</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "emergency": return <Badge className="bg-red-600 text-white animate-pulse">Emergency</Badge>;
    case "high": return <Badge className="bg-amber-500 text-black">High</Badge>;
    default: return <Badge className="bg-muted text-muted-foreground">Normal</Badge>;
  }
}

// ─── Main Component ──────────────────────────────────────────

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Dashboard state
  const [trips] = useState(MOCK_TRIPS);
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Modals
  const [chatModal, setChatModal] = useState<string | null>(null);
  const [phoneModal, setPhoneModal] = useState<string | null>(null);
  const [rebookModal, setRebookModal] = useState<string | null>(null);

  // Ticket quick reply
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const hasEmergency = tickets.some(t => t.priority === "emergency" && t.status === "open");

  const handleVerify = async () => {
    setVerifying(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.functions.invoke("admin-verify", {
        body: { password },
      });
      if (error) throw error;
      if (data?.authorized) {
        setAuthorized(true);
      } else {
        setAuthError(data?.error || "Access denied");
      }
    } catch (e: any) {
      setAuthError(e.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const refreshData = useCallback(() => {
    setLastRefresh(new Date());
    // In production, refetch from DB here
  }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!authorized) return;
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [authorized, refreshData]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">Loading...</div>;
  }

  // ─── Password Gate ───────────────────────────────────────

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-[#1A2332] border-[#2A3442]">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-10 w-10 text-[#C9A84C] mb-2" />
            <CardTitle className="text-white">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="bg-[#0A0F1E] border-[#2A3442] text-white"
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <Button onClick={handleVerify} disabled={verifying} className="w-full bg-[#C9A84C] text-black hover:bg-[#B8973B]">
              {verifying ? "Verifying..." : "Enter Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Stats ───────────────────────────────────────────────

  const activeTrips = trips.filter(t => t.status !== "cancelled").length;
  const openTickets = tickets.filter(t => t.status === "open").length;
  const monitoredFlights = trips.length;
  const disruptionsToday = trips.filter(t => t.status === "delayed" || t.status === "cancelled").length;

  const stats = [
    { label: "Active Trips", value: activeTrips, icon: Plane, hasAlert: hasEmergency },
    { label: "Open Tickets", value: openTickets, icon: Ticket },
    { label: "Flights Monitored", value: monitoredFlights, icon: Activity },
    { label: "Disruptions Today", value: disruptionsToday, icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <div className="border-b border-[#2A3442] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-[#C9A84C]" />
          <h1 className="text-xl font-bold">Nesher Admin</h1>
          {hasEmergency && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-[#8899AA]">
          <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
          <Button variant="outline" size="sm" onClick={refreshData} className="border-[#2A3442] text-[#8899AA] hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 p-6">
        {stats.map((s) => (
          <Card key={s.label} className="bg-[#1A2332] border-[#2A3442]">
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className="h-8 w-8 text-[#C9A84C]" />
              <div>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  {s.value}
                  {s.hasAlert && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </p>
                <p className="text-sm text-[#8899AA]">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-6 px-6 pb-6" style={{ height: "calc(100vh - 220px)" }}>
        {/* Left: Trips table + Escalation feed */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Live Trips Table */}
          <Card className="bg-[#1A2332] border-[#2A3442] flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Live Trips</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-[#0A0F1E] sticky top-0">
                  <tr className="text-[#8899AA] text-left">
                    <th className="px-4 py-3">Traveler</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Departs</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Risk Level</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id} className={`${getRowColor(trip)} hover:bg-white/5 transition-colors`}>
                      <td className="px-4 py-3 font-medium text-white">{trip.traveler}</td>
                      <td className="px-4 py-3 text-[#8899AA] font-mono text-xs">{trip.route}</td>
                      <td className="px-4 py-3 text-[#8899AA]">{new Date(trip.departs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3">{getStatusBadge(trip.status)}</td>
                      <td className="px-4 py-3">{getRiskBadge(trip.riskLevel)}</td>
                      <td className="px-4 py-3 text-[#8899AA] capitalize">{trip.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8899AA] hover:text-white" onClick={() => setChatModal(trip.id)} title="View Chat">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8899AA] hover:text-[#C9A84C]" title="Take Over">
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8899AA] hover:text-white" onClick={() => setRebookModal(trip.id)} title="Rebook">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8899AA] hover:text-emerald-400" onClick={() => setPhoneModal(trip.id)} title="Call">
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Auto-Escalation Feed */}
          <Card className="bg-[#1A2332] border-[#2A3442] h-48 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#C9A84C]" /> Auto-Escalation Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 px-4 pb-4">
              {MOCK_ESCALATIONS.map((esc, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-[#2A3442] last:border-0 text-sm">
                  <span className="text-[#C9A84C] font-mono shrink-0">{esc.time}</span>
                  <span className="text-[#8899AA]">AI escalated <span className="text-white font-medium">{esc.user}</span> — trigger: <span className="text-amber-400">"{esc.trigger}"</span></span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Support Tickets */}
        <Card className="bg-[#1A2332] border-[#2A3442] w-96 flex flex-col shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Support Tickets ({openTickets})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-4">
            {[...tickets]
              .sort((a, b) => {
                const order: Record<string, number> = { emergency: 0, high: 1, normal: 2 };
                return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
              })
              .map((ticket) => (
                <Card key={ticket.id} className="bg-[#0A0F1E] border-[#2A3442]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">{ticket.passenger}</span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="text-xs text-[#8899AA] space-y-1">
                      <p>Trigger: <span className="text-white capitalize">{ticket.triggerType.replace("_", " ")}</span></p>
                      <p>Open: <span className="text-white">{ticket.timeOpen}</span></p>
                    </div>
                    <Select
                      value={ticket.assignedAgent || ""}
                      onValueChange={(v) => {
                        setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, assignedAgent: v } : t));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-[#1A2332] border-[#2A3442] text-[#8899AA]">
                        <SelectValue placeholder="Assign agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Quick reply..."
                        value={replyTexts[ticket.id] || ""}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        className="text-xs h-16 bg-[#1A2332] border-[#2A3442] text-white resize-none"
                      />
                      <Button size="icon" className="h-16 bg-[#C9A84C] text-black hover:bg-[#B8973B] shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Chat Modal */}
      <Dialog open={!!chatModal} onOpenChange={() => setChatModal(null)}>
        <DialogContent className="bg-[#1A2332] border-[#2A3442] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Transcript — {trips.find(t => t.id === chatModal)?.traveler}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64">
            {(MOCK_CHAT[chatModal || ""] || [{ role: "system", text: "No chat history available.", time: "" }]).map((msg, i) => (
              <div key={i} className={`mb-3 p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-[#0A0F1E] ml-8" : "bg-[#2A3442] mr-8"}`}>
                <div className="flex justify-between text-xs text-[#8899AA] mb-1">
                  <span className="capitalize font-medium">{msg.role}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="text-white">{msg.text}</p>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Phone Modal */}
      <Dialog open={!!phoneModal} onOpenChange={() => setPhoneModal(null)}>
        <DialogContent className="bg-[#1A2332] border-[#2A3442] text-white max-w-xs">
          <DialogHeader>
            <DialogTitle>Call Passenger</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3">
            <p className="text-lg font-medium">{trips.find(t => t.id === phoneModal)?.traveler}</p>
            <p className="text-2xl font-mono text-[#C9A84C]">{trips.find(t => t.id === phoneModal)?.phone}</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">
              <Phone className="h-4 w-4 mr-2" /> Initiate Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rebook Modal */}
      <Dialog open={!!rebookModal} onOpenChange={() => setRebookModal(null)}>
        <DialogContent className="bg-[#1A2332] border-[#2A3442] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Rebook — {trips.find(t => t.id === rebookModal)?.traveler}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-[#8899AA]">
              <p>Current route: <span className="text-white font-mono">{trips.find(t => t.id === rebookModal)?.route}</span></p>
            </div>
            <Input placeholder="New origin" className="bg-[#0A0F1E] border-[#2A3442] text-white" />
            <Input placeholder="New destination" className="bg-[#0A0F1E] border-[#2A3442] text-white" />
            <Input type="datetime-local" className="bg-[#0A0F1E] border-[#2A3442] text-white" />
            <Button className="w-full bg-[#C9A84C] text-black hover:bg-[#B8973B]">Search & Rebook</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
