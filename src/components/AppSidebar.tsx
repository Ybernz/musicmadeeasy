import { useState, useRef } from 'react';
import { ChevronRight, MoreHorizontal, Music, Sun, Moon } from 'lucide-react';
import { Folder, Song } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  folders: Folder[];
  songs: Song[];
  selectedSongId: string | null;
  expandedFolderIds: string[];
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateSong: (folderId: string) => void;
  onRenameSong: (id: string, title: string) => void;
  onDeleteSong: (id: string) => void;
  onMoveSong: (songId: string, targetFolderId: string) => void;
  onSelectSong: (id: string | null) => void;
  onToggleFolder: (id: string) => void;
}

function InlineRename({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={ref}
      autoFocus
      className="bg-transparent border-b-2 border-primary outline-none text-sm w-full px-1 font-mono text-foreground"
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={() => { if (text.trim()) onSave(text.trim()); else onCancel(); }}
      onKeyDown={e => {
        if (e.key === 'Enter' && text.trim()) onSave(text.trim());
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

export function AppSidebar(props: SidebarProps) {
  const { folders, songs, selectedSongId, expandedFolderIds } = props;
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingSongId, setRenamingSongId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const songsInFolder = (folderId: string) => songs.filter(s => s.folderId === folderId);

  return (
    <aside className="w-full h-full flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Music className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-base font-bold tracking-tight text-sidebar-foreground flex-1">Chord Book</h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          title="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {folders.map(folder => {
          const expanded = expandedFolderIds.includes(folder.id);
          const folderSongs = songsInFolder(folder.id);

          return (
            <div key={folder.id}>
              <div className="flex items-center group rounded-lg px-2.5 py-2 hover:bg-sidebar-accent transition-colors cursor-pointer">
                <button onClick={() => props.onToggleFolder(folder.id)} className="mr-1.5 text-muted-foreground">
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-90")} />
                </button>

                {renamingFolderId === folder.id ? (
                  <InlineRename
                    value={folder.name}
                    onSave={v => { props.onRenameFolder(folder.id, v); setRenamingFolderId(null); }}
                    onCancel={() => setRenamingFolderId(null)}
                  />
                ) : (
                  <span
                    className="text-sm font-medium text-sidebar-foreground flex-1 truncate"
                    onClick={() => props.onToggleFolder(folder.id)}
                  >
                    {folder.name}
                  </span>
                )}

                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1.5 font-normal opacity-60">
                  {folderSongs.length}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 text-muted-foreground hover:text-foreground transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => props.onCreateSong(folder.id)}>New Song</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRenamingFolderId(folder.id)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Delete folder and all its songs?')) props.onDeleteFolder(folder.id); }}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {expanded && (
                <div className="ml-5 pl-3 border-l-2 border-sidebar-border/60 my-0.5">
                  {folderSongs.map(song => (
                    <div
                      key={song.id}
                      className={cn(
                        "flex items-center group rounded-md px-2.5 py-1.5 cursor-pointer text-sm transition-colors",
                        selectedSongId === song.id
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {renamingSongId === song.id ? (
                        <InlineRename
                          value={song.title}
                          onSave={v => { props.onRenameSong(song.id, v); setRenamingSongId(null); }}
                          onCancel={() => setRenamingSongId(null)}
                        />
                      ) : (
                        <span className="flex-1 truncate" onClick={() => props.onSelectSong(song.id)}>
                          {song.title}
                        </span>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 text-muted-foreground hover:text-foreground transition-opacity">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => setRenamingSongId(song.id)}>Rename</DropdownMenuItem>
                          {folders.length > 1 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Move to…</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {folders.filter(f => f.id !== song.folderId).map(f => (
                                  <DropdownMenuItem key={f.id} onClick={() => props.onMoveSong(song.id, f.id)}>{f.name}</DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Delete this song?')) props.onDeleteSong(song.id); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  {folderSongs.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2.5 py-1.5 italic">No songs yet</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        {creatingFolder ? (
          <InlineRename
            value=""
            onSave={v => { props.onCreateFolder(v); setCreatingFolder(false); }}
            onCancel={() => setCreatingFolder(false)}
          />
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            + New Folder
          </button>
        )}
      </div>
    </aside>
  );
}
