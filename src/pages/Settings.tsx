import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bird, User, Bell, Plane, Shield, CreditCard, LogOut,
  ChevronRight, Save, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TierBadge from "@/components/TierBadge";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading, tier } = useAuth();
  const [saving, setSaving] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Preferences
  const [seatPref, setSeatPref] = useState("window");
  const [maxStops, setMaxStops] = useState(1);
  const [directOnly, setDirectOnly] = useState(false);
  const [autoCheckin, setAutoCheckin] = useState(false);
  const [autoRebook, setAutoRebook] = useState(false);
  const [esimOffer, setEsimOffer] = useState(true);

  // Notification prefs (local state)
  const [notifDelays, setNotifDelays] = useState(true);
  const [notifGateChanges, setNotifGateChanges] = useState(true);
  const [notifBoarding, setNotifBoarding] = useState(true);
  const [notifPriceDrops, setNotifPriceDrops] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setNationality(profile.nationality || "");
        setCurrency(profile.preferred_currency || "USD");
      }

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefs) {
        setSeatPref(prefs.seat_preference || "window");
        setMaxStops(prefs.max_stops ?? 1);
        setDirectOnly(prefs.pref_direct_only ?? false);
        setAutoCheckin(prefs.auto_checkin_enabled ?? false);
        setAutoRebook(prefs.auto_rebook_enabled ?? false);
        setEsimOffer(prefs.esim_auto_offer ?? true);
      }
    };

    loadProfile();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        full_name: fullName,
        phone,
        nationality,
        preferred_currency: currency,
      })
      .eq("id", user.id);

    const { data: existingPrefs } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const prefsData = {
      user_id: user.id,
      seat_preference: seatPref,
      max_stops: maxStops,
      pref_direct_only: directOnly,
      auto_checkin_enabled: autoCheckin,
      auto_rebook_enabled: autoRebook,
      esim_auto_offer: esimOffer,
    };

    if (existingPrefs) {
      await supabase.from("user_preferences").update(prefsData).eq("user_id", user.id);
    } else {
      await supabase.from("user_preferences").insert(prefsData);
    }

    setSaving(false);
    if (profileError) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Settings saved!");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background px-4 flex flex-col items-center justify-center gap-4">
        <User size={48} className="text-muted-foreground opacity-30" />
        <p className="text-muted-foreground text-sm">Sign in to manage settings</p>
        <button onClick={() => navigate("/auth")} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
          Sign In
        </button>
      </div>
    );
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? "hsl(var(--primary))" : "hsl(var(--border))" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );

  const SectionHeader = ({ icon: Icon, title }: { icon: typeof User; title: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-8 first:mt-0">
      <Icon size={16} className="text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );

  const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 pb-8">
      {/* Header */}
      <div className="pt-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-card transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Bird className="text-primary" size={24} strokeWidth={2.5} />
            <span className="text-foreground font-bold text-xl">Settings</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>

      <div className="max-w-md mx-auto">
        {/* Profile */}
        <SectionHeader icon={User} title="Profile" />
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nationality</label>
              <input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                placeholder="e.g. US"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ILS">ILS</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <TierBadge tier={tier} />
          </div>

        {/* Notifications */}
        <SectionHeader icon={Bell} title="Notifications" />
        <div className="bg-card rounded-2xl border border-border px-4">
          <SettingRow label="Flight Delays" desc="Get alerted when your flight is delayed">
            <Toggle checked={notifDelays} onChange={setNotifDelays} />
          </SettingRow>
          <SettingRow label="Gate Changes" desc="Know immediately when your gate changes">
            <Toggle checked={notifGateChanges} onChange={setNotifGateChanges} />
          </SettingRow>
          <SettingRow label="Boarding Alerts" desc="Reminder when boarding begins">
            <Toggle checked={notifBoarding} onChange={setNotifBoarding} />
          </SettingRow>
          <SettingRow label="Price Drops" desc="Alert when a watched route drops in price">
            <Toggle checked={notifPriceDrops} onChange={setNotifPriceDrops} />
          </SettingRow>
        </div>

        {/* Flight Preferences */}
        <SectionHeader icon={Plane} title="Flight Preferences" />
        <div className="bg-card rounded-2xl border border-border px-4">
          <SettingRow label="Seat Preference">
            <select
              value={seatPref}
              onChange={(e) => setSeatPref(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground outline-none"
            >
              <option value="window">Window</option>
              <option value="aisle">Aisle</option>
              <option value="middle">Middle</option>
            </select>
          </SettingRow>
          <SettingRow label="Max Stops">
            <select
              value={maxStops}
              onChange={(e) => setMaxStops(Number(e.target.value))}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground outline-none"
            >
              <option value={0}>Direct only</option>
              <option value={1}>1 stop</option>
              <option value={2}>2 stops</option>
            </select>
          </SettingRow>
          <SettingRow label="Direct Flights Only" desc="Only show non-stop options">
            <Toggle checked={directOnly} onChange={setDirectOnly} />
          </SettingRow>
        </div>

        {/* Smart Features */}
        <SectionHeader icon={Shield} title="Smart Features" />
        <div className="bg-card rounded-2xl border border-border px-4">
          <SettingRow label="Auto Check-in" desc="Automatically check in 24h before departure">
            <Toggle checked={autoCheckin} onChange={setAutoCheckin} />
          </SettingRow>
          <SettingRow label="Auto Re-book" desc="Automatically rebook if flight is cancelled">
            <Toggle checked={autoRebook} onChange={setAutoRebook} />
          </SettingRow>
          <SettingRow label="eSIM Offers" desc="Suggest travel eSIM for international flights">
            <Toggle checked={esimOffer} onChange={setEsimOffer} />
          </SettingRow>
        </div>

        {/* Account */}
        <div className="mt-8 mb-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
