

# Visual Polish, Speed-Adjustable Scroll & Dark Mode

## 1. Dark Mode Toggle
- Add a `ThemeProvider` component using `next-themes` (already installed) wrapping the app in `App.tsx`
- Add a sun/moon toggle button in the sidebar header (top of `AppSidebar`)
- The dark theme variables are already defined in `index.css` — just need to wire up `next-themes`

## 2. Adjustable Scroll Speed
- In `SongViewer`, when auto-scroll is active, show a small speed slider (using the existing `Slider` component) next to or above the scroll button
- Speed range: 10–120 px/s, default 40
- Store speed in component state; the `requestAnimationFrame` loop reads it via a ref
- Slider appears only while scrolling is active, keeping UI clean

## 3. Visual Polish
- **Sidebar**: Add a subtle music note or guitar icon next to "Chord Book" title using lucide `Music` icon. Improve spacing, add song count badges per folder
- **Empty state**: Make the landing page more inviting with a larger icon, better typography hierarchy, and subtle accent color usage
- **Song viewer title bar**: Add subtle background tint, improve button styling (pill-shaped Save/Edit buttons instead of plain text links)
- **Scroll button**: Add a subtle pulse animation when scrolling is active
- **Overall**: Refine border radiuses, add subtle shadows to cards/sidebar, improve hover transitions, better use of the brass accent color
- **Remove `App.css`** — it has unused boilerplate styles conflicting with the layout (`max-width`, `padding`, `text-align: center` on `#root`)

## Files to Change
- `src/App.tsx` — wrap with `ThemeProvider`
- `src/App.css` — delete (unused boilerplate)
- `src/components/AppSidebar.tsx` — add dark mode toggle, visual improvements
- `src/components/SongViewer.tsx` — speed slider, visual polish
- `src/pages/Index.tsx` — improved empty state
- `src/index.css` — minor tweaks (smooth scrolling, transitions)

