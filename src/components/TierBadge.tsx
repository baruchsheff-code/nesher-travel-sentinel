import type { TierKey } from "@/lib/subscriptionTiers";

const TierBadge = ({ tier }: { tier: TierKey }) => {
  if (tier === "free") return null;

  if (tier === "premium") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: "rgba(201, 168, 76, 0.15)", color: "#C9A84C" }}
      >
        ✦ Premium
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "rgba(30, 58, 138, 0.2)", color: "#93C5FD" }}
    >
      ◆ Business
    </span>
  );
};

export default TierBadge;
