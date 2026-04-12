

## Rebuild Flight Detail Screen

The current `FlightDetail.tsx` has a multi-step booking wizard (details → passengers → extras → review). The user wants a single-screen flight detail view matching a specific layout spec with toggle add-on cards.

### What Changes

**File: `src/pages/FlightDetail.tsx`** — Full rewrite to a single-scroll layout:

1. **Flight Summary Card** (top) — Airline logo circle, flight number, date, full route with departure/arrival times, duration, stops, large price display (gold `#C9A84C`)

2. **Fare Breakdown Card** — Always visible (no accordion), line items:
   - Base fare, Taxes & fees (mock ~15% of base), AI Optimization Fee $30 with info tooltip, Total in gold/large

3. **Add-Ons Section** — 7 toggle cards using the existing `ExtraToggle` pattern (refined):
   - **Connection Guarantee** ($49, shield icon) — only if `isSplitTicket` (closest proxy for self-transfer)
   - **Travel Insurance** ($49, umbrella icon)
   - **eSIM** ($8, signal icon) — shows destination country name
   - **Lounge Access** ($45, coffee icon) — only if `stops > 0` and duration > 3hrs (mock layover)
   - **Price Freeze** ($29, lock icon)
   - **Auto Check-In** (free, ticket icon) — greyed out with "Add passport in profile to enable" if no passport (mock as no passport)
   - **Auto Recovery** (free, refresh icon) — requires card mandate, show setup prompt (mock as not active)

4. **Book Button** — Fixed bottom, full-width, gold background (`#C9A84C`), dark text, shows dynamic total, subtext "Price verified live — no surprises"

5. **Remove** the multi-step wizard (steps indicator, passenger form, review step). Keep the booking confirmation screen.

### Technical Details

- Reuse `FlightResult` type and `getMockFlightsForDestination` for data
- Add mock values: taxes (15% of base), country name mapping from IATA codes, lounge names
- Info tooltip for AI Optimization Fee using a simple hover/tap popover
- Toggle state for each add-on, dynamically updating the total in the bottom bar
- Maintain dark theme styling consistent with design tokens (card `#1A2332`, bg `#0A0F1E`, gold `#C9A84C`)
- Keep existing route `/flight?id=...&dest=...` and navigation from SearchResults

