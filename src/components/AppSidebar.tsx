import { useState, useRef } from 'react';
import { ChevronRight, Trash2, MoreHorizontal } from 'lucide-react';
import { Folder, Song } from '@/lib/types';
import { cn } from '@/lib/utils';
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
      className="bg-transparent border-b border-primary outline-none text-sm w-full px-1 font-mono text-foreground"
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

  const songsInFolder = (folderId: string) => songs.filter(s => s.folderId === folderId);

  return (
    <aside className="w-full h-full flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">Chord Book</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folders.map(folder => {
          const expanded = expandedFolderIds.includes(folder.id);
          const folderSongs = songsInFolder(folder.id);

          return (
            <div key={folder.id} className="mb-1">
              <div className="flex items-center group rounded px-2 py-1.5 hover:bg-sidebar-accent cursor-pointer">
                <button onClick={() => props.onToggleFolder(folder.id)} className="mr-1 text-muted-foreground">
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 text-muted-foreground hover:text-foreground">
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
                <div className="ml-4 pl-2 border-l border-sidebar-border">
                  {folderSongs.map(song => (
                    <div
                      key={song.id}
                      className={cn(
                        "flex items-center group rounded px-2 py-1 cursor-pointer text-sm",
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
                          <button className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 text-muted-foreground hover:text-foreground">
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
                    <p className="text-xs text-muted-foreground px-2 py-1 italic">No songs yet</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-sidebar-border flex gap-2">
        {creatingFolder ? (
          <InlineRename
            value=""
            onSave={v => { props.onCreateFolder(v); setCreatingFolder(false); }}
            onCancel={() => setCreatingFolder(false)}
          />
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            + New Folder
          </button>
        )}
      </div>
    </aside>
  );
}
