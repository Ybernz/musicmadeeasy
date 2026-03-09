// Detects if a line is primarily chords (e.g. Am  G7  C#m/G  Dsus4)
const CHORD_PATTERN = /^[A-G][#b]?(m|maj|min|dim|aug|sus[24]?|add\d+|M?\d+)?(\/?[A-G][#b]?)?$/;

export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Split by whitespace and check if most tokens are chords
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;
  
  const chordCount = tokens.filter(t => CHORD_PATTERN.test(t)).length;
  // A line is a chord line if >50% of tokens are chords and there's at least one
  return chordCount > 0 && chordCount / tokens.length >= 0.5;
}
