import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bird, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-8">
        <Bird className="text-primary" size={28} strokeWidth={2.5} />
        <span className="text-primary font-bold text-2xl">Nesher</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Set new password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your new password below</p>
      <form onSubmit={handleReset} className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
            className="w-full rounded-xl pl-10 pr-3 py-3 text-sm bg-card text-foreground outline-none"
            style={{ border: "1px solid hsl(var(--border))" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
