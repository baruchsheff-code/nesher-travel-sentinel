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

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < maxRetries) {
      const resetHeader = res.headers.get("ratelimit-reset");
      const waitSec = resetHeader ? parseInt(resetHeader) : Math.pow(2, attempt + 1);
      const jitter = Math.random() * 1000;
      console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${waitSec}s + jitter`);
      await res.text(); // consume body
      await new Promise((r) => setTimeout(r, waitSec * 1000 + jitter));
      continue;
    }
    return res;
  }
  // Should not reach here, but just in case
  return fetch(url, options);
}

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

    const duffelHeaders = {
      "Authorization": `Bearer ${DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    };

    // Step 1: Create offer request with retry
    const offerReqRes = await fetchWithRetry(
      "https://api.duffel.com/air/offer_requests",
      {
        method: "POST",
        headers: duffelHeaders,
        body: JSON.stringify({
          data: {
            slices: [{ origin, destination, departure_date }],
            passengers,
            cabin_class,
          },
        }),
      },
    );

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

    // Step 2: Fetch all offers with pagination and retry
    const allRawOffers: unknown[] = [];
    let afterCursor: string | null = null;

    do {
      let url = `https://api.duffel.com/air/offers?offer_request_id=${offerRequestId}&sort=total_amount&limit=200`;
      if (afterCursor) url += `&after=${afterCursor}`;

      const offersRes = await fetchWithRetry(url, {
        headers: duffelHeaders,
      });

      if (!offersRes.ok) {
        const errBody = await offersRes.text();
        console.error("Duffel offers failed:", offersRes.status, errBody);
        return new Response(JSON.stringify({ error: "Failed to fetch offers", details: errBody }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const offersData = await offersRes.json();
      allRawOffers.push(...(offersData?.data || []));
      afterCursor = offersData?.meta?.after ?? null;
    } while (afterCursor);

    // Step 3: Map raw Duffel offers to clean objects
    const cleanOffers = (allRawOffers as any[]).map((offer) => {
      try {
        const slice = offer.slices[0];
        const segments = slice.segments;
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];

        const stopAirports = segments
          .slice(0, -1)
          .map((s: any) => s.destination.iata_code);

        const duration = slice.duration || '';
        const durationMatch = duration.match(
          /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?/
        );
        const days = parseInt(durationMatch?.[1] || '0');
        const hours = parseInt(durationMatch?.[2] || '0');
        const minutes = parseInt(durationMatch?.[3] || '0');
        const totalHours = days * 24 + hours;
        const readableDuration = totalHours > 0
          ? `${totalHours}h ${minutes > 0 ? minutes + 'm' : ''}`.trim()
          : `${minutes}m`;

        return {
          id: offer.id,
          offer_id: offer.id,
          airline_name: offer.owner?.name || 'Unknown',
          airline_code: offer.owner?.iata_code || 'XX',
          flight_number: firstSeg?.marketing_carrier_flight_number
            || firstSeg?.operating_carrier_flight_number
            || '',
          cabin_class: firstSeg?.passengers?.[0]
            ?.cabin_class_marketing_name
            || firstSeg?.passengers?.[0]?.cabin_class
            || 'Economy',
          origin_iata: firstSeg?.origin?.iata_code || '',
          origin_city: firstSeg?.origin?.city_name
            || firstSeg?.origin?.name || '',
          destination_iata: lastSeg?.destination?.iata_code || '',
          destination_city: lastSeg?.destination?.city_name
            || lastSeg?.destination?.name || '',
          departure_time: firstSeg?.departing_at || '',
          arrival_time: lastSeg?.arriving_at || '',
          duration: readableDuration,
          duration_raw: slice.duration,
          stops: segments.length - 1,
          stop_airports: stopAirports,
          total_amount: offer.total_amount || '0',
          total_currency: offer.total_currency || 'USD',
          base_amount: offer.base_amount || '0',
          tax_amount: offer.tax_amount || '0',
          expires_at: offer.expires_at || '',
          emissions_kg: offer.total_emissions_kg || null,
          return_slice: offer.slices[1] ? {
            departure_time: offer.slices[1]
              .segments[0]?.departing_at,
            arrival_time: offer.slices[1]
              .segments[offer.slices[1].segments.length - 1]
              ?.arriving_at,
            duration: offer.slices[1].duration,
            stops: offer.slices[1].segments.length - 1,
          } : null,
        };
      } catch (e) {
        console.error('Error mapping offer:', offer.id, e);
        return null;
      }
    }).filter(Boolean);

    console.log(`Total offers fetched: ${allRawOffers.length}, mapped: ${cleanOffers.length}`);

    return new Response(JSON.stringify({
      offer_request_id: offerRequestId,
      offers: cleanOffers,
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
