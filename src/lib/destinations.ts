export interface Destination {
  iata: string;
  city: string;
  country: string;
}

export const DESTINATION_MAP: Record<string, Destination> = {
  "israel": { iata: "TLV", city: "Tel Aviv", country: "Israel" },
  "tel aviv": { iata: "TLV", city: "Tel Aviv", country: "Israel" },
  "jerusalem": { iata: "TLV", city: "Tel Aviv", country: "Israel" },
  "istanbul": { iata: "IST", city: "Istanbul", country: "Turkey" },
  "turkey": { iata: "IST", city: "Istanbul", country: "Turkey" },
  "new york": { iata: "JFK", city: "New York", country: "USA" },
  "london": { iata: "LHR", city: "London", country: "UK" },
  "paris": { iata: "CDG", city: "Paris", country: "France" },
  "rome": { iata: "FCO", city: "Rome", country: "Italy" },
  "dubai": { iata: "DXB", city: "Dubai", country: "UAE" },
  "tokyo": { iata: "NRT", city: "Tokyo", country: "Japan" },
  "athens": { iata: "ATH", city: "Athens", country: "Greece" },
};

export function parseDestination(query: string): Destination | null {
  const normalized = query.trim().toLowerCase();

  // Priority: exact match first
  if (DESTINATION_MAP[normalized]) {
    return DESTINATION_MAP[normalized];
  }

  // Partial match: check if query contains any key
  for (const [key, dest] of Object.entries(DESTINATION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return dest;
    }
  }

  return null;
}

export interface SafetyInfo {
  score: number;
  alertLevel: "normal" | "advisory" | "critical";
  eventSummary?: string;
}

export const MOCK_SAFETY: Record<string, SafetyInfo> = {
  TLV: { score: 8, alertLevel: "normal" },
  IST: { score: 5, alertLevel: "advisory", eventSummary: "Recent civil unrest reported in eastern provinces" },
  JFK: { score: 9, alertLevel: "normal" },
  LHR: { score: 9, alertLevel: "normal" },
  CDG: { score: 8, alertLevel: "normal" },
  FCO: { score: 8, alertLevel: "normal" },
  DXB: { score: 8, alertLevel: "normal" },
  NRT: { score: 9, alertLevel: "normal" },
  ATH: { score: 8, alertLevel: "normal" },
};
