import * as React from 'react';
import { 
  Plus, Search, Filter, MoreVertical, 
  Edit, Trash2, ExternalLink, Play,
  CheckCircle2, AlertCircle, Upload, FileVideo, Image as ImageIcon, Loader2,
  Check, ListPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNotifications } from '../contexts/NotificationContext';
import { Anime, Tariff } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AnimeManagement() {
  const { t } = useLanguage();
  const { sendNotification } = useNotifications();
  const [animes, setAnimes] = React.useState<Anime[]>([]);
  const [tariffs, setTariffs] = React.useState<Tariff[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingAnime, setEditingAnime] = React.useState<Anime | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [relatedSearch, setRelatedSearch] = React.useState('');
  const [telegramLink, setTelegramLink] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);
  const [telegramQueue, setTelegramQueue] = React.useState<any[]>([]);
  const [showQueue, setShowQueue] = React.useState(false);

  const filteredRelatedAnimes = animes.filter(a => 
    a.id !== editingAnime?.id && 
    a.title.toLowerCase().includes(relatedSearch.toLowerCase())
  );
  const [newAnime, setNewAnime] = React.useState<Partial<Anime>>({
    title: '',
    description: '',
    genre: [],
    accessType: [],
    status: 'Ongoing',
    contentType: 'full',
    year: undefined,
    rating: undefined,
    episodes: undefined,
    videoUrl: '',
    thumbnail: '',
    telegramFileId: '',
    relatedAnimeId: ''
  });

  React.useEffect(() => {
    // Fetch Animes
    const qAnime = query(collection(db, 'animes'), orderBy('createdAt', 'desc'));
    const unsubAnime = onSnapshot(qAnime, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Anime[];
      setAnimes(data);
    });

    // Fetch Tariffs
    const qTariff = query(collection(db, 'tariffs'), orderBy('createdAt', 'desc'));
    const unsubTariff = onSnapshot(qTariff, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tariff[];
      setTariffs(data);
    });

    // Fetch Telegram Queue
    const qQueue = query(collection(db, 'telegram_queue'), orderBy('createdAt', 'desc'), limit(20));
    const unsubQueue = onSnapshot(qQueue, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTelegramQueue(data);
    });

    return () => {
      unsubAnime();
      unsubTariff();
      unsubQueue();
    };
  }, []);

  const handleResolveLink = async () => {
    if (!telegramLink) return;
    setIsResolving(true);
    try {
      const response = await fetch(`/api/telegram/resolve?url=${encodeURIComponent(telegramLink)}`);
      const data = await response.json();
      if (data.fileId) {
        setNewAnime({ ...newAnime, telegramFileId: data.fileId });
        sendNotification('all', 'Link Resolved!', 'Telegram video found and mapped successfully.', 'success');
      } else {
        alert(data.error || 'Could not resolve link');
      }
    } catch (error) {
      console.error('Resolve failed:', error);
      alert('Failed to connect to server');
    } finally {
      setIsResolving(false);
    }
  };
  const handleFileUpload = async () => {
    if (!videoFile && !thumbnailFile) return null;
    
    setIsUploading(true);
    const formData = new FormData();
    if (videoFile) formData.append('video', videoFile);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAnime = async () => {
    let videoUrl = newAnime.videoUrl;
    let thumbnailUrl = newAnime.thumbnail;

    if (videoFile || thumbnailFile) {
      const uploadData = await handleFileUpload();
      if (uploadData) {
        if (uploadData.videoUrl) videoUrl = uploadData.videoUrl;
        if (uploadData.thumbnailUrl) thumbnailUrl = uploadData.thumbnailUrl;
      }
    }

    if (!videoUrl || !thumbnailUrl) {
      alert('Please provide both video and thumbnail (upload or URL)');
      return;
    }

    const animeToAdd = {
      ...newAnime,
      videoUrl,
      thumbnail: thumbnailUrl,
      rating: Number(newAnime.rating) || 0,
      year: Number(newAnime.year) || new Date().getFullYear(),
      episodes: Number(newAnime.episodes) || 0,
      views: 0,
      createdAt: Date.now()
    };
    
    try {
      if (editingAnime) {
        await updateDoc(doc(db, 'animes', editingAnime.id), animeToAdd);
        sendNotification('all', 'Anime Updated!', `${animeToAdd.title} has been updated.`, 'success');
      } else {
        await addDoc(collection(db, 'animes'), animeToAdd);
        sendNotification('all', 'New Anime Added!', `${animeToAdd.title} is now available to watch.`, 'success');
      }

      setIsAddDialogOpen(false);
      setEditingAnime(null);
      setNewAnime({
        title: '',
        description: '',
        genre: [],
        accessType: [],
      status: 'Ongoing',
      contentType: 'full',
      year: undefined,
        rating: undefined,
        episodes: undefined,
        videoUrl: '',
        thumbnail: '',
        relatedAnimeId: ''
      });
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error) {
      console.error('Error saving anime:', error);
      alert('Failed to save anime to database.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'animes', id));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting anime:', error);
    }
  };

  const openAdd = () => {
    setEditingAnime(null);
    setNewAnime({
      title: '',
      description: '',
      genre: [],
      accessType: [],
      status: 'Ongoing',
      contentType: 'full',
      year: undefined,
      rating: undefined,
      episodes: undefined,
      videoUrl: '',
      thumbnail: '',
      telegramFileId: '',
      relatedAnimeId: ''
    });
    setIsAddDialogOpen(true);
  };

  const openEdit = (anime: Anime) => {
    setEditingAnime(anime);
    setNewAnime({
      ...anime,
      telegramFileId: anime.telegramFileId || ''
    });
    setIsAddDialogOpen(true);
  };

  const toggleTariff = (tariffId: string) => {
    setNewAnime(prev => {
      const currentAccess = prev.accessType === 'public' ? [] : (prev.accessType as string[]);
      const newAccess = currentAccess.includes(tariffId)
        ? currentAccess.filter(id => id !== tariffId)
        : [...currentAccess, tariffId];
      return { ...prev, accessType: newAccess };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('anime_catalog')}</h2>
          <p className="text-muted-foreground text-sm">Manage your streaming library and upload new content.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6"
            onClick={openAdd}
          >
            <Plus className="mr-2 h-5 w-5" />
            {t('add_new')}
          </Button>
          <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingAnime ? t('edit') : t('add_new')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t('anime_title')}</label>
                <Input 
                  placeholder="Enter anime title..." 
                  className="bg-muted border-border h-12"
                  value={newAnime.title || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, title: e.target.value })}
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t('anime_desc')}</label>
                <textarea 
                  placeholder="Enter detailed description..." 
                  className="w-full bg-muted border border-border rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAnime.description || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">{t('anime_year')}</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 2024" 
                  className="bg-muted border-border"
                  value={newAnime.year || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, year: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">{t('anime_rating')}</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 8.5" 
                  className="bg-muted border-border"
                  value={newAnime.rating || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, rating: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">{t('anime_genre')}</label>
                <Input 
                  placeholder="Action, Adventure, Fantasy" 
                  className="bg-muted border-border"
                  value={newAnime.genre?.join(', ') || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, genre: e.target.value.split(',').map(g => g.trim()) })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">{t('anime_status')}</label>
                <select 
                  className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAnime.status}
                  onChange={(e) => setNewAnime({ ...newAnime, status: e.target.value as any })}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">{t('content_type')}</label>
                <select 
                  className="w-full bg-muted border border-border rounded-lg h-10 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAnime.contentType || 'full'}
                  onChange={(e) => setNewAnime({ ...newAnime, contentType: e.target.value as any })}
                >
                  <option value="full">{t('full_anime')}</option>
                  <option value="trailer">{t('trailer')}</option>
                  <option value="edit">{t('edit_clip')}</option>
                </select>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t('related_anime')}</label>
                
                <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder={t('search')}
                      className="w-full bg-muted border border-border rounded-lg h-9 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={relatedSearch}
                      onChange={(e) => setRelatedSearch(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-[200px] border border-border rounded-lg bg-background">
                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => setNewAnime({ ...newAnime, relatedAnimeId: '' })}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                          !newAnime.relatedAnimeId ? "bg-blue-500/10 text-blue-500 font-medium" : "hover:bg-accent"
                        )}
                      >
                        <span>{t('no_related')}</span>
                        {!newAnime.relatedAnimeId && <Check className="h-4 w-4" />}
                      </button>

                      {filteredRelatedAnimes.map((anime) => (
                        <button
                          key={anime.id}
                          type="button"
                          onClick={() => setNewAnime({ ...newAnime, relatedAnimeId: anime.id })}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                            newAnime.relatedAnimeId === anime.id ? "bg-blue-500/10 text-blue-500 font-medium" : "hover:bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <img src={anime.thumbnail} className="h-8 w-6 object-cover rounded shadow-sm" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="truncate max-w-[200px]">{anime.title}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{anime.contentType || 'full'}</span>
                            </div>
                          </div>
                          {newAnime.relatedAnimeId === anime.id && <Check className="h-4 w-4" />}
                        </button>
                      ))}

                      {filteredRelatedAnimes.length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          No animes found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  {newAnime.contentType === 'edit' 
                    ? "Select the full anime this edit belongs to." 
                    : "Select the next episode or related part."}
                </p>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t('access_type')}</label>
                <div className="space-y-4">
                  <button 
                    onClick={() => setNewAnime({ ...newAnime, accessType: 'public' })}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between",
                      newAnime.accessType === 'public' ? "border-blue-500 bg-blue-500/10" : "border-border bg-muted hover:border-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                        newAnime.accessType === 'public' ? "border-blue-500 bg-blue-500" : "border-border"
                      )}>
                        {newAnime.accessType === 'public' && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{t('public_access')}</p>
                        <p className="text-xs text-muted-foreground">Available for everyone, including non-logged users</p>
                      </div>
                    </div>
                  </button>

                  <div className={cn(
                    "p-4 rounded-2xl border-2 border-border bg-muted/50 space-y-4 transition-opacity",
                    newAnime.accessType === 'public' ? "opacity-40" : "opacity-100"
                  )}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Premium Tariffs</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tariffs.map((tariff) => {
                        const isSelected = Array.isArray(newAnime.accessType) && newAnime.accessType.includes(tariff.id);
                        return (
                          <div 
                            key={tariff.id}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                              isSelected ? "border-yellow-500/50 bg-yellow-500/5" : "border-border hover:border-accent"
                            )}
                            onClick={() => toggleTariff(tariff.id)}
                          >
                            <Checkbox 
                              id={`tariff-${tariff.id}`} 
                              checked={isSelected}
                              onCheckedChange={() => toggleTariff(tariff.id)}
                              className="border-border data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor={`tariff-${tariff.id}`}
                                className="text-sm font-medium cursor-pointer truncate block"
                              >
                                {tariff.name}
                              </Label>
                              <p className="text-[10px] text-muted-foreground">{tariff.price || 'Premium'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Array.isArray(newAnime.accessType) && newAnime.accessType.length === 0 && (
                      <p className="text-[10px] text-yellow-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Select at least one tariff or choose Public
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">Telegram Automation</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] h-7 gap-1"
                    onClick={() => setShowQueue(!showQueue)}
                  >
                    <ListPlus className="h-3 w-3" />
                    {showQueue ? 'Hide Queue' : 'Show Recent Videos'}
                  </Button>
                </div>

                {showQueue && (
                  <div className="bg-muted/50 border border-border rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Recent Telegram Videos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {telegramQueue.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-2 rounded-lg bg-background border border-border flex items-center justify-between group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium truncate">{item.fileName}</p>
                            <p className="text-[8px] text-muted-foreground">{item.source === 'channel_post' ? 'Channel Post' : 'Direct Bot'}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              setNewAnime({ ...newAnime, telegramFileId: item.fileId });
                              if (item.postUrl) setTelegramLink(item.postUrl);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {telegramQueue.length === 0 && (
                        <p className="text-[10px] text-muted-foreground col-span-2 text-center py-2 italic">
                          No videos in queue. Send a video to the bot or post in the channel.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input 
                      placeholder="Paste Telegram Post Link (e.g., https://t.me/channel/123)" 
                      className="bg-muted border-border pr-20"
                      value={telegramLink}
                      onChange={(e) => setTelegramLink(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      className="absolute right-1 top-1 h-8 bg-blue-500 hover:bg-blue-600"
                      onClick={handleResolveLink}
                      disabled={isResolving || !telegramLink}
                    >
                      {isResolving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Auto-Map'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Video Source</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Direct Video URL</label>
                    <Input 
                      placeholder="https://example.com/video.mp4" 
                      className="bg-muted border-border"
                      value={newAnime.videoUrl}
                      onChange={(e) => setNewAnime({ ...newAnime, videoUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Telegram File ID (Optional)</label>
                    <Input 
                      placeholder="BAACAgIAAxkBA..." 
                      className="bg-muted border-border"
                      value={newAnime.telegramFileId}
                      onChange={(e) => setNewAnime({ ...newAnime, telegramFileId: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  If Telegram File ID is provided, it will be used as the primary video source.
                </p>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Local Uploads (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      id="video-upload" 
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="video-upload"
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                        videoFile ? "border-blue-500 bg-blue-500/5" : "border-border bg-muted hover:border-accent"
                      )}
                    >
                      <FileVideo className={cn("h-8 w-8", videoFile ? "text-blue-500" : "text-muted-foreground")} />
                      <span className="text-xs font-medium">{videoFile ? videoFile.name : t('upload_video')}</span>
                    </label>
                  </div>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="thumb-upload" 
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="thumb-upload"
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                        thumbnailFile ? "border-blue-500 bg-blue-500/5" : "border-border bg-muted hover:border-accent"
                      )}
                    >
                      <ImageIcon className={cn("h-8 w-8", thumbnailFile ? "text-blue-500" : "text-muted-foreground")} />
                      <span className="text-xs font-medium">{thumbnailFile ? thumbnailFile.name : t('upload_thumbnail')}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t('video_url')} (or use upload above)</label>
                <Input 
                  placeholder="https://..." 
                  className="bg-muted border-border"
                  value={newAnime.videoUrl || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, videoUrl: e.target.value })}
                  disabled={!!videoFile}
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">{t('thumbnail_url')} (or use upload above)</label>
                <Input 
                  placeholder="https://..." 
                  className="bg-muted border-border"
                  value={newAnime.thumbnail || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, thumbnail: e.target.value })}
                  disabled={!!thumbnailFile}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>{t('cancel')}</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8" onClick={handleAddAnime} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : t('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-10 bg-muted border-none" />
        </div>
        <Button variant="outline" className="border-border">
          <Filter className="mr-2 h-4 w-4" />
          {t('filter')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {animes.map((anime) => (
          <Card key={anime.id} className="bg-card border-border hover:bg-accent/50 transition-colors group">
            <CardContent className="p-4 flex items-center gap-6">
              <div className="h-20 w-16 rounded-lg overflow-hidden shrink-0 relative">
                <img src={anime.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold truncate">{anime.title}</h4>
                  <div className="flex flex-wrap gap-1">
                    {anime.accessType === 'public' ? (
                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/20 text-blue-500 border-blue-500/50">
                        PUBLIC
                      </Badge>
                    ) : (
                      Array.isArray(anime.accessType) && anime.accessType.map(tid => {
                        const t = tariffs.find(tariff => tariff.id === tid);
                        return (
                          <Badge key={tid} className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                            {t?.name || 'PREMIUM'}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{anime.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground">{anime.year}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">{anime.genre.join(', ')}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-yellow-500 font-bold">IMDb {anime.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => openEdit(anime)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={() => setDeletingId(anime.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('delete')}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this anime? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" onClick={() => setDeletingId(null)}>{t('cancel')}</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
