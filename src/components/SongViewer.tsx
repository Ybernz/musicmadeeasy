import { useState, useRef, useEffect, useCallback } from 'react';
import { Song } from '@/lib/types';
import { isChordLine } from '@/lib/chords';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [scrollSpeed, setScrollSpeed] = useState(40);
  const speedRef = useRef(40);
  const animRef = useRef<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(song.title);

  useEffect(() => { speedRef.current = scrollSpeed; }, [scrollSpeed]);

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
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (scrollRef.current) {
        scrollRef.current.scrollTop += speedRef.current * dt;
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
      <div className="px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-3">
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
            <Button size="sm" onClick={saveContent} className="rounded-full gap-1.5 h-8 px-4">
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="rounded-full gap-1.5 h-8 px-4">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 scroll-smooth">
        {editing ? (
          <textarea
            className="w-full h-full min-h-[60vh] bg-transparent outline-none resize-none text-sm leading-7 text-foreground placeholder:text-muted-foreground/50"
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
                className={isChordLine(line) ? 'text-primary font-bold' : 'text-foreground/70'}
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

      {/* Auto-scroll controls */}
      {!editing && song.content && (
        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3">
          {/* Speed slider — visible when scrolling */}
          {scrolling && (
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg flex flex-col items-center gap-2 w-14">
              <span className="text-[10px] font-medium text-muted-foreground">{scrollSpeed}</span>
              <div className="h-24 flex items-center">
                <Slider
                  orientation="vertical"
                  min={10}
                  max={120}
                  step={5}
                  value={[scrollSpeed]}
                  onValueChange={([v]) => setScrollSpeed(v)}
                  className="h-full"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">px/s</span>
            </div>
          )}

          <button
            onClick={() => setScrolling(s => !s)}
            className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg",
              scrolling
                ? "bg-primary border-primary text-primary-foreground animate-pulse"
                : "bg-background border-primary text-primary hover:bg-primary/10 hover:scale-105"
            )}
            title={scrolling ? "Stop scrolling" : "Start auto-scroll"}
          >
            <ChevronDown className={cn("h-5 w-5 transition-transform", scrolling && "animate-bounce")} />
          </button>
        </div>
      )}
    </div>
  );
}
