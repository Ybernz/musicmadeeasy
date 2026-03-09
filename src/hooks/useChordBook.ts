import { useState, useEffect, useCallback } from 'react';
import { AppState, Folder, Song } from '@/lib/types';

const STORAGE_KEY = 'chord-book-data';

const defaultState: AppState = {
  folders: [],
  songs: [],
  selectedSongId: null,
  expandedFolderIds: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function genId() {
  return crypto.randomUUID();
}

export function useChordBook() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const createFolder = useCallback((name: string) => {
    const folder: Folder = { id: genId(), name, createdAt: Date.now() };
    setState(s => ({ ...s, folders: [...s.folders, folder] }));
    return folder;
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setState(s => ({
      ...s,
      folders: s.folders.map(f => f.id === id ? { ...f, name } : f),
    }));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setState(s => ({
      ...s,
      folders: s.folders.filter(f => f.id !== id),
      songs: s.songs.filter(s2 => s2.folderId !== id),
      selectedSongId: s.songs.find(s2 => s2.id === s.selectedSongId)?.folderId === id ? null : s.selectedSongId,
    }));
  }, []);

  const createSong = useCallback((folderId: string) => {
    const song: Song = { id: genId(), title: 'Untitled Song', content: '', folderId, createdAt: Date.now() };
    setState(s => ({
      ...s,
      songs: [...s.songs, song],
      selectedSongId: song.id,
      expandedFolderIds: s.expandedFolderIds.includes(folderId) ? s.expandedFolderIds : [...s.expandedFolderIds, folderId],
    }));
    return song;
  }, []);

  const renameSong = useCallback((id: string, title: string) => {
    setState(s => ({
      ...s,
      songs: s.songs.map(song => song.id === id ? { ...song, title } : song),
    }));
  }, []);

  const updateSongContent = useCallback((id: string, content: string) => {
    setState(s => ({
      ...s,
      songs: s.songs.map(song => song.id === id ? { ...song, content } : song),
    }));
  }, []);

  const deleteSong = useCallback((id: string) => {
    setState(s => ({
      ...s,
      songs: s.songs.filter(song => song.id !== id),
      selectedSongId: s.selectedSongId === id ? null : s.selectedSongId,
    }));
  }, []);

  const moveSong = useCallback((songId: string, targetFolderId: string) => {
    setState(s => ({
      ...s,
      songs: s.songs.map(song => song.id === songId ? { ...song, folderId: targetFolderId } : song),
    }));
  }, []);

  const selectSong = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedSongId: id }));
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setState(s => ({
      ...s,
      expandedFolderIds: s.expandedFolderIds.includes(id)
        ? s.expandedFolderIds.filter(fid => fid !== id)
        : [...s.expandedFolderIds, id],
    }));
  }, []);

  const selectedSong = state.songs.find(s => s.id === state.selectedSongId) || null;

  return {
    ...state,
    selectedSong,
    createFolder,
    renameFolder,
    deleteFolder,
    createSong,
    renameSong,
    updateSongContent,
    deleteSong,
    moveSong,
    selectSong,
    toggleFolder,
  };
}
