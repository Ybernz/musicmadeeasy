import { useState } from 'react';
import { Search, Loader2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Folder } from '@/lib/types';

interface ChordSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  onSave: (folderId: string, title: string, content: string) => Promise<void>;
}

export function ChordSearchDialog({ open, onOpenChange, folders, onSave }: ChordSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-chords', {
        body: { query: query.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({ title: data.title, content: data.content });
    } catch (e: any) {
      toast.error(e.message || 'Failed to find chords');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedFolderId) return;
    try {
      await onSave(selectedFolderId, result.title, result.content);
      toast.success('Song saved!');
      setResult(null);
      setQuery('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save song');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Chords
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Song name — e.g. Wonderwall by Oasis"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Generating chord sheet…</p>
          </div>
        )}

        {result && (
          <>
            <ScrollArea className="flex-1 min-h-0 max-h-[50vh] border rounded-lg p-4 bg-muted/30">
              <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                {result.content}
              </pre>
            </ScrollArea>

            <div className="flex items-center gap-2 pt-2">
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
              <Button onClick={handleSave} className="gap-1.5">
                <Save className="h-4 w-4" /> Save to Folder
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setResult(null)} title="Discard">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
