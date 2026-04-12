export interface Destination {
  iata: string;
  city: string;
  airport: string;
  country: string;
  flag: string;
}

export const DESTINATION_MAP: Record<string, Destination> = {
  "israel": { iata: "TLV", city: "Tel Aviv", airport: "Ben Gurion Airport", country: "Israel", flag: "🇮🇱" },
  "tel aviv": { iata: "TLV", city: "Tel Aviv", airport: "Ben Gurion Airport", country: "Israel", flag: "🇮🇱" },
  "jerusalem": { iata: "TLV", city: "Tel Aviv", airport: "Ben Gurion Airport", country: "Israel", flag: "🇮🇱" },
  "new york": { iata: "JFK", city: "New York", airport: "John F Kennedy Intl", country: "USA", flag: "🇺🇸" },
  "nyc": { iata: "JFK", city: "New York", airport: "John F Kennedy Intl", country: "USA", flag: "🇺🇸" },
  "london": { iata: "LHR", city: "London", airport: "Heathrow Airport", country: "UK", flag: "🇬🇧" },
  "paris": { iata: "CDG", city: "Paris", airport: "Charles de Gaulle", country: "France", flag: "🇫🇷" },
  "rome": { iata: "FCO", city: "Rome", airport: "Leonardo da Vinci", country: "Italy", flag: "🇮🇹" },
  "dubai": { iata: "DXB", city: "Dubai", airport: "Dubai Intl", country: "UAE", flag: "🇦🇪" },
  "tokyo": { iata: "NRT", city: "Tokyo", airport: "Narita International", country: "Japan", flag: "🇯🇵" },
  "athens": { iata: "ATH", city: "Athens", airport: "Eleftherios Venizelos", country: "Greece", flag: "🇬🇷" },
  "istanbul": { iata: "IST", city: "Istanbul", airport: "Istanbul Airport", country: "Turkey", flag: "🇹🇷" },
  "turkey": { iata: "IST", city: "Istanbul", airport: "Istanbul Airport", country: "Turkey", flag: "🇹🇷" },
  "miami": { iata: "MIA", city: "Miami", airport: "Miami International", country: "USA", flag: "🇺🇸" },
  "los angeles": { iata: "LAX", city: "Los Angeles", airport: "LAX International", country: "USA", flag: "🇺🇸" },
  "toronto": { iata: "YYZ", city: "Toronto", airport: "Pearson International", country: "Canada", flag: "🇨🇦" },
  "amsterdam": { iata: "AMS", city: "Amsterdam", airport: "Schiphol Airport", country: "Netherlands", flag: "🇳🇱" },
  "frankfurt": { iata: "FRA", city: "Frankfurt", airport: "Frankfurt Airport", country: "Germany", flag: "🇩🇪" },
  "singapore": { iata: "SIN", city: "Singapore", airport: "Changi Airport", country: "Singapore", flag: "🇸🇬" },
};

// Get unique destinations (deduplicated by IATA)
export function getUniqueDestinations(): Destination[] {
  const seen = new Set<string>();
  const results: Destination[] = [];
  for (const dest of Object.values(DESTINATION_MAP)) {
    if (!seen.has(dest.iata)) {
      seen.add(dest.iata);
      results.push(dest);
    }
  }
  return results;
}

export function searchDestinations(query: string): Destination[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  
  const all = getUniqueDestinations();
  return all.filter(d => 
    d.city.toLowerCase().includes(q) ||
    d.country.toLowerCase().includes(q) ||
    d.iata.toLowerCase().includes(q) ||
    d.airport.toLowerCase().includes(q)
  );
}

export function parseDestination(query: string): Destination | null {
  const normalized = query.trim().toLowerCase();

  if (DESTINATION_MAP[normalized]) {
    return DESTINATION_MAP[normalized];
  }

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
  MIA: { score: 9, alertLevel: "normal" },
  LAX: { score: 9, alertLevel: "normal" },
  YYZ: { score: 9, alertLevel: "normal" },
  AMS: { score: 9, alertLevel: "normal" },
  FRA: { score: 9, alertLevel: "normal" },
  SIN: { score: 9, alertLevel: "normal" },
};
