import { supabase } from "@/integrations/supabase/client";

export const SKIPLAG_COOLDOWN_DAYS = 180;

/**
 * Returns true if the user has a skiplag booking on the given airline
 * within the cooldown window (last 180 days). Such fares MUST be hidden.
 */
export async function hasRecentSkiplag(
  userId: string,
  airlineCode: string,
): Promise<{ blocked: boolean; daysRemaining: number }> {
  const sinceMs = Date.now() - SKIPLAG_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const { data, error } = await supabase
    .from("travel_logs")
    .select("travel_date")
    .eq("user_id", userId)
    .eq("airline_code", airlineCode)
    .eq("is_skiplag", true)
    .gte("travel_date", new Date(sinceMs).toISOString())
    .order("travel_date", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { blocked: false, daysRemaining: 0 };
  }
  const last = new Date(data[0].travel_date as string).getTime();
  const elapsedDays = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, SKIPLAG_COOLDOWN_DAYS - elapsedDays);
  return { blocked: true, daysRemaining };
}