import { useState, useRef, useEffect, useCallback } from 'react';
import { Song } from '@/lib/types';
import { isChordLine } from '@/lib/chords';

interface SongViewerProps {
  song: Song;
  onUpdateContent: (id: string, content: string) => void;
  onRenameSong: (id: string, title: string) => void;
}

export function SongViewer({ song, onUpdateContent, onRenameSong }: SongViewerProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(song.content);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const animRef = useRef<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(song.title);

  useEffect(() => {
    setEditText(song.content);
    setEditing(!song.content);
    setScrolling(false);
    setTitleText(song.title);
    setEditingTitle(false);
  }, [song.id]);

  // Auto-scroll
  useEffect(() => {
    if (!scrolling || !scrollRef.current) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let last = performance.now();
    const speed = 40; // px per second
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (scrollRef.current) {
        scrollRef.current.scrollTop += speed * dt;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [scrolling]);

  const saveContent = useCallback(() => {
    onUpdateContent(song.id, editText);
    setEditing(false);
  }, [song.id, editText, onUpdateContent]);

  const lines = song.content.split('\n');

  return (
    <div className="flex flex-col h-full relative">
      {/* Title bar */}
      <div className="px-8 py-5 border-b border-border flex items-center gap-3">
        {editingTitle ? (
          <input
            autoFocus
            className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none font-mono text-foreground"
            value={titleText}
            onChange={e => setTitleText(e.target.value)}
            onBlur={() => { if (titleText.trim()) { onRenameSong(song.id, titleText.trim()); } setEditingTitle(false); }}
            onKeyDown={e => {
              if (e.key === 'Enter' && titleText.trim()) { onRenameSong(song.id, titleText.trim()); setEditingTitle(false); }
              if (e.key === 'Escape') { setTitleText(song.title); setEditingTitle(false); }
            }}
          />
        ) : (
          <h2
            className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {song.title}
          </h2>
        )}

        <div className="ml-auto flex gap-2">
          {editing ? (
            <button
              onClick={saveContent}
              className="text-xs font-medium text-primary hover:underline"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        {editing ? (
          <textarea
            className="w-full h-full min-h-[60vh] bg-transparent outline-none resize-none text-sm leading-7 text-foreground"
            style={{ fontFamily: "'Source Code Pro', monospace" }}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            placeholder="Paste your lyrics and chords here…"
            autoFocus
          />
        ) : song.content ? (
          <pre className="whitespace-pre-wrap text-sm leading-7" style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {lines.map((line, i) => (
              <span
                key={i}
                className={isChordLine(line) ? 'text-foreground font-semibold' : 'text-muted-foreground'}
              >
                {line}
                {i < lines.length - 1 && '\n'}
              </span>
            ))}
          </pre>
        ) : (
          <p className="text-muted-foreground italic text-sm">Click "Edit" to paste your lyrics and chords.</p>
        )}
      </div>

      {/* Auto-scroll button */}
      {!editing && song.content && (
        <button
          onClick={() => setScrolling(s => !s)}
          className={cn(
            "absolute bottom-6 right-6 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg",
            scrolling
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-primary text-primary hover:bg-primary/10"
          )}
          title={scrolling ? "Stop scrolling" : "Start auto-scroll"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v10M4 8l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Need cn import
import { cn } from '@/lib/utils';
