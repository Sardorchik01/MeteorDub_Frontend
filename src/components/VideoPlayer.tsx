import * as React from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, Settings, Subtitles, 
  Volume2, VolumeX, Maximize, Minimize, X, ChevronDown, 
  FastForward, Languages, Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Anime } from '../types';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface VideoPlayerProps {
  anime: Anime | null;
  onClose: () => void;
}

export function VideoPlayer({ anime, onClose }: VideoPlayerProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [showControls, setShowControls] = React.useState(true);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [scrubTime, setScrubTime] = React.useState(0);
  const [isLongPressing, setIsLongPressing] = React.useState(false);
  
  const [hasError, setHasError] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setHasError(false);
    if (anime && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [anime]);

  // Sync volume and playback rate
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMinimized || !anime) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          handleDoubleTap('right');
          break;
        case 'ArrowLeft':
          handleDoubleTap('left');
          break;
        case 'KeyM':
          setVolume(prev => prev === 0 ? 1 : 0);
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMinimized, anime]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (e.g. Esc key)
  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleTimeUpdate = () => {
    if (!isScrubbing && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleScrubStart = () => {
    setIsScrubbing(true);
  };

  const handleScrubEnd = (value: number[]) => {
    setIsScrubbing(false);
    handleSeek(value);
  };

  const handleDoubleTap = (side: 'left' | 'right') => {
    if (videoRef.current) {
      const seekAmount = side === 'left' ? -10 : 10;
      videoRef.current.currentTime += seekAmount;
    }
  };

  const handleLongPressStart = () => {
    setIsLongPressing(true);
    if (videoRef.current) {
      videoRef.current.playbackRate = 2;
    }
  };

  const handleLongPressEnd = () => {
    setIsLongPressing(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!anime) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ 
          y: isMinimized ? 'calc(100% - 120px)' : 0,
          scale: isMinimized ? 0.4 : 1,
          x: isMinimized ? 'calc(50% - 100px)' : 0,
        }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        ref={containerRef}
        className={cn(
          "fixed inset-0 z-50 bg-black flex flex-col overflow-hidden",
          isMinimized && "rounded-xl shadow-2xl cursor-pointer w-[300px] h-[180px] bottom-4 right-4 top-auto left-auto"
        )}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        {/* Header */}
        {!isMinimized ? (
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
              <ChevronDown className="h-6 w-6" />
            </Button>
            <div className="flex-1 px-4">
              <h2 className="text-white font-semibold truncate">{anime.title}</h2>
              <p className="text-white/60 text-xs">Episode 1</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="text-white">
              <Minimize className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="absolute top-1 right-1 h-6 w-6 bg-black/60 text-white rounded-full z-20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Video Area */}
        <div 
          className="relative aspect-video md:flex-1 flex items-center justify-center group bg-black"
          onMouseMove={() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
          }}
          onMouseDown={(e) => {
            if (e.button === 0) {
              const timer = setTimeout(handleLongPressStart, 500);
              const cleanup = () => {
                clearTimeout(timer);
                handleLongPressEnd();
                window.removeEventListener('mouseup', cleanup);
              };
              window.addEventListener('mouseup', cleanup);
            }
          }}
          onDoubleClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 3) handleDoubleTap('left');
            else if (x > (rect.width * 2) / 3) handleDoubleTap('right');
          }}
        >
          <video
            key={anime.id}
            ref={videoRef}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error("Video error details:", e);
              setHasError(true);
            }}
            crossOrigin="anonymous"
            playsInline
          >
            <source src={anime.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-30 p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video yuklashda xatolik</h3>
              <p className="text-zinc-400 text-sm max-w-xs mb-6">
                Video manbasi topilmadi yoki brauzeringiz ushbu formatni qo'llab-quvvatlamaydi.
              </p>
              <Button 
                onClick={() => {
                  setHasError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play();
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Qayta urinish
              </Button>
            </div>
          )}

          {/* 2x Speed Indicator */}
          {isLongPressing && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm flex items-center gap-2 z-20">
              <FastForward className="h-4 w-4" /> 2x Speed
            </div>
          )}

          {/* Controls Overlay */}
          {!isMinimized && (
            <div className={cn(
              "absolute inset-0 bg-black/40 flex flex-col justify-between transition-opacity duration-300",
              showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <div className="flex-1 flex items-center justify-center gap-12">
                <Button variant="ghost" size="icon" className="text-white h-12 w-12" onClick={() => handleDoubleTap('left')}>
                  <SkipBack className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white h-16 w-16" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12 fill-white" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white h-12 w-12" onClick={() => handleDoubleTap('right')}>
                  <SkipForward className="h-8 w-8" />
                </Button>
              </div>

              {/* Bottom Controls */}
              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-white text-xs font-mono">{formatTime(currentTime)}</span>
                  <div className="flex-1 relative">
                    {/* Preview Thumbnail (Mock) */}
                    {isScrubbing && (
                      <div 
                        className="absolute bottom-full mb-4 -translate-x-1/2 bg-zinc-900 border border-zinc-800 rounded overflow-hidden w-32 h-20 shadow-xl"
                        style={{ left: `${(scrubTime / duration) * 100}%` }}
                      >
                        <img src={anime.thumbnail} className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-mono">
                          {formatTime(scrubTime)}
                        </div>
                      </div>
                    )}
                    <Slider
                      value={[isScrubbing ? scrubTime : currentTime]}
                      max={duration}
                      step={1}
                      onValueChange={(val) => {
                        setScrubTime(val[0]);
                        if (!isScrubbing) handleScrubStart();
                      }}
                      onPointerUp={() => handleScrubEnd([scrubTime])}
                      className="cursor-pointer"
                    />
                  </div>
                  <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white" onClick={() => setVolume(volume === 0 ? 1 : 0)}>
                      {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <div className="hidden sm:block w-24">
                      <Slider value={[volume]} max={1} step={0.1} onValueChange={(val) => setVolume(val[0])} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="text-white">
                          <Settings className="h-5 w-5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="bg-zinc-900 text-white border-zinc-800">
                        <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white">
                          <Languages className="mr-2 h-4 w-4" /> Audio: Japanese
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white">
                          <Subtitles className="mr-2 h-4 w-4" /> Subtitles: English
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white">
                          <Highlighter className="mr-2 h-4 w-4" /> Quality: 1080p
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="focus:bg-zinc-800 focus:text-white"
                          onClick={() => {
                            const rates = [0.5, 1, 1.5, 2];
                            const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                            setPlaybackRate(next);
                            if (videoRef.current) videoRef.current.playbackRate = next;
                          }}
                        >
                          <FastForward className="mr-2 h-4 w-4" /> Speed: {playbackRate}x
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="text-white" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Anime Info & Actions (Below Video) */}
        {!isMinimized && (
          <ScrollArea className="flex-1 bg-zinc-950">
            <div className="p-6 space-y-8 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{anime.title}</h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-blue-500 border-blue-500/30">HD</Badge>
                    <Badge variant="outline" className="text-zinc-400 border-zinc-800">TV</Badge>
                    <span className="text-zinc-500 text-sm">{anime.year} • {anime.episodes} Episodes</span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{anime.description}</p>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-64">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
                    <Play className="mr-2 h-4 w-4 fill-white" /> Next Episode
                  </Button>
                  <Button variant="outline" className="w-full border-zinc-800 h-12">
                    Download Episode
                  </Button>
                </div>
              </div>

              {/* Shorts / Related */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Play className="h-4 w-4 text-red-500 fill-red-500" /> Shorts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-[9/16] rounded-xl overflow-hidden relative group cursor-pointer">
                      <img src={`https://picsum.photos/seed/short${i}/400/700`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-medium line-clamp-2">Amazing fight scene from {anime.title}!</p>
                        <p className="text-[10px] text-zinc-400 mt-1">1.2M views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
