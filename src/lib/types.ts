export interface Song {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface AppState {
  folders: Folder[];
  songs: Song[];
  selectedSongId: string | null;
  expandedFolderIds: string[];
}
