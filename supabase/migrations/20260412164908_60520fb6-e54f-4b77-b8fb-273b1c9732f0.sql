
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  phone text,
  nationality text,
  preferred_currency text DEFAULT 'USD',
  tier text DEFAULT 'free',
  trust_level integer DEFAULT 1,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE public.passenger_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  document_type text,
  mrz_data jsonb,
  expiry_date date,
  nationality text,
  document_number text,
  is_verified boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.passenger_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON public.passenger_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.passenger_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.passenger_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.passenger_documents FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.user_mandates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_customer_id text,
  stripe_payment_method_id text,
  mandate_active boolean DEFAULT false,
  max_auto_charge_usd integer DEFAULT 500,
  mandate_accepted_at timestamp,
  mandate_ip text
);
ALTER TABLE public.user_mandates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mandates" ON public.user_mandates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mandates" ON public.user_mandates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mandates" ON public.user_mandates FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.user_wallet (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  card_name text,
  card_issuer text,
  points_multiplier jsonb,
  transfer_partners text[]
);
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.user_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.user_wallet FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.user_wallet FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallet" ON public.user_wallet FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  seat_preference text DEFAULT 'window',
  max_stops integer DEFAULT 1,
  preferred_airlines text[],
  avoided_airlines text[],
  pref_direct_only boolean DEFAULT false,
  esim_auto_offer boolean DEFAULT true,
  auto_checkin_enabled boolean DEFAULT false,
  auto_rebook_enabled boolean DEFAULT false,
  safety_sensitivity text DEFAULT 'medium'
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  booking_type text,
  ticket_count integer DEFAULT 1,
  total_price_usd numeric,
  markup_applied_usd numeric,
  curation_fee_usd numeric DEFAULT 30,
  connection_guarantee_fee_usd numeric,
  insurance_fee_usd numeric,
  stripe_payment_intent_id text,
  duffel_order_id text,
  booking_status text DEFAULT 'pending',
  is_self_transfer boolean DEFAULT false,
  support_flag text DEFAULT 'normal',
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.travel_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings ON DELETE SET NULL,
  airline_code text,
  origin_iata text,
  destination_iata text,
  actual_destination_iata text,
  is_skiplag boolean DEFAULT false,
  travel_date timestamp,
  pnr text,
  ticket_number text,
  status text DEFAULT 'upcoming',
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.travel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own travel logs" ON public.travel_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel logs" ON public.travel_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel logs" ON public.travel_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.booking_legs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings ON DELETE CASCADE,
  leg_number integer,
  airline_code text,
  airline_name text,
  flight_number text,
  origin_iata text,
  destination_iata text,
  departure_time timestamp,
  arrival_time timestamp,
  pnr text,
  ticket_number text,
  flight_status text DEFAULT 'scheduled',
  is_resilient_carrier boolean DEFAULT false,
  gate text,
  terminal text,
  seat_number text,
  boarding_pass_data text,
  last_status_check timestamp
);
ALTER TABLE public.booking_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own booking legs" ON public.booking_legs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = booking_legs.booking_id AND bookings.user_id = auth.uid())
);
CREATE POLICY "Users can insert own booking legs" ON public.booking_legs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = booking_legs.booking_id AND bookings.user_id = auth.uid())
);

CREATE TABLE public.destination_safety (
  iata_code text PRIMARY KEY,
  city_name text,
  country_name text,
  safety_score integer,
  last_events text[],
  alert_level text DEFAULT 'normal',
  resilient_routing_recommended boolean DEFAULT false,
  last_updated timestamp DEFAULT now()
);
ALTER TABLE public.destination_safety ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view destination safety" ON public.destination_safety FOR SELECT USING (true);

CREATE TABLE public.resilient_airlines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  airline_code text UNIQUE,
  airline_name text,
  regions text[],
  reliability_score integer,
  notes text
);
ALTER TABLE public.resilient_airlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view resilient airlines" ON public.resilient_airlines FOR SELECT USING (true);

CREATE TABLE public.price_watches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  origin_iata text,
  destination_iata text,
  target_price_usd numeric,
  current_price_usd numeric,
  prediction text,
  prediction_confidence integer,
  alert_sent boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.price_watches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own price watches" ON public.price_watches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own price watches" ON public.price_watches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own price watches" ON public.price_watches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own price watches" ON public.price_watches FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.price_freezes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  origin_iata text,
  destination_iata text,
  frozen_price_usd numeric,
  freeze_fee_usd numeric,
  freeze_expires_at timestamp,
  status text DEFAULT 'active'
);
ALTER TABLE public.price_freezes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own price freezes" ON public.price_freezes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own price freezes" ON public.price_freezes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own price freezes" ON public.price_freezes FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.esim_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  destination_country text,
  price_usd numeric,
  data_gb numeric,
  validity_days integer,
  activation_code text,
  status text DEFAULT 'pending'
);
ALTER TABLE public.esim_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own esim purchases" ON public.esim_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own esim purchases" ON public.esim_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings ON DELETE SET NULL,
  trigger_type text,
  priority text DEFAULT 'normal',
  status text DEFAULT 'open',
  chat_transcript jsonb,
  assigned_agent text,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own support tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own support tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own support tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.insurance_pool (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  premium_paid_usd numeric DEFAULT 49,
  claim_status text DEFAULT 'none',
  claim_amount_usd numeric,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.insurance_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own insurance" ON public.insurance_pool FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance" ON public.insurance_pool FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.business_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text,
  billing_email text,
  stripe_customer_id text,
  plan text DEFAULT 'business',
  max_employees integer,
  travel_policy jsonb,
  dedicated_agent text,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.business_employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.business_accounts ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'traveler',
  active boolean DEFAULT true
);
ALTER TABLE public.business_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business membership" ON public.business_employees FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Business members can view their business" ON public.business_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.business_employees WHERE business_employees.business_id = business_accounts.id AND business_employees.user_id = auth.uid())
);
