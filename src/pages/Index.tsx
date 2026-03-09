import { useChordBook } from '@/hooks/useChordBook';
import { AppSidebar } from '@/components/AppSidebar';
import { SongViewer } from '@/components/SongViewer';
import { useState } from 'react';
import { Menu, X, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const book = useChordBook();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile toggle */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-md"
        onClick={() => setSidebarOpen(s => !s)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-200
        fixed md:relative z-40
        w-72 md:w-[300px] h-full shrink-0
      `}>
        <AppSidebar
          folders={book.folders}
          songs={book.songs}
          selectedSongId={book.selectedSongId}
          expandedFolderIds={book.expandedFolderIds}
          onCreateFolder={book.createFolder}
          onRenameFolder={book.renameFolder}
          onDeleteFolder={book.deleteFolder}
          onCreateSong={book.createSong}
          onRenameSong={book.renameSong}
          onDeleteSong={book.deleteSong}
          onMoveSong={book.moveSong}
          onSelectSong={(id) => { book.selectSong(id); setSidebarOpen(false); }}
          onToggleFolder={book.toggleFolder}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 h-full overflow-hidden bg-background">
        {book.selectedSong ? (
          <SongViewer
            song={book.selectedSong}
            onUpdateContent={book.updateSongContent}
            onRenameSong={book.renameSong}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Music2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: "'Source Code Pro', monospace" }}>
                Chord Book
              </h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Your digital music stand. Create a folder, add songs, and paste your chords &amp; lyrics to start playing.
              </p>
              {book.folders.length === 0 && (
                <Button
                  onClick={() => book.createFolder('My Songs')}
                  className="rounded-full px-6"
                >
                  + Create your first folder
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
