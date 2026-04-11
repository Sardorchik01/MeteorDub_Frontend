import React from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Image as ImageIcon, 
  Film, 
  Loader2, 
  X,
  Eye,
  Calendar
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Story {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: 'image' | 'video';
  title?: string;
  link?: string;
  expiresAt: number;
  createdAt: any;
}

export default function StoryManagement() {
  const [stories, setStories] = React.useState<Story[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [thumbFile, setThumbFile] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(24); // Default 24 hours
  const [title, setTitle] = React.useState('');
  const [link, setLink] = React.useState('');
  const [mediaType, setMediaType] = React.useState<'image' | 'video'>('image');

  React.useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Story[];
      setStories(data);
    });
    return () => unsub();
  }, []);

  const handleUpload = async () => {
    if (!mediaFile || !thumbFile) {
      alert('Please select both media and preview thumbnail');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('storyMedia', mediaFile);
    formData.append('storyThumbnail', thumbFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.storyMediaUrl && data.storyThumbnailUrl) {
        const expiresAt = Date.now() + (duration * 60 * 60 * 1000);
        
        await addDoc(collection(db, 'stories'), {
          mediaUrl: data.storyMediaUrl,
          thumbnailUrl: data.storyThumbnailUrl,
          mediaType,
          title,
          link,
          expiresAt,
          createdAt: serverTimestamp()
        });

        // Reset form
        setMediaFile(null);
        setThumbFile(null);
        setTitle('');
        setLink('');
        alert('Story uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteStory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      await deleteDoc(doc(db, 'stories', id));
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Story Management</h1>
          <p className="text-muted-foreground">Upload and manage short-lived stories (1-60 hours).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <Card className="p-6 border-2 border-border bg-card/50 lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            New Story
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Media Type</label>
              <div className="flex gap-2">
                <Button 
                  variant={mediaType === 'image' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setMediaType('image')}
                >
                  <ImageIcon className="h-4 w-4" /> Image
                </Button>
                <Button 
                  variant={mediaType === 'video' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setMediaType('video')}
                >
                  <Film className="h-4 w-4" /> Video
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Main Media ({mediaType})</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept={mediaType === 'image' ? "image/*" : "video/*"}
                  className="hidden" 
                  id="story-media" 
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="story-media"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    mediaFile ? "border-blue-500 bg-blue-500/5" : "border-border bg-muted hover:border-accent"
                  )}
                >
                  {mediaType === 'image' ? <ImageIcon className="h-8 w-8" /> : <Film className="h-8 w-8" />}
                  <span className="text-xs font-medium text-center truncate w-full px-2">
                    {mediaFile ? mediaFile.name : 'Select Media'}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preview Thumbnail (Circle)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="story-thumb" 
                  onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="story-thumb"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    thumbFile ? "border-green-500 bg-green-500/5" : "border-border bg-muted hover:border-accent"
                  )}
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs font-medium text-center truncate w-full px-2">
                    {thumbFile ? thumbFile.name : 'Select Thumbnail'}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Duration (Hours)
                <span className="text-blue-500 font-bold">{duration}h</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="60" 
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1h</span>
                <span>24h</span>
                <span>60h</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title (Optional)</label>
              <Input 
                placeholder="Story title..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link (Optional)</label>
              <Input 
                placeholder="https://..." 
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <Button 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 gap-2"
              disabled={isUploading || !mediaFile || !thumbFile}
              onClick={handleUpload}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Upload Story
            </Button>
          </div>
        </Card>

        {/* Active Stories List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            Active Stories ({stories.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {stories.map((story) => {
                const timeLeft = Math.max(0, story.expiresAt - Date.now());
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                return (
                  <motion.div
                    key={story.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="overflow-hidden border-border bg-card/30 group">
                      <div className="relative aspect-[9/16] bg-black">
                        {story.mediaType === 'video' ? (
                          <video 
                            src={story.mediaUrl} 
                            className="w-full h-full object-cover"
                            muted
                            loop
                            onMouseOver={e => e.currentTarget.play()}
                            onMouseOut={e => e.currentTarget.pause()}
                          />
                        ) : (
                          <img 
                            src={story.mediaUrl} 
                            alt={story.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                          <p className="text-white font-bold truncate">{story.title || 'Untitled Story'}</p>
                          <div className="flex items-center gap-2 text-white/70 text-xs">
                            <Clock className="h-3 w-3" />
                            {hoursLeft}h {minsLeft}m left
                          </div>
                        </div>

                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={() => deleteStory(story.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Preview Circle Badge */}
                        <div className="absolute top-2 left-2">
                          <div className="w-12 h-12 rounded-full border-2 border-red-500 p-0.5 bg-background">
                            <img 
                              src={story.thumbnailUrl} 
                              className="w-full h-full rounded-full object-cover"
                              alt="thumb"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 border-t border-border bg-muted/20">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(story.expiresAt).toLocaleString()}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full font-bold uppercase",
                            timeLeft > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {timeLeft > 0 ? 'Active' : 'Expired'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {stories.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No active stories found.</p>
                <p className="text-xs text-muted-foreground/60">Upload your first story to see it here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
