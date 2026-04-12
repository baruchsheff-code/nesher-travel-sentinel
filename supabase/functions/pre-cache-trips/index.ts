const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find bookings departing in the next 24 hours that haven't been cached yet
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: legs, error } = await supabase
      .from("booking_legs")
      .select("*, bookings!booking_legs_booking_id_fkey(id, user_id, booking_status, is_self_transfer, total_price_usd)")
      .gte("departure_time", now.toISOString())
      .lte("departure_time", in24h.toISOString())
      .eq("flight_status", "scheduled");

    if (error) {
      console.error("Query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the booking IDs that should be pre-cached
    const bookingIds = [...new Set((legs || []).map((l: any) => l.booking_id).filter(Boolean))];

    return new Response(
      JSON.stringify({
        message: `Found ${bookingIds.length} bookings departing within 24 hours`,
        bookingIds,
        checkedAt: now.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("pre-cache-trips error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
