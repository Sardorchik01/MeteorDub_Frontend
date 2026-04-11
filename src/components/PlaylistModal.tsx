import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ListPlus, Check, Loader2, FolderPlus } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { Playlist, Anime } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime | null;
}

export function PlaylistModal({ isOpen, onClose, anime }: PlaylistModalProps) {
  const { t } = useLanguage();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser || !isOpen) return;

    const q = query(
      collection(db, 'playlists'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
      setPlaylists(list.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleCreatePlaylist = async () => {
    if (!newName.trim() || !auth.currentUser) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'playlists'), {
        uid: auth.currentUser.uid,
        name: newName,
        description: newDesc,
        animeIds: anime ? [anime.id] : [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      setNewName('');
      setNewDesc('');
      setIsCreating(false);
      if (anime) {
        onClose();
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlist: Playlist) => {
    if (!anime || !auth.currentUser) return;
    
    if (playlist.animeIds.includes(anime.id)) {
      alert(t('already_in_playlist'));
      return;
    }

    setAddingToId(playlist.id);
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), {
        animeIds: arrayUnion(anime.id),
        updatedAt: Date.now()
      });
      onClose();
    } catch (error) {
      console.error("Error adding to playlist:", error);
    } finally {
      setAddingToId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-blue-500" />
            {t('add_to_playlist')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {anime?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {playlists.length === 0 && !isCreating ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <FolderPlus className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-sm px-4">
                {t('no_playlists')}
              </p>
              <Button 
                variant="outline" 
                className="border-border hover:bg-muted"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> {t('create_playlist')}
              </Button>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist)}
                  disabled={addingToId !== null}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left",
                    "bg-muted/50 border border-border hover:border-blue-500/50 hover:bg-blue-500/5",
                    playlist.animeIds.includes(anime?.id || '') && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">{playlist.animeIds.length} {t('episodes')}</p>
                  </div>
                  {addingToId === playlist.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : playlist.animeIds.includes(anime?.id || '') ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
              
              {!isCreating && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> {t('create_playlist')}
                </Button>
              )}
            </div>
          )}

          {isCreating && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-2xl border border-border animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('playlist_name')}
                </label>
                <Input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My Favorites"
                  className="bg-muted border-border focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('playlist_desc')}
                </label>
                <Textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="bg-muted border-border focus:ring-blue-500 min-h-[80px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => setIsCreating(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={handleCreatePlaylist}
                  disabled={loading || !newName.trim()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('create_playlist')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
