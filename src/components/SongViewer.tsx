import { useState, useRef, useEffect, useCallback } from 'react';
import { Song } from '@/lib/types';
import { isChordLine, transposeLine } from '@/lib/chords';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Pencil, Save, Maximize, Minimize, Columns, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [columnCount, setColumnCount] = useState(2);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);

  useEffect(() => { speedRef.current = scrollSpeed; }, [scrollSpeed]);

  // Fix: depend on song.content so updates after creation are picked up
  useEffect(() => {
    setEditText(song.content);
    setEditing(!song.content);
    setScrolling(false);
    setTitleText(song.title);
    setEditingTitle(false);
    setTranspose(0);
    setCapo(0);
  }, [song.id, song.content]);

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

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      await fullscreenRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const saveContent = useCallback(() => {
    onUpdateContent(song.id, editText);
    setEditing(false);
  }, [song.id, editText, onUpdateContent]);

  const totalSemitones = transpose + capo;
  const lines = song.content.split('\n');

  const renderedContent = (
    <pre
      className={cn(
        "whitespace-pre-wrap text-sm leading-7",
        isFullscreen && "column-gap-8"
      )}
      style={{
        fontFamily: "'Source Code Pro', monospace",
        columnCount: isFullscreen ? columnCount : undefined,
        columnRule: isFullscreen ? '1px solid hsl(var(--border))' : undefined,
      }}
    >
      {lines.map((line, i) => {
        const displayLine = totalSemitones !== 0 ? transposeLine(line, totalSemitones) : line;
        return (
          <span
            key={i}
            className={isChordLine(line) ? 'text-primary font-bold' : 'text-foreground/70'}
          >
            {displayLine}
            {i < lines.length - 1 && '\n'}
          </span>
        );
      })}
    </pre>
  );

  return (
    <div ref={fullscreenRef} className={cn("flex flex-col h-full relative", isFullscreen && "bg-background")}>
      {/* Title bar */}
      <div className="px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-3 flex-wrap">
        {editingTitle && !isFullscreen ? (
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
            onClick={() => !isFullscreen && setEditingTitle(true)}
          >
            {song.title}
          </h2>
        )}

        <div className="ml-auto flex gap-2 items-center flex-wrap">
          {/* Transpose controls */}
          {!editing && song.content && (
            <div className="flex items-center gap-1 mr-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 rounded-full"
                onClick={() => setTranspose(t => t - 1)}
                title="Transpose down"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-center">
                {transpose >= 0 ? `+${transpose}` : transpose}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 rounded-full"
                onClick={() => setTranspose(t => t + 1)}
                title="Transpose up"
              >
                <Plus className="h-3 w-3" />
              </Button>

              <div className="ml-2 flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Capo</span>
                <Select value={String(capo)} onValueChange={v => setCapo(Number(v))}>
                  <SelectTrigger className="h-7 w-14 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Column slider in fullscreen */}
          {isFullscreen && (
            <div className="flex items-center gap-2 mr-2">
              <Columns className="h-4 w-4 text-muted-foreground" />
              <div className="w-24">
                <Slider
                  min={1}
                  max={4}
                  step={1}
                  value={[columnCount]}
                  onValueChange={([v]) => setColumnCount(v)}
                />
              </div>
              <span className="text-xs text-muted-foreground w-4">{columnCount}</span>
            </div>
          )}

          {!isFullscreen && (editing ? (
            <Button size="sm" onClick={saveContent} className="rounded-full gap-1.5 h-8 px-4">
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="rounded-full gap-1.5 h-8 px-4">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ))}

          {song.content && (
            <Button size="sm" variant="outline" onClick={toggleFullscreen} className="rounded-full gap-1.5 h-8 px-4">
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className={cn("flex-1 overflow-y-auto px-8 py-6 scroll-smooth", isFullscreen && "px-12 py-8")}>
        {editing && !isFullscreen ? (
          <textarea
            className="w-full h-full min-h-[60vh] bg-transparent outline-none resize-none text-sm leading-7 text-foreground placeholder:text-muted-foreground/50"
            style={{ fontFamily: "'Source Code Pro', monospace" }}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            placeholder="Paste your lyrics and chords here…"
            autoFocus
          />
        ) : song.content ? (
          renderedContent
        ) : (
          <p className="text-muted-foreground italic text-sm">Click "Edit" to paste your lyrics and chords.</p>
        )}
      </div>

      {/* Auto-scroll controls */}
      {!editing && song.content && (
        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3">
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
