import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Folder, Song } from '@/lib/types';

export function useChordBook() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount / user change
  useEffect(() => {
    if (!user) { setFolders([]); setSongs([]); setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      const [foldersRes, songsRes] = await Promise.all([
        supabase.from('folders').select('*').order('created_at'),
        supabase.from('songs').select('*').order('created_at'),
      ]);

      if (foldersRes.data) setFolders(foldersRes.data.map(f => ({ id: f.id, name: f.name, createdAt: new Date(f.created_at).getTime() })));
      if (songsRes.data) setSongs(songsRes.data.map(s => ({ id: s.id, title: s.title, content: s.content, folderId: s.folder_id, createdAt: new Date(s.created_at).getTime() })));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const createFolder = useCallback(async (name: string) => {
    if (!user) return;
    const { data } = await supabase.from('folders').insert({ name, user_id: user.id }).select().single();
    if (data) {
      const folder: Folder = { id: data.id, name: data.name, createdAt: new Date(data.created_at).getTime() };
      setFolders(f => [...f, folder]);
      return folder;
    }
  }, [user]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    await supabase.from('folders').update({ name }).eq('id', id);
    setFolders(f => f.map(folder => folder.id === id ? { ...folder, name } : folder));
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await supabase.from('songs').delete().eq('folder_id', id);
    await supabase.from('folders').delete().eq('id', id);
    setFolders(f => f.filter(folder => folder.id !== id));
    setSongs(s => s.filter(song => song.folderId !== id));
    setSelectedSongId(prev => {
      const song = songs.find(s => s.id === prev);
      return song?.folderId === id ? null : prev;
    });
  }, [songs]);

  const createSong = useCallback(async (folderId: string) => {
    if (!user) return;
    const { data } = await supabase.from('songs').insert({ folder_id: folderId, user_id: user.id, title: 'Untitled Song', content: '' }).select().single();
    if (data) {
      const song: Song = { id: data.id, title: data.title, content: data.content, folderId: data.folder_id, createdAt: new Date(data.created_at).getTime() };
      setSongs(s => [...s, song]);
      setSelectedSongId(song.id);
      setExpandedFolderIds(ids => ids.includes(folderId) ? ids : [...ids, folderId]);
      return song;
    }
  }, [user]);

  const renameSong = useCallback(async (id: string, title: string) => {
    await supabase.from('songs').update({ title }).eq('id', id);
    setSongs(s => s.map(song => song.id === id ? { ...song, title } : song));
  }, []);

  const updateSongContent = useCallback(async (id: string, content: string) => {
    await supabase.from('songs').update({ content }).eq('id', id);
    setSongs(s => s.map(song => song.id === id ? { ...song, content } : song));
  }, []);

  const deleteSong = useCallback(async (id: string) => {
    await supabase.from('songs').delete().eq('id', id);
    setSongs(s => s.filter(song => song.id !== id));
    setSelectedSongId(prev => prev === id ? null : prev);
  }, []);

  const moveSong = useCallback(async (songId: string, targetFolderId: string) => {
    await supabase.from('songs').update({ folder_id: targetFolderId }).eq('id', songId);
    setSongs(s => s.map(song => song.id === songId ? { ...song, folderId: targetFolderId } : song));
  }, []);

  const selectSong = useCallback((id: string | null) => {
    setSelectedSongId(id);
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolderIds(ids => ids.includes(id) ? ids.filter(fid => fid !== id) : [...ids, id]);
  }, []);

  const selectedSong = songs.find(s => s.id === selectedSongId) || null;

  return {
    folders,
    songs,
    selectedSongId,
    expandedFolderIds,
    selectedSong,
    loading,
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
