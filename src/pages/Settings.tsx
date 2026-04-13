import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bird, User, Bell, Plane, Shield, CreditCard, LogOut,
  Save, Loader2, Crown, Wallet, RefreshCw, Lock, Trash2, Plus, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TierBadge from "@/components/TierBadge";
import NesherHeader from "@/components/NesherHeader";

interface WalletCard {
  id: string;
  card_name: string | null;
  card_issuer: string | null;
  transfer_partners: string[] | null;
  points_multiplier: any;
}

const PRESET_CARDS = [
  { card_name: "Amex Platinum", card_issuer: "American Express", points_multiplier: { travel: 5, other: 1 } },
  { card_name: "Amex Gold", card_issuer: "American Express", points_multiplier: { dining: 4, flights: 3, other: 1 } },
  { card_name: "Chase Sapphire Reserve", card_issuer: "Chase", points_multiplier: { travel: 3, other: 1 } },
  { card_name: "Chase Sapphire Preferred", card_issuer: "Chase", points_multiplier: { travel: 2, other: 1 } },
  { card_name: "Citi Premier", card_issuer: "Citi", points_multiplier: { travel: 3, other: 1 } },
  { card_name: "Capital One Venture", card_issuer: "Capital One", points_multiplier: { everything: 2 } },
  { card_name: "Discover it Miles", card_issuer: "Discover", points_multiplier: { everything: 1.5 } },
] as const;

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading, tier, subscribed, subscriptionEnd } = useAuth();
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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

  // Notifications
  const [notifDelays, setNotifDelays] = useState(true);
  const [notifGateChanges, setNotifGateChanges] = useState(true);
  const [notifBoarding, setNotifBoarding] = useState(true);
  const [notifPriceDrops, setNotifPriceDrops] = useState(true);

  // Wallet
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardIssuer, setNewCardIssuer] = useState("");

  // Auto Recovery (mandate)
  const [mandateActive, setMandateActive] = useState(false);
  const [maxAutoCharge, setMaxAutoCharge] = useState(500);

  // Privacy
  const [privAnalytics, setPrivAnalytics] = useState(() => localStorage.getItem("nesher_priv_analytics") !== "false");
  const [privLocation, setPrivLocation] = useState(() => localStorage.getItem("nesher_priv_location") !== "false");
  const [privMarketing, setPrivMarketing] = useState(() => localStorage.getItem("nesher_priv_marketing") !== "false");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    const loadAll = async () => {
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setNationality(profile.nationality || "");
        setCurrency(profile.preferred_currency || "USD");
      }

      const { data: prefs } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (prefs) {
        setSeatPref(prefs.seat_preference || "window");
        setMaxStops(prefs.max_stops ?? 1);
        setDirectOnly(prefs.pref_direct_only ?? false);
        setAutoCheckin(prefs.auto_checkin_enabled ?? false);
        setAutoRebook(prefs.auto_rebook_enabled ?? false);
        setEsimOffer(prefs.esim_auto_offer ?? true);
      }

      const { data: walletData } = await supabase.from("user_wallet").select("*").eq("user_id", user.id);
      if (walletData) setCards(walletData);

      const { data: mandate } = await supabase.from("user_mandates").select("*").eq("user_id", user.id).maybeSingle();
      if (mandate) {
        setMandateActive(mandate.mandate_active ?? false);
        setMaxAutoCharge(mandate.max_auto_charge_usd ?? 500);
      }
    };

    loadAll();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from("user_profiles").update({
      full_name: fullName, phone, nationality, preferred_currency: currency,
    }).eq("id", user.id);

    const prefsData = {
      user_id: user.id, seat_preference: seatPref, max_stops: maxStops,
      pref_direct_only: directOnly, auto_checkin_enabled: autoCheckin,
      auto_rebook_enabled: autoRebook, esim_auto_offer: esimOffer,
    };
    const { data: existingPrefs } = await supabase.from("user_preferences").select("user_id").eq("user_id", user.id).maybeSingle();
    if (existingPrefs) await supabase.from("user_preferences").update(prefsData).eq("user_id", user.id);
    else await supabase.from("user_preferences").insert(prefsData);

    // Save privacy to localStorage
    localStorage.setItem("nesher_priv_analytics", String(privAnalytics));
    localStorage.setItem("nesher_priv_location", String(privLocation));
    localStorage.setItem("nesher_priv_marketing", String(privMarketing));

    setSaving(false);
    toast.success("Settings saved!");
  };

  const handleAddPresetCard = async (preset: typeof PRESET_CARDS[number]) => {
    if (!user) return;
    // Check if already added
    if (cards.some(c => c.card_name === preset.card_name)) {
      toast.error("Card already added");
      return;
    }
    const { data, error } = await supabase.from("user_wallet").insert({
      user_id: user.id,
      card_name: preset.card_name,
      card_issuer: preset.card_issuer,
      points_multiplier: preset.points_multiplier as any,
    }).select().single();
    if (!error && data) {
      setCards([...cards, data as WalletCard]);
      setShowAddCard(false);
      toast.success(`${preset.card_name} added`);
    }
  };

  const handleRemoveCard = async (id: string) => {
    await supabase.from("user_wallet").delete().eq("id", id);
    setCards(cards.filter((c) => c.id !== id));
    toast.success("Card removed");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast.info("Account deletion request sent. We'll process it within 48 hours.");
    setShowDeleteConfirm(false);
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
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
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
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
      <div className="flex-1 min-w-0">
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
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-full hover:bg-card transition-colors">
            <Bird className="text-primary" size={24} strokeWidth={2.5} />
          </button>
          <span className="text-primary font-bold text-lg">Nesher</span>
          <span className="text-foreground font-bold text-xl">Settings</span>
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
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors" placeholder="Your full name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nationality</label>
              <input value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors" placeholder="e.g. US" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ILS">ILS</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <TierBadge tier={tier} />
          </div>
        </div>

        {/* My Cards */}
        <SectionHeader icon={Wallet} title="My Cards" />
        <p className="text-xs text-muted-foreground -mt-2 mb-3">Select the cards you own to see points earnings on flights.</p>
        <div className="bg-card rounded-2xl border border-border p-4">
          {cards.length > 0 && (
            <div className="space-y-2 mb-3">
              {cards.map((card) => {
                const mult = card.points_multiplier as Record<string, number> | null;
                const multStr = mult ? Object.entries(mult).map(([k, v]) => `${v}x ${k}`).join(", ") : "";
                return (
                  <div key={card.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-background border border-border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{card.card_name}</p>
                      <p className="text-[11px] text-muted-foreground">{card.card_issuer}{multStr ? ` · ${multStr}` : ""}</p>
                    </div>
                    <button onClick={() => handleRemoveCard(card.id)} className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors shrink-0">
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {showAddCard ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground mb-2">Select a card to add:</p>
              {PRESET_CARDS.filter(p => !cards.some(c => c.card_name === p.card_name)).map((preset) => {
                const multStr = Object.entries(preset.points_multiplier).map(([k, v]) => `${v}x ${k}`).join(", ");
                return (
                  <button
                    key={preset.card_name}
                    onClick={() => handleAddPresetCard(preset)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl border border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{preset.card_name}</p>
                      <p className="text-[11px] text-muted-foreground">{preset.card_issuer} · {multStr}</p>
                    </div>
                    <Plus size={14} className="text-primary shrink-0" />
                  </button>
                );
              })}
              <button onClick={() => setShowAddCard(false)} className="w-full py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground mt-1">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowAddCard(true)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 transition-colors">
              <Plus size={14} /> Add Card
            </button>
          )}
        </div>

        {/* Auto Recovery */}
        <SectionHeader icon={RefreshCw} title="Auto Recovery" />
        <div className="bg-card rounded-2xl border border-border px-4">
          <SettingRow label="Auto Recovery Mandate" desc="Allow Nesher to rebook automatically if your flight is cancelled">
            <Toggle checked={mandateActive} onChange={setMandateActive} />
          </SettingRow>
          {mandateActive && (
            <div className="py-3 border-b border-border last:border-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-foreground">Max Auto-Charge</p>
                <span className="text-sm font-bold text-primary">${maxAutoCharge}</span>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={maxAutoCharge}
                onChange={(e) => setMaxAutoCharge(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>$100</span>
                <span>$2,000</span>
              </div>
            </div>
          )}
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
            <select value={seatPref} onChange={(e) => setSeatPref(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground outline-none">
              <option value="window">Window</option>
              <option value="aisle">Aisle</option>
              <option value="middle">Middle</option>
            </select>
          </SettingRow>
          <SettingRow label="Max Stops">
            <select value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value))} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground outline-none">
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

        {/* Privacy Center */}
        <SectionHeader icon={Lock} title="Privacy Center" />
        <div className="bg-card rounded-2xl border border-border px-4">
          <SettingRow label="Analytics" desc="Help us improve with usage data">
            <Toggle checked={privAnalytics} onChange={setPrivAnalytics} />
          </SettingRow>
          <SettingRow label="Location" desc="Use your location for nearby airport detection">
            <Toggle checked={privLocation} onChange={setPrivLocation} />
          </SettingRow>
          <SettingRow label="Marketing" desc="Receive promotional offers and deals">
            <Toggle checked={privMarketing} onChange={setPrivMarketing} />
          </SettingRow>
        </div>
        <div className="mt-3">
          {showDeleteConfirm ? (
            <div className="bg-card rounded-2xl border border-destructive/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">Are you sure?</p>
              <p className="text-xs text-muted-foreground">This will permanently delete your account and all data. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground">Cancel</button>
                <button onClick={handleDeleteAccount} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-destructive text-destructive-foreground">Delete Account</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs text-destructive/70 hover:text-destructive transition-colors">
              <Trash2 size={14} /> Delete Account
            </button>
          )}
        </div>

        {/* Subscription */}
        <SectionHeader icon={Crown} title="Subscription" />
        <div className="bg-card rounded-2xl border border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {tier === "free" ? "Free Plan" : tier === "premium" ? "Premium" : "Business"}
                </p>
                <TierBadge tier={tier} />
              </div>
              {subscriptionEnd && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Renews {new Date(subscriptionEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {subscribed ? (
              <button onClick={handleManageSubscription} disabled={portalLoading} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
                {portalLoading ? <Loader2 size={12} className="animate-spin" /> : "Manage"}
              </button>
            ) : (
              <button onClick={() => navigate("/business")} className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-primary text-primary">
                Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <div className="mt-8 mb-4">
          <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
