const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: true, places: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
    if (!DUFFEL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "DUFFEL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      `https://api.duffel.com/places/suggestions?query=${encodeURIComponent(query.trim())}`,
      {
        headers: {
          "Authorization": `Bearer ${DUFFEL_API_KEY}`,
          "Duffel-Version": "v2",
          "Accept": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Duffel places failed:", response.status, errBody);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch places" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();

    const places = (data.data || [])
      .map((place: any) => ({
        iata_code: place.iata_code || place.airports?.[0]?.iata_code,
        name: place.name,
        city: place.city_name || place.name,
        country: place.iata_country_code || "",
        type: place.type,
      }))
      .filter((p: any) => p.iata_code);

    return new Response(
      JSON.stringify({ success: true, places }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("search-places error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
