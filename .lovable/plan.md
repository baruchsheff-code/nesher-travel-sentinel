

# Connect Search Results to Real Duffel API

## What's Already Done
The integration is mostly in place — `SearchResults.tsx` already calls the `search-flights` edge function, transforms offers via `transformDuffelOffer`, and falls back to mock data. This task refines the mapping accuracy and badge logic.

## Changes Needed (all in `src/pages/SearchResults.tsx`)

### 1. Fix Duffel field mapping in `transformDuffelOffer`
- Use `offer.owner.name` and `offer.owner.iata_code` for airline (currently uses `segment.operating_carrier` which may be missing)
- Use last segment's destination for multi-stop flights
- Show layover airport code for 1-stop flights (e.g. "1 stop · FRA")
- Add `stopsLabel` field or compute it inline

### 2. Conditional DEMO badge in `FlightCard`
- Pass `apiSource` as a prop to `FlightCard`
- When `apiSource === "duffel"`: hide the DEMO badge entirely
- When `apiSource === "mock"`: show "DEMO" badge (current behavior)

### 3. Friendlier fallback error message
- Change the toast from `"Live search unavailable — showing sample results"` to `"Having trouble loading live fares. Showing sample results."`
- Keep the "(Demo data)" label in the header as-is

### 4. Stops display in FlightCard
- Currently shows `"Nonstop"` or `"1 stop"` — update to show layover airport code when available (add `layoverAirport` to `FlightResult` interface in `mockFlights.ts`)

## Files Modified
- `src/pages/SearchResults.tsx` — transform function, FlightCard component, error message
- `src/lib/mockFlights.ts` — add optional `layoverAirport` field to `FlightResult`

