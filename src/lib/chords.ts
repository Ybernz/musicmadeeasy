// Detects if a line is primarily chords (e.g. Am  G7  C#m/G  Dsus4)
const CHORD_PATTERN = /^[A-G][#b]?(m|maj|min|dim|aug|sus[24]?|add\d+|M?\d+)?(\/?[A-G][#b]?)?$/;

export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(t => CHORD_PATTERN.test(t)).length;
  return chordCount > 0 && chordCount / tokens.length >= 0.5;
}

// --- Transpose utilities ---

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function noteIndex(note: string): number {
  let idx = NOTES_SHARP.indexOf(note);
  if (idx >= 0) return idx;
  idx = NOTES_FLAT.indexOf(note);
  return idx;
}

function transposedNote(note: string, semitones: number): string {
  const idx = noteIndex(note);
  if (idx < 0) return note;
  const useFlats = NOTES_FLAT.includes(note) && !NOTES_SHARP.includes(note);
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return useFlats ? NOTES_FLAT[newIdx] : NOTES_SHARP[newIdx];
}

// Matches a chord token: root note + optional quality + optional /bass
const CHORD_REGEX = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/;

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  const m = chord.match(CHORD_REGEX);
  if (!m) return chord;
  const [, root, quality, bass] = m;
  let result = transposedNote(root, semitones) + quality;
  if (bass) {
    result += '/' + transposedNote(bass, semitones);
  }
  return result;
}

export function transposeLine(line: string, semitones: number): string {
  if (semitones === 0 || !isChordLine(line)) return line;
  // Preserve spacing by replacing chord tokens in-place
  return line.replace(/[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|M?\d+)?(?:\/[A-G][#b]?)?/g, (match) => {
    return transposeChord(match, semitones);
  });
}
