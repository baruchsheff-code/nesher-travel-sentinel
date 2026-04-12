import { useState, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";

interface SeatSelectorProps {
  selectedSeat: string | null;
  onSelect: (seat: string) => void;
  cabinClass?: string;
}

type SeatStatus = "available" | "occupied" | "premium" | "exit";

interface SeatInfo {
  id: string;
  status: SeatStatus;
  price: number;
}

const COLUMNS = ["A", "B", "C", "", "D", "E", "F"];

function generateSeats(rows: number): Record<string, SeatInfo> {
  const seats: Record<string, SeatInfo> = {};
  const exitRows = [12, 13];
  // Deterministic "occupied" pattern from a seed
  const occupied = new Set([
    "1A", "1B", "1D", "2C", "2E", "3A", "3F", "4B", "4D", "5A", "5E",
    "6C", "6F", "7A", "7B", "8D", "8E", "9A", "9C", "10F", "11B",
    "12A", "13D", "14E", "15A", "15C", "16F", "17B", "18A", "18D",
    "19E", "20C", "21A", "22F", "23B", "24D", "25A", "25E",
  ]);

  for (let row = 1; row <= rows; row++) {
    for (const col of COLUMNS) {
      if (col === "") continue;
      const id = `${row}${col}`;
      const isExit = exitRows.includes(row);
      const isPremium = row <= 4;

      if (occupied.has(id)) {
        seats[id] = { id, status: "occupied", price: 0 };
      } else if (isExit) {
        seats[id] = { id, status: "exit", price: 35 };
      } else if (isPremium) {
        seats[id] = { id, status: "premium", price: 25 };
      } else {
        seats[id] = { id, status: "available", price: 0 };
      }
    }
  }
  return seats;
}

const TOTAL_ROWS = 30;

const SeatSelector = ({ selectedSeat, onSelect, cabinClass }: SeatSelectorProps) => {
  const seats = useMemo(() => generateSeats(TOTAL_ROWS), []);
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? TOTAL_ROWS : 15;

  const statusStyle = (seat: SeatInfo, isSelected: boolean): React.CSSProperties => {
    if (isSelected) return { backgroundColor: "hsl(var(--primary))", border: "2px solid hsl(var(--primary))" };
    switch (seat.status) {
      case "occupied": return { backgroundColor: "hsl(var(--muted))", border: "1px solid transparent", opacity: 0.4 };
      case "premium": return { backgroundColor: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" };
      case "exit": return { backgroundColor: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)" };
      default: return { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" };
    }
  };

  const selectedInfo = selectedSeat ? seats[selectedSeat] : null;

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <p className="text-sm font-semibold text-foreground mb-1">Select Your Seat</p>
      <p className="text-xs text-muted-foreground mb-4">
        {cabinClass || "Economy"} · {Object.values(seats).filter(s => s.status !== "occupied").length} seats available
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <LegendDot color="hsl(var(--card))" border="hsl(var(--border))" label="Available" />
        <LegendDot color="hsl(var(--primary) / 0.15)" border="hsl(var(--primary) / 0.3)" label="Premium +$25" />
        <LegendDot color="rgba(34, 197, 94, 0.15)" border="rgba(34, 197, 94, 0.3)" label="Exit Row +$35" />
        <LegendDot color="hsl(var(--muted))" border="transparent" label="Taken" opacity={0.4} />
      </div>

      {/* Column headers */}
      <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: "24px repeat(7, 1fr)" }}>
        <div />
        {COLUMNS.map((col, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">
            {col || ""}
          </div>
        ))}
      </div>

      {/* Seat grid */}
      <div className="space-y-1">
        {Array.from({ length: visibleRows }, (_, i) => i + 1).map((row) => (
          <div key={row} className="grid gap-1 items-center" style={{ gridTemplateColumns: "24px repeat(7, 1fr)" }}>
            <span className="text-[10px] text-muted-foreground text-center">{row}</span>
            {COLUMNS.map((col, ci) => {
              if (col === "") return <div key={ci} className="w-full" />;
              const seatId = `${row}${col}`;
              const seat = seats[seatId];
              if (!seat) return <div key={ci} />;
              const isSelected = selectedSeat === seatId;
              const isOccupied = seat.status === "occupied";

              return (
                <button
                  key={ci}
                  disabled={isOccupied}
                  onClick={() => onSelect(seatId)}
                  className="aspect-square rounded-md flex items-center justify-center transition-all duration-150 disabled:cursor-not-allowed"
                  style={{
                    ...statusStyle(seat, isSelected),
                    maxWidth: 36,
                    maxHeight: 36,
                  }}
                  title={isOccupied ? "Taken" : `Seat ${seatId}${seat.price ? ` (+$${seat.price})` : ""}`}
                >
                  {isSelected && <CheckCircle2 size={12} className="text-primary-foreground" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {!showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-3 py-2 text-xs font-medium text-primary hover:underline"
        >
          Show all {TOTAL_ROWS} rows
        </button>
      )}

      {/* Selected seat info */}
      {selectedInfo && (
        <div className="mt-4 flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
          <div>
            <p className="text-sm font-semibold text-foreground">Seat {selectedSeat}</p>
            <p className="text-xs text-muted-foreground">
              {selectedInfo.status === "premium" ? "Extra legroom" : selectedInfo.status === "exit" ? "Exit row · Extra legroom" : "Standard seat"}
              {selectedInfo.status === "exit" && " · Emergency exit duties apply"}
            </p>
          </div>
          {selectedInfo.price > 0 ? (
            <span className="text-sm font-bold text-primary">+${selectedInfo.price}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Free</span>
          )}
        </div>
      )}
    </div>
  );
};

const LegendDot = ({ color, border, label, opacity }: { color: string; border: string; label: string; opacity?: number }) => (
  <div className="flex items-center gap-1.5">
    <div
      className="w-3 h-3 rounded-sm"
      style={{ backgroundColor: color, border: `1px solid ${border}`, opacity: opacity ?? 1 }}
    />
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);

export default SeatSelector;
