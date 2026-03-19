

# Three Improvements to Chord Search & Viewer

## 1. Add "Create New Folder" in Chord Search Dialog

In the folder `<Select>` dropdown in `ChordSearchDialog.tsx`, add an option to create a new folder inline. When selected, show a small input field to type the folder name, then call the existing `createFolder` function.

**Changes:**
- `ChordSearchDialog.tsx` — accept `onCreateFolder` prop, add a "New Folder" option at the bottom of the Select dropdown, with an inline input that appears when clicked
- `Index.tsx` — pass `book.createFolder` to the dialog

## 2. Fix Blank Chords After Saving from Search

**Root cause:** When `handleSaveChordSearch` runs, `createSong` inserts a song with empty content and immediately selects it via `setSelectedSongId`. The `SongViewer` mounts, sees empty content, and enters edit mode. Then `updateSongContent` updates the songs array, but `SongViewer`'s `useEffect` only depends on `song.id` — since the ID hasn't changed, it never re-reads the updated content.

**Fix:** In `SongViewer.tsx`, add `song.content` as a dependency to the effect that syncs `editText` and `editing` state. This way when the content updates after the initial empty creation, the viewer picks it up immediately.

## 3. Add Transpose (Key Change) and Capo Controls

Add a toolbar in `SongViewer` with:
- **Transpose**: +/- buttons to shift all chords up or down by semitones
- **Capo**: A selector (0–12) that displays the effective key with the capo applied

**Implementation:**
- `src/lib/chords.ts` — add a `transposeChord(chord, semitones)` function and a `transposeLine(line, semitones)` function that detects chord lines and shifts each chord
- `SongViewer.tsx` — add `transpose` state (number, default 0) and `capo` state (number, default 0). Render the content through the transpose function before display. Add +/- buttons and capo selector in the title bar.

The transpose logic will handle: natural notes (A-G), sharps (#), flats (b), and preserve chord quality (m, maj, 7, sus4, dim, aug, add9, slash chords, etc.).

### Files to Edit
- `src/components/ChordSearchDialog.tsx` — add create-folder inline option
- `src/pages/Index.tsx` — pass `createFolder` prop
- `src/components/SongViewer.tsx` — fix blank content bug + add transpose/capo controls
- `src/lib/chords.ts` — add `transposeChord` and `transposeLine` utility functions

