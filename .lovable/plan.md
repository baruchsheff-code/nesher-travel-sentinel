

# Final Polish Pass — Nesher App

## 1. Consistent Branding (Bird icon + "Nesher" in top-left)

Currently, Index and Settings have the Bird icon. SearchResults, FlightDetail, and MyTrips use a back arrow without the brand. Will add a shared `NesherHeader` component with the Bird icon + "Nesher" text, back arrow (when not on home), and optional right-side actions. Apply it to all screens.

**Files**: New `src/components/NesherHeader.tsx`, update `Index.tsx`, `SearchResults.tsx`, `FlightDetail.tsx`, `MyTrips.tsx`, `Settings.tsx`, `Business.tsx`

## 2. Onboarding Tooltip Sequence

Create an `OnboardingTooltips` component that shows 3 sequential tooltips for first-time visitors (tracked via `localStorage`):
- Tooltip 1: anchored to search bar — "Search in plain English — try 'flights to Israel next week'"
- Tooltip 2: shown after first search on results page, anchored to first flight card — "We check live safety conditions for every destination automatically"
- Tooltip 3: shown after first search if not logged in — "Create a free account to save this search and get price alerts"

Each tooltip is a positioned overlay with a dismiss button and step indicator (1/3, 2/3, 3/3). Uses `localStorage` key `nesher_onboarding_done`.

**Files**: New `src/components/OnboardingTooltips.tsx`, update `Index.tsx` and `SearchResults.tsx`

## 3. 375px Mobile Responsiveness

Audit and fix all screens for iPhone SE (375px):
- Ensure no horizontal overflow on any screen
- Shrink font sizes and padding where needed on small screens
- Use `text-xs` / smaller gaps in tight areas
- Test bottom nav spacing, search bar, trip cards, settings form
- Add `min-w-0` and `truncate` where text could overflow

**Files**: Minor tweaks across `Index.tsx`, `SearchResults.tsx`, `MyTrips.tsx`, `Settings.tsx`, `BottomNav.tsx`, `FlightDetail.tsx`

## 4. Enhanced Settings Screen

The current Settings already has Profile, Notifications, Flight Preferences, Smart Features, and Subscription sections. Will add:
- **My Cards** section: display cards from `user_wallet` table (card name, issuer, transfer partners). Add/remove cards UI.
- **Auto Recovery** section: mandate toggle + ceiling slider using `user_mandates` table data. Show max auto-charge amount with a slider ($100-$2000).
- **Privacy Center** section: data sharing toggles (analytics, location, marketing) + "Delete Account" button with confirmation dialog.

**Files**: Update `src/pages/Settings.tsx`

## 5. Empty States

Add friendly empty states with illustrations/icons:
- **MyTrips**: "Your next adventure starts here" + search button (when no bookings)
- **PriceWatchDashboard**: "Watch a fare to get alerted when prices drop" (when no watches)
- **Support tickets** (in admin or future support page): "All clear — no open issues"

**Files**: Update `src/pages/MyTrips.tsx`, `src/components/PriceWatchDashboard.tsx`

## 6. Nesher Loading Screen

Add a splash screen component that shows on app load:
- Deep navy background (`#0A0F1E`)
- Gold eagle wing icon (Bird from lucide, colored `#C9A84C`) that pulses once
- "Nesher" text fades in below
- After ~1.5s, the whole screen fades out to reveal the app

Implemented as a wrapper in `App.tsx` with state-based visibility and CSS animations.

**Files**: New `src/components/SplashScreen.tsx`, update `src/App.tsx`, add keyframes to `src/index.css`

---

## Technical Details

- `NesherHeader` props: `showBack?: boolean`, `title?: string`, `rightContent?: ReactNode`
- Onboarding uses `localStorage` for persistence, no database needed
- Privacy toggles are local-only (no backend table needed, stored in localStorage)
- Delete account calls `supabase.auth.admin.deleteUser` or marks profile for deletion
- Splash screen uses `useState` + `setTimeout` + CSS opacity/transform transitions
- All new CSS animations added to `src/index.css`

