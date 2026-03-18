

# Song Search & Auto-Chord Lookup

## What We're Building
A search feature where users type a song name, get suggestions, and the app automatically generates a chord sheet using AI — no need to manually find/type chords.

## Approach

### 1. Backend: Edge Function (`search-chords`)
- Create a Supabase Edge Function that takes a song name/artist query
- Uses Lovable AI (e.g. `google/gemini-2.5-flash`) to generate a chord sheet in standard chord-over-lyrics format
- Returns the chord sheet text directly

### 2. UI: Search Dialog
- Add a **"Find Chords"** button (Search icon) in the sidebar or song viewer toolbar
- Opens a `CommandDialog` (already have the `cmdk` component) where the user types a song name + optional artist
- User submits → shows a loading state → AI returns the chord sheet
- User can then **save it** as a new song in a selected folder

### 3. Flow
1. User clicks "Find Chords" button in sidebar
2. Dialog opens — user types e.g. "Wonderwall Oasis"
3. Hits Enter / clicks Search → edge function calls Lovable AI
4. Result displayed in the dialog as a preview
5. User clicks "Save to folder" → creates a new song with the generated content

## Files to Create/Edit
- **`supabase/functions/search-chords/index.ts`** — Edge function that calls Lovable AI to generate chord sheets
- **`src/components/ChordSearchDialog.tsx`** — New dialog component using `CommandDialog` pattern
- **`src/components/AppSidebar.tsx`** — Add "Find Chords" button
- **`src/hooks/useChordBook.ts`** — No changes needed (reuses existing `createSong` + `updateSongContent`)

