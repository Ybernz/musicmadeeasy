import { useState } from 'react';
import { Search, Loader2, Save, X, ArrowLeft, ExternalLink, FolderPlus, Sparkles, Music } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Folder, Song } from '@/lib/types';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

interface Recommendation {
  title: string;
  artist: string;
  reason: string;
}

type Difficulty = 'easier' | 'same' | 'harder';
type Taste = 'similar' | 'random' | 'genre';

const GENRES = ['Pop', 'Rock', 'Country', 'Jazz', 'Blues', 'Folk', 'R&B', 'Latin', 'Gospel', 'Classical', 'Indie', 'Metal', 'Reggae', 'Funk', 'Soul'];

interface ChordSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  songs: Song[];
  onSave: (folderId: string, title: string, content: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<any>;
}

export function ChordSearchDialog({ open, onOpenChange, folders, songs, onSave, onCreateFolder }: ChordSearchDialogProps) {
  const [mode, setMode] = useState<'search' | 'discover'>('search');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Discover state
  const [difficulty, setDifficulty] = useState<Difficulty>('same');
  const [taste, setTaste] = useState<Taste>('similar');
  const [genre, setGenre] = useState('Pop');
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

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

  const handleDiscover = async () => {
    setRecommending(true);
    setRecommendations([]);
    try {
      const existingSongs = songs.map(s => s.title).filter(Boolean);
      const { data, error } = await supabase.functions.invoke('search-chords', {
        body: {
          action: 'recommend',
          difficulty,
          taste,
          genre: taste === 'genre' ? genre : undefined,
          existingSongs,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
      if ((data.recommendations || []).length === 0) {
        toast.info('No recommendations returned. Try different options.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to get recommendations');
    } finally {
      setRecommending(false);
    }
  };

  const handlePickRecommendation = (rec: Recommendation) => {
    const searchQuery = `${rec.title} by ${rec.artist}`;
    setQuery(searchQuery);
    setMode('search');
    setRecommendations([]);
    // Auto-search
    setTimeout(() => {
      setSearching(true);
      setResults([]);
      setContent(null);
      supabase.functions.invoke('search-chords', {
        body: { action: 'search', query: searchQuery },
      }).then(({ data, error }) => {
        if (error || data?.error) {
          toast.error('Search failed');
        } else {
          setResults(data.results || []);
          if ((data.results || []).length === 0) toast.info('No chord results found for this song.');
        }
      }).finally(() => setSearching(false));
    }, 50);
  };

  const resetState = () => {
    setResults([]);
    setContent(null);
    setQuery('');
    setCreatingFolder(false);
    setNewFolderName('');
    setRecommendations([]);
  };

  const goBack = () => {
    setContent(null);
  };

  const isLoading = searching || fetching || recommending;

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
            {mode === 'discover' ? <Sparkles className="h-5 w-5 text-primary" /> : <Search className="h-5 w-5 text-primary" />}
            {content ? 'Chord Preview' : mode === 'discover' ? 'Discover Songs' : 'Find Chords'}
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        {!content && !isLoading && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setMode('search')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'search' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Search className="h-3.5 w-3.5 inline mr-1.5" />
              Search
            </button>
            <button
              onClick={() => setMode('discover')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'discover' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
              Discover
            </button>
          </div>
        )}

        {/* Search mode */}
        {mode === 'search' && !content && !isLoading && (
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
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Discover mode */}
        {mode === 'discover' && !content && !isLoading && recommendations.length === 0 && (
          <div className="space-y-4">
            {/* Difficulty */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Difficulty</label>
              <div className="flex gap-1.5">
                {([['easier', 'Easier'], ['same', 'Same'], ['harder', 'Harder']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setDifficulty(val)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${difficulty === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Taste */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Music Style</label>
              <div className="flex gap-1.5 flex-wrap">
                {([['similar', 'Similar to mine'], ['random', 'Surprise me'], ['genre', 'Pick a genre']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setTaste(val)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${taste === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre selector */}
            {taste === 'genre' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Genre</label>
                <div className="flex gap-1.5 flex-wrap">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors border ${genre === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-accent'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleDiscover} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Get Recommendations
            </Button>

            {songs.length === 0 && taste === 'similar' && (
              <p className="text-xs text-muted-foreground text-center">
                You have no saved songs yet. Recommendations will be based on popular beginner songs.
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">
              {searching ? 'Searching chord sites…' : fetching ? 'Fetching & formatting chords…' : 'Finding songs for you…'}
            </p>
          </div>
        )}

        {/* Recommendations list */}
        {!isLoading && !content && recommendations.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Click a song to find its chords</p>
              <Button variant="ghost" size="sm" onClick={() => setRecommendations([])} className="h-7 text-xs gap-1">
                <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0 max-h-[55vh]">
              <div className="space-y-1 pr-3">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => handlePickRecommendation(rec)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{rec.artist}</p>
                      </div>
                      <Music className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rec.reason}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Search results */}
        {!searching && !fetching && !content && mode === 'search' && results.length > 0 && (
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

        {/* Chord preview + save */}
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
