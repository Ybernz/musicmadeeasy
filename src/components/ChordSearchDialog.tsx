import { useState } from 'react';
import { Search, Loader2, Save, X, ArrowLeft, ExternalLink, FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Folder } from '@/lib/types';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

interface ChordSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  onSave: (folderId: string, title: string, content: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<any>;
}

export function ChordSearchDialog({ open, onOpenChange, folders, onSave, onCreateFolder }: ChordSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-chords', {
        body: { action: 'search', query: query.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        toast.info('No results found. Try a different search.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleFetch = async (result: SearchResult) => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-chords', {
        body: { action: 'fetch', url: result.url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent({ title: result.title, content: data.content });
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch chords');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!content || !selectedFolderId) return;
    try {
      await onSave(selectedFolderId, content.title, content.content);
      toast.success('Song saved!');
      resetState();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save song');
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const folder = await onCreateFolder(name);
      if (folder) {
        setSelectedFolderId(folder.id);
      }
      setCreatingFolder(false);
      setNewFolderName('');
    } catch {
      toast.error('Failed to create folder');
    }
  };

  const resetState = () => {
    setResults([]);
    setContent(null);
    setQuery('');
    setCreatingFolder(false);
    setNewFolderName('');
  };

  const goBack = () => {
    setContent(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {content && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Search className="h-5 w-5 text-primary" />
            {content ? 'Chord Preview' : 'Find Chords'}
          </DialogTitle>
        </DialogHeader>

        {!content && (
          <div className="flex gap-2">
            <Input
              placeholder="Song name — e.g. Wonderwall by Oasis"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              disabled={searching || fetching}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {(searching || fetching) && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">{searching ? 'Searching chord sites…' : 'Fetching & formatting chords…'}</p>
          </div>
        )}

        {!searching && !fetching && !content && results.length > 0 && (
          <ScrollArea className="flex-1 min-h-0 max-h-[55vh]">
            <div className="space-y-1 pr-3">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleFetch(r)}
                  className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {r.source}
                    </span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {content && !fetching && (
          <>
            <ScrollArea className="flex-1 min-h-0 max-h-[50vh] border rounded-lg p-4 bg-muted/30">
              <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                {content.content}
              </pre>
            </ScrollArea>

            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {creatingFolder ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    autoFocus
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
                    }}
                    className="w-36 h-9"
                  />
                  <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="h-9">
                    Create
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setCreatingFolder(false); setNewFolderName(''); }} className="h-9">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => setCreatingFolder(true)} className="h-9 gap-1 px-2" title="New folder">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button onClick={handleSave} className="gap-1.5" disabled={!selectedFolderId}>
                <Save className="h-4 w-4" /> Save to Folder
              </Button>
              <Button variant="ghost" size="icon" onClick={goBack} title="Discard">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
