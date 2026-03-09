

# Chord Book — Your Digital Music Stand

A personal songbook app for storing, organizing, and performing from your chord/lyric sheets.

## Layout
- **Fixed two-column layout**: Left sidebar (25%) for folders & song list, right area (75%) for viewing the selected song
- **Typography**: Roboto Mono for UI/navigation, Source Code Pro for song content
- **Color palette**: Parchment background (#F4F1EB), Dry Ink text (#2A2A2A), Concrete borders (#D1CDC4), Brass accent (#B58A3F)

## Features

### Folder & Song Management
- Create folders and nest songs inside them
- "New Folder" and "New Song" actions as inline text buttons (no icons, no modals)
- Creating a new song opens a blank text area in the viewer — paste your lyrics/chords in
- "Move to..." command for reorganizing songs between folders
- Delete folders and songs with confirmation
- Rename folders and songs inline

### Song Viewer
- Plain text display with **auto-detection of chord lines** (lines containing chord patterns like Am, G7, C#m/G) rendered in dark ink, lyrics rendered in a lighter grey
- Left-aligned, generous margins, monospaced font for easy reading from a distance
- Song title displayed at the top

### Auto-Scroll
- A single circular button at the bottom-right of the song viewer
- Tap to start scrolling at a fixed, steady speed (outline → filled Brass)
- Tap again to stop (filled → outline)
- No speed controls — binary on/off

### Data Storage
- All data stored locally in the browser (localStorage) — no account needed, fully private
- Songs and folders persist between sessions

