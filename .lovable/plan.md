

## Remove the 10-offer cap from search-flights

**What**: Change the Duffel API call from `limit=10` to `limit=200` (Duffel's max per page) and add pagination to collect all offers if more than 200 exist.

### Steps

1. **`supabase/functions/search-flights/index.ts`** — Update the offers fetch:
   - Change `limit=10` to `limit=200` on line 75
   - Add a pagination loop: after the first fetch, check `offersData.meta?.after` — if present, keep fetching with `&after={cursor}` until no more pages
   - Concatenate all pages into a single `allOffers` array and return it

2. **Deploy** the updated edge function

One file changed, no frontend changes needed.

