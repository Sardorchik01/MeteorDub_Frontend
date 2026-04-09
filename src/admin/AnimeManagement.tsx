import * as React from 'react';
import { 
  Plus, Search, Filter, MoreVertical, 
  Edit, Trash2, ExternalLink, Play,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MOCK_ANIMES } from '../constants';
import { Anime } from '../types';
import { cn } from '@/lib/utils';

export default function AnimeManagement() {
  const [animes, setAnimes] = React.useState<Anime[]>(MOCK_ANIMES);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newAnime, setNewAnime] = React.useState<Partial<Anime>>({
    genre: [],
    accessType: 'public',
    status: 'Ongoing'
  });

  const handleAddAnime = () => {
    // In a real app, this would save to Firestore
    const animeToAdd = {
      ...newAnime,
      id: Date.now().toString(),
      rating: Number(newAnime.rating) || 0,
      year: Number(newAnime.year) || new Date().getFullYear(),
      episodes: Number(newAnime.episodes) || 0,
    } as Anime;
    
    setAnimes([animeToAdd, ...animes]);
    setIsAddDialogOpen(false);
    setNewAnime({ genre: [], accessType: 'public', status: 'Ongoing' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Anime Catalog</h2>
          <p className="text-zinc-500 text-sm">Manage your streaming library and upload new content.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Upload New Anime
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Post New Anime</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-zinc-400">Anime Title</label>
                <Input 
                  placeholder="Enter anime title..." 
                  className="bg-zinc-900 border-zinc-800 h-12"
                  value={newAnime.title || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, title: e.target.value })}
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-zinc-400">Description</label>
                <textarea 
                  placeholder="Enter detailed description..." 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAnime.description || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-400">Release Year</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 2024" 
                  className="bg-zinc-900 border-zinc-800"
                  value={newAnime.year || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, year: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-400">IMDb Rating</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 8.5" 
                  className="bg-zinc-900 border-zinc-800"
                  value={newAnime.rating || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, rating: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-400">Genre (comma separated)</label>
                <Input 
                  placeholder="Action, Adventure, Fantasy" 
                  className="bg-zinc-900 border-zinc-800"
                  onChange={(e) => setNewAnime({ ...newAnime, genre: e.target.value.split(',').map(g => g.trim()) })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-400">Status</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAnime.status}
                  onChange={(e) => setNewAnime({ ...newAnime, status: e.target.value as any })}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-zinc-400">Access Type</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setNewAnime({ ...newAnime, accessType: 'public' })}
                    className={cn(
                      "flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                      newAnime.accessType === 'public' ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    )}
                  >
                    <div className="text-left">
                      <p className="font-bold">Public</p>
                      <p className="text-xs text-zinc-500">Available for everyone</p>
                    </div>
                    {newAnime.accessType === 'public' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                  </button>
                  <button 
                    onClick={() => setNewAnime({ ...newAnime, accessType: 'premium' })}
                    className={cn(
                      "flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                      newAnime.accessType === 'premium' ? "border-yellow-500 bg-yellow-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    )}
                  >
                    <div className="text-left">
                      <p className="font-bold">Premium</p>
                      <p className="text-xs text-zinc-500">Only for subscribers</p>
                    </div>
                    {newAnime.accessType === 'premium' && <CheckCircle2 className="h-5 w-5 text-yellow-500" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-zinc-400">Video URL</label>
                <Input 
                  placeholder="https://..." 
                  className="bg-zinc-900 border-zinc-800"
                  value={newAnime.videoUrl || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, videoUrl: e.target.value })}
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-medium text-zinc-400">Thumbnail URL</label>
                <Input 
                  placeholder="https://..." 
                  className="bg-zinc-900 border-zinc-800"
                  value={newAnime.thumbnail || ''}
                  onChange={(e) => setNewAnime({ ...newAnime, thumbnail: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8" onClick={handleAddAnime}>
                Publish Anime
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder="Search catalog..." className="pl-10 bg-zinc-900 border-none" />
        </div>
        <Button variant="outline" className="border-zinc-800">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {animes.map((anime) => (
          <Card key={anime.id} className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900/50 transition-colors group">
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
                  <Badge className={cn(
                    "text-[10px] px-1.5 py-0",
                    anime.accessType === 'premium' ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : "bg-blue-500/20 text-blue-500 border-blue-500/50"
                  )}>
                    {anime.accessType.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-1">{anime.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-zinc-400">{anime.year}</span>
                  <span className="text-[10px] text-zinc-400">•</span>
                  <span className="text-[10px] text-zinc-400">{anime.genre.join(', ')}</span>
                  <span className="text-[10px] text-zinc-400">•</span>
                  <span className="text-[10px] text-yellow-500 font-bold">IMDb {anime.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
