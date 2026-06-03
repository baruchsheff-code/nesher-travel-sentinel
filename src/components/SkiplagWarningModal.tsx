import { X } from "lucide-react";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SkiplagWarningModal({ open, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fade-in" onClick={onCancel}>
      <div
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Understanding Hidden-City Fares</h2>
          <button onClick={onCancel} className="p-1 -mr-1 -mt-1 rounded-full hover:bg-background">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed mb-3">
          A hidden-city fare means booking a flight with a connection, then leaving at your connection city instead of flying the final leg.
        </p>
        <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: "rgba(231, 76, 60, 0.10)" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "#E74C3C" }}>⚠️ Important rules</p>
          <ul className="text-xs text-foreground/85 space-y-1 leading-relaxed">
            <li>• Carry-on bags only — checked bags go to the final destination</li>
            <li>• One-way tickets only — skipping a leg cancels the rest</li>
            <li>• Don't use your frequent flyer number</li>
            <li>• Use sparingly — airlines track this</li>
          </ul>
        </div>
        <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(201, 168, 76, 0.10)" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "#C9A84C" }}>🛡️ Nesher protects you</p>
          <p className="text-xs text-foreground/85 leading-relaxed">
            We automatically hide these fares if you've used one on the same airline in the last 6 months, so your frequent flyer account stays safe.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#C9A84C", color: "#0A0F1E" }}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}