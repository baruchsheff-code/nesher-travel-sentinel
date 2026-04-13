const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SafetyResponse {
  city: string;
  country: string;
  iata_code: string;
  safety_score: number;
  alert_level: "normal" | "advisory" | "warning" | "critical";
  top_events: string[];
  recommendation: string;
  weather: {
    temp_c: number;
    temp_f: number;
    description: string;
    wind_speed_kmh: number;
    humidity: number;
    has_warning: boolean;
    warning_text?: string;
  };
}

// Mock safety data for known destinations — in production this would call a real API
const SAFETY_DATA: Record<string, Partial<SafetyResponse>> = {
  TLV: {
    safety_score: 6,
    alert_level: "advisory",
    top_events: [
      "Intermittent rocket alerts in southern regions",
      "Heightened security at Ben Gurion Airport",
      "Some airlines adjusting flight paths over Israeli airspace",
    ],
    recommendation: "Consider resilient routing options",
  },
  IST: {
    safety_score: 5,
    alert_level: "advisory",
    top_events: [
      "Recent civil unrest reported in eastern provinces",
      "Protests near Taksim Square — avoid large gatherings",
    ],
    recommendation: "Exercise caution in crowded areas",
  },
  BGW: {
    safety_score: 2,
    alert_level: "critical",
    top_events: [
      "Active conflict zones in surrounding areas",
      "Multiple airlines have suspended service",
      "Embassy recommends against all but essential travel",
    ],
    recommendation: "We strongly recommend resilient routing",
  },
  KBL: {
    safety_score: 1,
    alert_level: "critical",
    top_events: [
      "No commercial carriers currently operating",
      "Extreme security risk throughout country",
    ],
    recommendation: "Commercial air travel not recommended",
  },
  KHI: {
    safety_score: 4,
    alert_level: "warning",
    top_events: [
      "Sectarian violence reported in parts of the city",
      "Political demonstrations causing transport disruption",
      "Increased security checks at airport",
    ],
    recommendation: "Exercise increased caution",
  },
};

// Simple weather mock based on latitude approximations
function getMockWeather(city: string, country: string) {
  const cityWeather: Record<string, { temp_c: number; description: string; wind_speed_kmh: number; humidity: number; has_warning: boolean; warning_text?: string }> = {
    "Tel Aviv": { temp_c: 28, description: "Sunny", wind_speed_kmh: 15, humidity: 65, has_warning: false },
    "Istanbul": { temp_c: 18, description: "Partly cloudy", wind_speed_kmh: 22, humidity: 72, has_warning: false },
    "New York": { temp_c: 14, description: "Overcast", wind_speed_kmh: 18, humidity: 58, has_warning: false },
    "London": { temp_c: 12, description: "Light rain", wind_speed_kmh: 25, humidity: 80, has_warning: false },
    "Paris": { temp_c: 15, description: "Mostly sunny", wind_speed_kmh: 12, humidity: 55, has_warning: false },
    "Tokyo": { temp_c: 20, description: "Clear skies", wind_speed_kmh: 10, humidity: 50, has_warning: false },
    "Dubai": { temp_c: 38, description: "Hot and sunny", wind_speed_kmh: 20, humidity: 40, has_warning: true, warning_text: "Extreme heat advisory — temperatures exceeding 40°C expected" },
    "Miami": { temp_c: 30, description: "Thunderstorms", wind_speed_kmh: 30, humidity: 85, has_warning: true, warning_text: "Severe thunderstorm warning in effect" },
    "Singapore": { temp_c: 31, description: "Humid with showers", wind_speed_kmh: 8, humidity: 88, has_warning: false },
    "Rome": { temp_c: 22, description: "Sunny", wind_speed_kmh: 14, humidity: 52, has_warning: false },
    "Athens": { temp_c: 24, description: "Clear", wind_speed_kmh: 16, humidity: 48, has_warning: false },
    "Milan": { temp_c: 17, description: "Partly cloudy", wind_speed_kmh: 11, humidity: 60, has_warning: false },
    "Bergamo": { temp_c: 16, description: "Partly cloudy", wind_speed_kmh: 13, humidity: 62, has_warning: false },
  };

  const w = cityWeather[city] || { temp_c: 20, description: "Fair", wind_speed_kmh: 15, humidity: 55, has_warning: false };
  return {
    ...w,
    temp_f: Math.round(w.temp_c * 9 / 5 + 32),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, iata_code } = await req.json();

    if (!iata_code) {
      return new Response(
        JSON.stringify({ success: false, error: "iata_code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const safetyData = SAFETY_DATA[iata_code];
    const weather = getMockWeather(city || "", country || "");

    const response: SafetyResponse = {
      city: city || iata_code,
      country: country || "",
      iata_code,
      safety_score: safetyData?.safety_score ?? 8,
      alert_level: safetyData?.alert_level ?? "normal",
      top_events: safetyData?.top_events ?? [],
      recommendation: safetyData?.recommendation ?? "No current advisories",
      weather,
    };

    return new Response(
      JSON.stringify({ success: true, ...response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("check-destination-safety error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
