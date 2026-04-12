// Offline trip data store using IndexedDB

const DB_NAME = "nesher-offline";
const DB_VERSION = 1;
const STORE_NAME = "trip-cache";

export interface OfflineTripData {
  bookingId: string;
  lastSynced: string; // ISO date
  boardingPass: {
    barcodeData: string; // raw barcode string for QR rendering
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    gate: string;
    terminal: string;
    seat: string;
    pnr: string;
    passengerName: string;
  };
  itinerary: {
    pnrs: { leg: number; pnr: string; airline: string }[];
    confirmationCode: string;
    airlinePhones: { airline: string; phone: string }[];
  };
  hotel: {
    name: string;
    address: string;
    checkIn: string;
    checkOut: string;
    confirmationNumber: string;
    phone: string;
  } | null;
  emergency: {
    police: string;
    ambulance: string;
    fire: string;
    embassy: string;
    embassyPhone: string;
  };
  hospitals: { name: string; address: string; phone: string; distanceKm: number }[];
  visa: {
    required: boolean;
    summary: string;
    maxStayDays: number;
    notes: string;
  };
  safety: {
    level: string;
    score: number;
    advisory: string;
    lastUpdated: string;
  };
  support: {
    phone: string;
    whatsapp: string;
    email: string;
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "bookingId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTripOffline(data: OfflineTripData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTripOffline(bookingId: string): Promise<OfflineTripData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(bookingId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOfflineTrips(): Promise<OfflineTripData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTripOffline(bookingId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(bookingId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Mock data generators for offline caching
const EMERGENCY_DATA: Record<string, OfflineTripData["emergency"]> = {
  IL: { police: "100", ambulance: "101", fire: "102", embassy: "US Embassy Tel Aviv", embassyPhone: "+972-3-519-7475" },
  TR: { police: "155", ambulance: "112", fire: "110", embassy: "US Embassy Ankara", embassyPhone: "+90-312-455-5555" },
  FR: { police: "17", ambulance: "15", fire: "18", embassy: "US Embassy Paris", embassyPhone: "+33-1-43-12-22-22" },
  GB: { police: "999", ambulance: "999", fire: "999", embassy: "US Embassy London", embassyPhone: "+44-20-7499-9000" },
  JP: { police: "110", ambulance: "119", fire: "119", embassy: "US Embassy Tokyo", embassyPhone: "+81-3-3224-5000" },
  IT: { police: "113", ambulance: "118", fire: "115", embassy: "US Embassy Rome", embassyPhone: "+39-06-46741" },
  DE: { police: "110", ambulance: "112", fire: "112", embassy: "US Embassy Berlin", embassyPhone: "+49-30-8305-0" },
  ES: { police: "091", ambulance: "061", fire: "080", embassy: "US Embassy Madrid", embassyPhone: "+34-91-587-2200" },
};

const COUNTRY_MAP: Record<string, string> = {
  TLV: "IL", IST: "TR", CDG: "FR", LHR: "GB", NRT: "JP", FCO: "IT", FRA: "DE", BCN: "ES",
};

const HOSPITAL_DATA: Record<string, OfflineTripData["hospitals"]> = {
  TLV: [
    { name: "Ichilov Hospital", address: "6 Weizmann St, Tel Aviv", phone: "+972-3-697-4444", distanceKm: 2.1 },
    { name: "Assuta Medical Center", address: "20 Habarzel St", phone: "+972-3-764-4444", distanceKm: 4.3 },
    { name: "Sheba Medical Center", address: "Tel Hashomer", phone: "+972-3-530-3030", distanceKm: 8.7 },
  ],
  IST: [
    { name: "American Hospital", address: "Güzelbahçe Sok, Nişantaşı", phone: "+90-212-444-3777", distanceKm: 3.2 },
    { name: "Acıbadem Maslak", address: "Büyükdere Cd, Maslak", phone: "+90-212-304-4444", distanceKm: 5.1 },
    { name: "Memorial Şişli", address: "Piyalepaşa Bulvarı", phone: "+90-212-314-6666", distanceKm: 4.8 },
  ],
  CDG: [
    { name: "Hôpital Américain", address: "63 Bd Victor Hugo, Neuilly", phone: "+33-1-46-41-25-25", distanceKm: 6.2 },
    { name: "Hôpital Saint-Louis", address: "1 Av Claude Vellefaux", phone: "+33-1-42-49-49-49", distanceKm: 8.1 },
    { name: "Hôpital Pitié-Salpêtrière", address: "47 Bd de l'Hôpital", phone: "+33-1-42-16-00-00", distanceKm: 10.3 },
  ],
};

const VISA_DATA: Record<string, OfflineTripData["visa"]> = {
  IL: { required: false, summary: "US citizens: visa-free for up to 90 days", maxStayDays: 90, notes: "Must have 6 months passport validity" },
  TR: { required: true, summary: "US citizens: e-Visa required ($50, multiple entry)", maxStayDays: 90, notes: "Apply at evisa.gov.tr before travel" },
  FR: { required: false, summary: "US citizens: visa-free Schengen zone, up to 90 days", maxStayDays: 90, notes: "Schengen 90/180 day rule applies" },
  GB: { required: false, summary: "US citizens: visa-free for up to 6 months", maxStayDays: 180, notes: "Electronic Travel Authorisation (ETA) may be required" },
  JP: { required: false, summary: "US citizens: visa-free for up to 90 days", maxStayDays: 90, notes: "Return/onward ticket may be required" },
  IT: { required: false, summary: "US citizens: visa-free Schengen zone, up to 90 days", maxStayDays: 90, notes: "Schengen 90/180 day rule applies" },
  DE: { required: false, summary: "US citizens: visa-free Schengen zone, up to 90 days", maxStayDays: 90, notes: "Schengen 90/180 day rule applies" },
  ES: { required: false, summary: "US citizens: visa-free Schengen zone, up to 90 days", maxStayDays: 90, notes: "Schengen 90/180 day rule applies" },
};

const SAFETY_DATA: Record<string, OfflineTripData["safety"]> = {
  IL: { level: "Exercise Caution", score: 72, advisory: "Heightened security in border areas. Tel Aviv metro area generally safe for tourists.", lastUpdated: new Date().toISOString() },
  TR: { level: "Exercise Caution", score: 78, advisory: "Istanbul is generally safe. Avoid border regions. Petty crime in tourist areas.", lastUpdated: new Date().toISOString() },
  FR: { level: "Standard", score: 85, advisory: "Pickpocketing common near tourist sites. Be vigilant on public transport.", lastUpdated: new Date().toISOString() },
  GB: { level: "Standard", score: 88, advisory: "Low risk. Be aware of pickpockets in central London tourist areas.", lastUpdated: new Date().toISOString() },
  JP: { level: "Low Risk", score: 92, advisory: "Very safe for travelers. Natural disaster preparedness advisable.", lastUpdated: new Date().toISOString() },
  IT: { level: "Standard", score: 82, advisory: "Pickpocketing in Rome/Naples tourist areas. Generally safe.", lastUpdated: new Date().toISOString() },
  DE: { level: "Low Risk", score: 90, advisory: "Very safe. Standard precautions apply in major cities.", lastUpdated: new Date().toISOString() },
  ES: { level: "Standard", score: 80, advisory: "Pickpocketing in Barcelona/Madrid. Beach theft. Generally safe.", lastUpdated: new Date().toISOString() },
};

const HOTEL_MOCK: Record<string, OfflineTripData["hotel"]> = {
  TLV: { name: "The Norman Tel Aviv", address: "23-25 Nachmani St", checkIn: "15:00", checkOut: "11:00", confirmationNumber: "NRM-8842910", phone: "+972-3-543-5555" },
  IST: { name: "Four Seasons Sultanahmet", address: "Tevkifhane Sok 1", checkIn: "15:00", checkOut: "12:00", confirmationNumber: "FS-IST-44201", phone: "+90-212-402-3000" },
  CDG: { name: "Le Marais Boutique Hotel", address: "12 Rue de Birague", checkIn: "14:00", checkOut: "11:00", confirmationNumber: "LMB-77201", phone: "+33-1-42-72-34-12" },
};

const AIRLINE_PHONES: Record<string, string> = {
  "El Al": "+1-800-223-6700",
  "Turkish Airlines": "+1-800-874-8875",
  "Air France": "+1-800-237-2747",
  "Lufthansa": "+1-800-645-3880",
  "British Airways": "+1-800-247-9297",
  "Delta": "+1-800-221-1212",
  "United": "+1-800-864-8331",
  "American": "+1-800-433-7300",
};

export function buildOfflineTripData(
  booking: {
    id: string;
    booking_legs: {
      airline_name: string | null;
      airline_code: string | null;
      flight_number: string | null;
      origin_iata: string | null;
      destination_iata: string | null;
      departure_time: string | null;
      arrival_time: string | null;
      gate: string | null;
      terminal: string | null;
      seat_number: string | null;
      pnr: string | null;
      leg_number: number | null;
    }[];
  },
  passengerName: string = "Traveler"
): OfflineTripData {
  const firstLeg = booking.booking_legs[0];
  const destIata = firstLeg?.destination_iata || "TLV";
  const countryCode = COUNTRY_MAP[destIata] || "US";

  const barcodeData = `M1${passengerName.toUpperCase().padEnd(20)}E${firstLeg?.pnr || "XXXXXXX"}${firstLeg?.origin_iata || "JFK"}${destIata}${firstLeg?.airline_code || "XX"}${firstLeg?.flight_number?.replace(/\D/g, "") || "0000"}${firstLeg?.seat_number || "00A"}`;

  return {
    bookingId: booking.id,
    lastSynced: new Date().toISOString(),
    boardingPass: {
      barcodeData,
      airline: firstLeg?.airline_name || "Unknown",
      flightNumber: firstLeg?.flight_number || "—",
      origin: firstLeg?.origin_iata || "—",
      destination: destIata,
      departureTime: firstLeg?.departure_time || "",
      arrivalTime: firstLeg?.arrival_time || "",
      gate: firstLeg?.gate || "—",
      terminal: firstLeg?.terminal || "—",
      seat: firstLeg?.seat_number || "—",
      pnr: firstLeg?.pnr || "—",
      passengerName,
    },
    itinerary: {
      pnrs: booking.booking_legs.map((l) => ({
        leg: l.leg_number || 1,
        pnr: l.pnr || "—",
        airline: l.airline_name || "—",
      })),
      confirmationCode: firstLeg?.pnr || "—",
      airlinePhones: booking.booking_legs
        .map((l) => ({
          airline: l.airline_name || "Unknown",
          phone: AIRLINE_PHONES[l.airline_name || ""] || "+1-800-000-0000",
        }))
        .filter((v, i, a) => a.findIndex((t) => t.airline === v.airline) === i),
    },
    hotel: HOTEL_MOCK[destIata] || null,
    emergency: EMERGENCY_DATA[countryCode] || EMERGENCY_DATA.IL,
    hospitals: HOSPITAL_DATA[destIata] || [
      { name: "City General Hospital", address: "Central District", phone: "+1-555-0100", distanceKm: 3.0 },
      { name: "University Medical Center", address: "University Blvd", phone: "+1-555-0200", distanceKm: 5.5 },
      { name: "International Clinic", address: "Airport Rd", phone: "+1-555-0300", distanceKm: 8.2 },
    ],
    visa: VISA_DATA[countryCode] || { required: false, summary: "Check entry requirements", maxStayDays: 90, notes: "Verify before travel" },
    safety: SAFETY_DATA[countryCode] || { level: "Standard", score: 75, advisory: "Standard travel precautions", lastUpdated: new Date().toISOString() },
    support: {
      phone: "+1-888-NESHER-1",
      whatsapp: "https://wa.me/18881234567",
      email: "support@nesher.travel",
    },
  };
}
