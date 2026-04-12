

# Admin Dashboard Plan

## Overview
Build a protected admin dashboard at `/admin` with live trip monitoring, support tickets, and escalation feeds. Uses a `user_roles` table for access control and an edge function for password verification.

## Security Architecture

1. **Database: `user_roles` table** — stores admin role per user (not on profiles table, per security rules)
2. **`has_role` security definer function** — prevents RLS recursion
3. **Edge function `admin-verify`** — validates password against `ADMIN_PASSWORD` secret and checks user role
4. **Client-side**: route only renders after both password check and role verification pass

## Database Migration

```sql
-- Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can view roles
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

## Secret
- Add `ADMIN_PASSWORD` secret via `add_secret` tool

## Edge Function: `admin-verify`
- Accepts POST with `{ password }` + auth header
- Checks password against `ADMIN_PASSWORD` env var
- Checks `user_roles` table for admin role
- Returns `{ authorized: true/false }`

## New Files

### `src/pages/Admin.tsx`
Main admin dashboard with:
- **Password gate**: modal prompting for password on first load, verified via edge function
- **Top stats bar**: Active trips, open tickets, monitored flights, disruptions today (from mock data, queried from DB tables)
- **Live trips table**: Color-coded rows (green/amber/red), risk badges, action buttons (View Chat, Take Over, Rebook, Call)
- **Support tickets panel**: Right sidebar, sorted by priority, with quick reply and agent assignment
- **Auto-escalation feed**: Live scrolling log of AI escalation events
- **Auto-refresh**: `setInterval` every 60s to re-fetch data
- **Red pulsing dot**: CSS animation on "Active" indicator when emergency tickets exist

### `src/App.tsx`
- Add `/admin` route pointing to `Admin` page

## Data Strategy
All dashboard data uses mock data (as established by project convention) with the DB table structures for realistic column names. Queries will read from `bookings`, `booking_legs`, `support_tickets`, `destination_safety`, and `user_profiles` tables where data exists, falling back to mock data for display.

## UI Design
- Dark theme consistent with app (`#0A0F1E` bg, `#1A2332` cards)
- Desktop-optimized layout (no bottom nav)
- Left: main table area. Right: support tickets panel
- Gold accent for emergency indicators, red pulsing dot animation

## Technical Details
- Row color logic: green = on-time + normal, amber = delayed OR self-transfer OR safety_score < 6, red = cancelled OR crisis OR emergency ticket
- Risk badges: Normal (green), Self-Transfer (amber), Crisis Route (red), Emergency (red pulse)
- No bottom nav on admin page

