import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DESTINATION_MAP: Record<string, { iata: string; city: string; country: string }> = {
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

function findDestinationOverride(query: string): { iata: string; city: string; country: string } | null {
  const normalized = query.toLowerCase();
  for (const [key, dest] of Object.entries(DESTINATION_MAP)) {
    if (normalized.includes(key)) return dest;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-check destination map BEFORE AI call
    const destOverride = findDestinationOverride(query);

    const systemPrompt = `You are a travel search parser. Extract flight search parameters from natural language. Always return valid JSON only, no other text. Never interpret 'Israel' as Istanbul or any Turkish city — Israel always maps to TLV (Tel Aviv Ben Gurion Airport). If the destination is ambiguous, pick the most logical travel destination, not the closest IATA code match. Today's date is ${new Date().toISOString().split("T")[0]}.

Return this exact JSON structure:
{
  "origin_iata": "string or null",
  "destination_iata": "string or null",
  "destination_city": "string or null",
  "destination_country": "string or null",
  "travel_date": "YYYY-MM-DD or null",
  "cabin": "economy|business|first",
  "passengers": number,
  "mentioned_card": "string or null",
  "preferences": []
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_flight_search",
              description: "Extract structured flight search parameters from natural language.",
              parameters: {
                type: "object",
                properties: {
                  origin_iata: { type: "string", description: "IATA code of origin airport" },
                  destination_iata: { type: "string", description: "IATA code of destination airport" },
                  destination_city: { type: "string" },
                  destination_country: { type: "string" },
                  travel_date: { type: "string", description: "YYYY-MM-DD format" },
                  cabin: { type: "string", enum: ["economy", "business", "first"] },
                  passengers: { type: "number" },
                  mentioned_card: { type: "string", description: "Credit card mentioned" },
                  preferences: { type: "array", items: { type: "string" } },
                },
                required: ["destination_iata", "destination_city", "destination_country", "cabin", "passengers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_flight_search" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI parsing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI returned no structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Override destination with our protected map if we found a match
    if (destOverride) {
      parsed.destination_iata = destOverride.iata;
      parsed.destination_city = destOverride.city;
      parsed.destination_country = destOverride.country;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
