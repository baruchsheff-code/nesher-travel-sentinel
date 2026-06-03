import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Body {
  destination_iata: string
  destination_country_code: string | null
  direct_price: number | null
}

interface Diagnosis {
  diagnosis: 'standard' | 'crisis' | 'complex' | 'expensive'
  reasons: string[]
  tools: {
    safety_banner: boolean
    crisis_safe_tab: boolean
    resilient_filtering: boolean
    split_ticket: boolean
  }
  route_info: {
    resilient_carriers?: string[]
    safe_hubs?: string[]
    visa_notes?: string
  } | null
}

const PROFILES: Record<string, Diagnosis> = {
  IL: {
    diagnosis: 'crisis',
    reasons: ['Active regional security advisory near destination'],
    tools: { safety_banner: true, crisis_safe_tab: true, resilient_filtering: true, split_ticket: true },
    route_info: {
      resilient_carriers: ['LY', 'UA', 'DL'],
      safe_hubs: ['Athens (ATH)', 'Larnaca (LCA)'],
      visa_notes: 'Most Western passports: visa-free up to 90 days.',
    },
  },
  LB: {
    diagnosis: 'crisis',
    reasons: ['Elevated security risk in destination region'],
    tools: { safety_banner: true, crisis_safe_tab: true, resilient_filtering: false, split_ticket: true },
    route_info: { safe_hubs: ['Istanbul (IST)', 'Athens (ATH)'], visa_notes: 'Visa on arrival for most nationalities.' },
  },
  UA: {
    diagnosis: 'crisis',
    reasons: ['Airspace closed; overland routing required'],
    tools: { safety_banner: true, crisis_safe_tab: false, resilient_filtering: false, split_ticket: true },
    route_info: { safe_hubs: ['Warsaw (WAW)', 'Krakow (KRK)'] },
  },
  TR: {
    diagnosis: 'standard',
    reasons: [],
    tools: { safety_banner: false, crisis_safe_tab: false, resilient_filtering: false, split_ticket: false },
    route_info: { visa_notes: 'E-visa required for many passports; apply online before travel.' },
  },
}

function diagnose(body: Body): Diagnosis {
  if (body.destination_country_code && PROFILES[body.destination_country_code]) {
    return PROFILES[body.destination_country_code]
  }
  return {
    diagnosis: 'standard',
    reasons: [],
    tools: { safety_banner: false, crisis_safe_tab: false, resilient_filtering: false, split_ticket: false },
    route_info: null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = (await req.json()) as Body
    const diagnosis = diagnose(body)
    return new Response(JSON.stringify(diagnosis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})