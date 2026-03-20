

# AI Song Recommendations in Find Chords

## What We're Building

A new "Discover" tab/mode in the Find Chords dialog that uses AI to recommend songs based on the user's existing library. Users pick:
1. **Difficulty** — Easier / Same / Harder than their current songs
2. **Music taste** — Similar (based on their library) / Random / Specific genre (user picks from a list)

AI analyzes the user's saved songs (titles + chords) and returns song recommendations, which can then be searched and saved using the existing chord search flow.

## Changes

### 1. Edge function: new `action: "recommend"` in `search-chords/index.ts`

- Accepts `{ action: "recommend", difficulty: "easier"|"same"|"harder", taste: "similar"|"random"|"genre", genre?: string, existingSongs: string[] }`
- `existingSongs` is an array of song titles from the user's library (sent from frontend)
- Calls Lovable AI with a prompt that:
  - Lists the user's current songs for context
  - Asks for 8–10 song recommendations matching the difficulty and taste criteria
  - Returns structured output: `[{ title, artist, reason }]` via tool calling
- Returns the recommendations to the frontend

### 2. Update `ChordSearchDialog.tsx` — add "Discover" mode

- Add a toggle at the top: **Search** (current) vs **Discover** (new)
- In Discover mode, show:
  - **Difficulty** selector: 3 buttons — Easier / Same / Harder
  - **Taste** selector: 4 options — Similar to my songs / Random / Pick a genre
  - If "Pick a genre" → show a genre select (Pop, Rock, Country, Jazz, Blues, Folk, R&B, Latin, Gospel, Classical, etc.)
  - A "Get Recommendations" button
- Results display as a list of `{ title, artist, reason }`
- Clicking a recommendation auto-fills the search query and switches to search mode to find chords for that song

### 3. Pass songs data from `Index.tsx`

- Pass `book.songs` to `ChordSearchDialog` so it can send song titles to the edge function

### Files to Edit
- `supabase/functions/search-chords/index.ts` — add `recommend` action with AI call
- `src/components/ChordSearchDialog.tsx` — add Discover mode UI with difficulty/taste selectors
- `src/pages/Index.tsx` — pass `songs` prop to the dialog

