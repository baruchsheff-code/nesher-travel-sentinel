const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const BodySchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cabin_class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  adult_count: z.number().int().min(1).max(9).default(1),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
    if (!DUFFEL_API_KEY) {
      return new Response(JSON.stringify({ error: "DUFFEL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { origin, destination, departure_date, cabin_class, adult_count } = parsed.data;

    const passengers = Array.from({ length: adult_count }, () => ({ type: "adult" }));

    // Step 1: Create offer request
    const offerReqRes = await fetch("https://api.duffel.com/air/offer_requests", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DUFFEL_API_KEY}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          slices: [{ origin, destination, departure_date }],
          passengers,
          cabin_class,
        },
      }),
    });

    if (!offerReqRes.ok) {
      const errBody = await offerReqRes.text();
      console.error("Duffel offer_requests failed:", offerReqRes.status, errBody);
      return new Response(JSON.stringify({ error: "Failed to create offer request", details: errBody }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const offerReqData = await offerReqRes.json();
    const offerRequestId = offerReqData?.data?.id;

    if (!offerRequestId) {
      return new Response(JSON.stringify({ error: "No offer_request_id returned" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Fetch offers
    const offersRes = await fetch(
      `https://api.duffel.com/air/offers?offer_request_id=${offerRequestId}&sort=total_amount&limit=10`,
      {
        headers: {
          "Authorization": `Bearer ${DUFFEL_API_KEY}`,
          "Duffel-Version": "v2",
          "Content-Type": "application/json",
        },
      },
    );

    if (!offersRes.ok) {
      const errBody = await offersRes.text();
      console.error("Duffel offers failed:", offersRes.status, errBody);
      return new Response(JSON.stringify({ error: "Failed to fetch offers", details: errBody }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const offersData = await offersRes.json();

    return new Response(JSON.stringify({
      offer_request_id: offerRequestId,
      offers: offersData?.data || [],
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search-flights error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
