

# Scrape Real Chords from Ultimate Guitar / CifraClub

## Problem
Currently the edge function uses AI to *generate* chord sheets, which may not match the actual chords. The user wants real chord sheets scraped from chord websites.

## Approach

We'll use **Firecrawl** (web scraping connector) to search and scrape chord pages from Ultimate Guitar and CifraClub.

### Flow
1. User types a song name → edge function uses Firecrawl **search** to find matching pages on `site:ultimate-guitar.com` and `site:cifraclub.com`
2. Return a list of results (title, URL, source) to the frontend
3. User picks a result → second call uses Firecrawl **scrape** to get the page content as markdown
4. AI cleans/formats the scraped markdown into a standard chord sheet format
5. User previews and saves

### Setup Required
- **Connect Firecrawl** — needs to be linked to this project (no connection exists yet)

### Changes

**`supabase/functions/search-chords/index.ts`** — rewrite to two-step flow:
- `action: "search"` — Firecrawl search with `site:ultimate-guitar.com OR site:cifraclub.com {query}`, returns list of results
- `action: "fetch"` — Firecrawl scrape on the selected URL, then use AI to clean the raw markdown into a proper chord sheet

**`src/components/ChordSearchDialog.tsx`** — update UI:
- Step 1: Search → show list of results (title + source site)
- Step 2: User clicks a result → loading → show cleaned chord sheet preview
- Step 3: Save to folder (unchanged)

**`supabase/config.toml`** — no changes needed (function already configured)

### Files to Edit
- `supabase/functions/search-chords/index.ts` — add Firecrawl search + scrape + AI cleanup
- `src/components/ChordSearchDialog.tsx` — two-step UI (results list → preview)

