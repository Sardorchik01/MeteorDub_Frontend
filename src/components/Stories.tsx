import React from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export function Stories() {
  const [stories, setStories] = React.useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Story[];
      // Filter out expired stories just in case cleanup hasn't run
      const active = data.filter(s => s.expiresAt > Date.now());
      setStories(active);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    let timer: any;
    if (selectedStoryIndex !== null) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 50); // 5 seconds per story (100 * 50ms)
    }
    return () => clearInterval(timer);
  }, [selectedStoryIndex]);

  const handleNext = () => {
    if (selectedStoryIndex === null) return;
    if (selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  const handlePrev = () => {
    if (selectedStoryIndex === null) return;
    if (selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  if (stories.length === 0) return null;

  return (
    <div className="w-full px-4 md:px-16 py-6 overflow-x-auto no-scrollbar flex gap-4 items-center">
      {stories.map((story, index) => (
        <button
          key={story.id}
          onClick={() => setSelectedStoryIndex(index)}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 animate-gradient-xy">
            <div className="p-0.5 rounded-full bg-background">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:scale-105 transition-transform">
                <img 
                  src={story.thumbnailUrl} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Red Ring indicator (always red as requested) */}
            <div className="absolute inset-0 rounded-full border-2 border-red-500 pointer-events-none" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground truncate w-16 md:w-20 text-center">
            {story.title || 'Story'}
          </span>
        </button>
      ))}

      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg aspect-[9/16] bg-black overflow-hidden md:rounded-3xl shadow-2xl">
              {/* Progress Bars */}
              <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                {stories.map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{ 
                        width: i === selectedStoryIndex ? `${progress}%` : i < selectedStoryIndex ? '100%' : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-red-500 p-0.5">
                    <img 
                      src={stories[selectedStoryIndex].thumbnailUrl} 
                      className="w-full h-full rounded-full object-cover"
                      alt="thumb"
                    />
                  </div>
                  <span className="text-white font-bold text-sm shadow-sm">
                    {stories[selectedStoryIndex].title || 'MeteorDub Story'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10 rounded-full"
                  onClick={() => setSelectedStoryIndex(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Media */}
              <div className="w-full h-full flex items-center justify-center">
                {stories[selectedStoryIndex].mediaType === 'video' ? (
                  <video 
                    src={stories[selectedStoryIndex].mediaUrl} 
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                    onEnded={handleNext}
                  />
                ) : (
                  <img 
                    src={stories[selectedStoryIndex].mediaUrl} 
                    className="w-full h-full object-contain"
                    alt="story"
                  />
                )}
              </div>

              {/* Navigation */}
              <button 
                className="absolute left-0 top-0 bottom-0 w-1/4 z-10"
                onClick={handlePrev}
              />
              <button 
                className="absolute right-0 top-0 bottom-0 w-1/4 z-10"
                onClick={handleNext}
              />

              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white bg-black/20 hover:bg-black/40 rounded-full"
                  onClick={handlePrev}
                  disabled={selectedStoryIndex === 0}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white bg-black/20 hover:bg-black/40 rounded-full"
                  onClick={handleNext}
                  disabled={selectedStoryIndex === stories.length - 1}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>

              {/* Footer Link */}
              {stories[selectedStoryIndex].link && (
                <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
                  <Button 
                    asChild
                    className="bg-white text-black hover:bg-white/90 rounded-full px-8 gap-2 font-bold shadow-xl animate-bounce"
                  >
                    <a href={stories[selectedStoryIndex].link} target="_blank" rel="noopener noreferrer">
                      View More <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
