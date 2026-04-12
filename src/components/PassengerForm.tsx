import { useState, useRef } from "react";
import { ArrowLeft, Loader2, User, Mail, FileText, Calendar, Globe, Camera, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PassengerData {
  firstName: string;
  lastName: string;
  email: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
}

interface PassengerFormProps {
  grandTotal: number;
  onSubmit: (data: PassengerData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const PassengerForm = ({ grandTotal, onSubmit, onBack, isSubmitting }: PassengerFormProps) => {
  const [form, setForm] = useState<PassengerData>({
    firstName: "",
    lastName: "",
    email: "",
    passportNumber: "",
    passportExpiry: "",
    nationality: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PassengerData, string>>>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.firstName.trim()) newErrors.firstName = "Required";
    else if (form.firstName.trim().length > 50) newErrors.firstName = "Max 50 characters";

    if (!form.lastName.trim()) newErrors.lastName = "Required";
    else if (form.lastName.trim().length > 50) newErrors.lastName = "Max 50 characters";

    if (!form.email.trim()) newErrors.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = "Invalid email";
    else if (form.email.trim().length > 255) newErrors.email = "Max 255 characters";

    if (!form.passportNumber.trim()) newErrors.passportNumber = "Required";
    else if (!/^[A-Z0-9]{5,15}$/i.test(form.passportNumber.trim())) newErrors.passportNumber = "5-15 alphanumeric characters";

    if (!form.passportExpiry) newErrors.passportExpiry = "Required";
    else if (new Date(form.passportExpiry) < new Date()) newErrors.passportExpiry = "Passport expired";

    if (!form.nationality.trim()) newErrors.nationality = "Required";
    else if (form.nationality.trim().length > 50) newErrors.nationality = "Max 50 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        passportNumber: form.passportNumber.trim().toUpperCase(),
        nationality: form.nationality.trim(),
      });
    }
  };

  const update = (field: keyof PassengerData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen bg-background pb-32 animate-fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="shrink-0">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground truncate flex-1">Passenger Details</h1>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">DEMO</span>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Personal Info */}
        <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User size={16} className="text-primary" />
            Personal Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="First Name"
              value={form.firstName}
              onChange={(v) => update("firstName", v)}
              error={errors.firstName}
              placeholder="John"
              maxLength={50}
            />
            <FormField
              label="Last Name"
              value={form.lastName}
              onChange={(v) => update("lastName", v)}
              error={errors.lastName}
              placeholder="Doe"
              maxLength={50}
            />
          </div>
          <FormField
            label="Email"
            type="email"
            icon={<Mail size={14} className="text-muted-foreground" />}
            value={form.email}
            onChange={(v) => update("email", v)}
            error={errors.email}
            placeholder="john@example.com"
            maxLength={255}
          />
        </div>

        {/* Passport Info */}
        <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            Passport Information
          </p>
          <FormField
            label="Passport Number"
            value={form.passportNumber}
            onChange={(v) => update("passportNumber", v)}
            error={errors.passportNumber}
            placeholder="AB1234567"
            maxLength={15}
            autoCapitalize="characters"
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Expiry Date"
              type="date"
              icon={<Calendar size={14} className="text-muted-foreground" />}
              value={form.passportExpiry}
              onChange={(v) => update("passportExpiry", v)}
              error={errors.passportExpiry}
            />
            <FormField
              label="Nationality"
              icon={<Globe size={14} className="text-muted-foreground" />}
              value={form.nationality}
              onChange={(v) => update("nationality", v)}
              error={errors.nationality}
              placeholder="US"
              maxLength={50}
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-4">
          Your details are encrypted and only used for booking. This is a demo — no real booking will be made.
        </p>
      </div>

      {/* Confirm button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 z-30 bg-background border-t border-border">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold flex flex-col items-center justify-center gap-0.5 disabled:opacity-60"
          style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <span>Confirm & Pay ${grandTotal.toLocaleString()}</span>
              <span className="text-[10px] font-normal opacity-80">Price verified live — no surprises</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const FormField = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  icon,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  maxLength?: number;
  autoCapitalize?: string;
}) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        className={`w-full rounded-xl px-3 py-2.5 text-sm bg-background text-foreground border outline-none transition-colors ${
          icon ? "pl-9" : ""
        } ${error ? "border-destructive" : "border-border focus:border-primary"}`}
      />
    </div>
    {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
  </div>
);

export default PassengerForm;
