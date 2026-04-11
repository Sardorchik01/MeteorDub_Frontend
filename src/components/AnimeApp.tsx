import * as React from 'react';
import { 
  Home, Search, Play, User, Heart, MessageSquare, 
  Bell, Menu, LogOut, Settings, Moon, Sun, Send,
  Chrome, Lock, Crown, Eye, EyeOff, CreditCard, CheckCircle2,
  ListPlus, FolderPlus, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Anime, AppSection, ChatMessage, UserProfile, Tariff, Playlist } from '../types';
import { NotificationBell } from './NotificationBell';
import { VideoPlayer } from './VideoPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { AdBanner } from './AdBanner';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PlaylistModal } from './PlaylistModal';
import { 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, updateDoc, getDoc, setDoc, collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

export default function AnimeApp() {
  const { user, profile, isAuthReady } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = React.useState<AppSection>('home');
  const [selectedAnime, setSelectedAnime] = React.useState<Anime | null>(null);
  const [tariffs, setTariffs] = React.useState<Tariff[]>([]);
  const [activeTariff, setActiveTariff] = React.useState<Tariff | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = React.useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isProfileUpdateModalOpen, setIsProfileUpdateModalOpen] = React.useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = React.useState(false);
  const [birthYear, setBirthYear] = React.useState<number | ''>('');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = React.useState(false);
  const [playlistAnime, setPlaylistAnime] = React.useState<Anime | null>(null);
  const [userPlaylists, setUserPlaylists] = React.useState<Playlist[]>([]);
  const [animes, setAnimes] = React.useState<Anime[]>([]);
  const [loadingAnimes, setLoadingAnimes] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  const trailers = animes.filter(a => a.contentType === 'trailer');
  const edits = animes.filter(a => a.contentType === 'edit');
  const fullAnimes = animes.filter(a => a.contentType === 'full' || !a.contentType);
  const ongoingAnimes = animes.filter(a => a.status === 'Ongoing');
  const trendingAnimes = [...animes].sort((a, b) => (b.views || 0) - (a.views || 0));

  React.useEffect(() => {
    // Fetch Animes
    const qAnime = query(collection(db, 'animes'), orderBy('createdAt', 'desc'));
    const unsubAnime = onSnapshot(qAnime, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Anime[];
      setAnimes(data);
      setLoadingAnimes(false);
    });

    return () => unsubAnime();
  }, []);

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Hey! Looking for recommendations? How about "Chainsaw Man" or "Spy x Family"?', timestamp: Date.now() }
  ]);
  const [inputMessage, setInputMessage] = React.useState('');

  React.useEffect(() => {
    if (user && profile && !profile.birthYear) {
      setIsProfileUpdateModalOpen(true);
    }

    // Fetch Tariffs
    const qTariff = query(collection(db, 'tariffs'), orderBy('createdAt', 'desc'));
    const unsubTariff = onSnapshot(qTariff, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tariff[];
      setTariffs(data);
    });

    return () => unsubTariff();
  }, [user, profile]);

  React.useEffect(() => {
    if (!user) {
      setUserPlaylists([]);
      return;
    }

    const q = query(
      collection(db, 'playlists'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
      setUserPlaylists(list.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, [user]);

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasSpecial = /[@#$%^&*!@]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return minLength && hasSpecial && hasUpper && hasNumber;
  };

  const handleAuth = async () => {
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        // Validation
        if (authForm.username.length < 3) {
          setAuthError('Username must be at least 3 characters.');
          return;
        }
        if (!validatePassword(authForm.password)) {
          setAuthError('Password must be at least 8 characters and include uppercase, number, and special character (@#$%^&*!@).');
          return;
        }

        // Check username uniqueness (case-insensitive)
        const normalizedUsername = authForm.username.toLowerCase();
        const usernameDoc = await getDoc(doc(db, 'usernames', normalizedUsername));
        if (usernameDoc.exists()) {
          setAuthError('Username already taken.');
          return;
        }

        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        const firebaseUser = userCredential.user;

        // Create profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const usernameDocRef = doc(db, 'usernames', normalizedUsername);

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: authForm.email,
          username: authForm.username, // Keep original casing for display
          firstName: authForm.firstName,
          lastName: authForm.lastName,
          role: 'user',
          status: 'standard',
          createdAt: Date.now()
        };

        await setDoc(usernameDocRef, { email: authForm.email, uid: firebaseUser.uid });
        await setDoc(userDocRef, newProfile);
        
        setIsLoginModalOpen(false);
      } else {
        // Login
        let loginEmail = authForm.email;
        
        // If it's a username (no @), look up email (case-insensitive)
        if (!authForm.email.includes('@')) {
          const normalizedUsername = authForm.email.toLowerCase();
          const usernameDoc = await getDoc(doc(db, 'usernames', normalizedUsername));
          if (!usernameDoc.exists()) {
            setAuthError('Username not found.');
            return;
          }
          loginEmail = usernameDoc.data().email;
        }

        await signInWithEmailAndPassword(auth, loginEmail.toLowerCase().trim(), authForm.password);
        setIsLoginModalOpen(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLoginModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !birthYear) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        birthYear: Number(birthYear)
      });
      setIsProfileUpdateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchAnime = async (anime: Anime) => {
    if (anime.accessType !== 'public') {
      if (!user) {
        setIsLoginModalOpen(true);
        return;
      }
      
      const allowedTariffs = Array.isArray(anime.accessType) ? anime.accessType : [anime.accessType];
      
      // Check if user has ANY of the allowed tariffs
      if (!profile?.tariffId || !allowedTariffs.includes(profile.tariffId)) {
        // If user doesn't have access, show the first required tariff or the premium modal
        const firstRequiredTariffId = allowedTariffs[0];
        const requiredTariff = tariffs.find(t => t.id === firstRequiredTariffId);
        setActiveTariff(requiredTariff || null);
        setIsPremiumModalOpen(true);
        return;
      }
    }

    // Optimized view counting: only increment if not watched in this session
    const sessionKey = `watched_${anime.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      try {
        await updateDoc(doc(db, 'animes', anime.id), {
          views: (anime.views || 0) + 1
        });
        sessionStorage.setItem(sessionKey, 'true');
      } catch (err) {
        console.error('Error updating views:', err);
      }
    }

    setSelectedAnime(anime);
  };

  const handleAddToPlaylistClick = (e: React.MouseEvent, anime: Anime) => {
    e.stopPropagation();
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setPlaylistAnime(anime);
    setIsPlaylistModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');

    // Mock AI Response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `That's a great choice! If you like that, you might also enjoy ${animes.length > 0 ? animes[Math.floor(Math.random() * animes.length)].title : 'our other titles'}.`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border sticky top-0 h-screen bg-card/50 backdrop-blur-xl z-50">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tighter text-blue-500">METEOR<span className="text-foreground">DUB</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'home', label: t('home'), icon: Home },
            { id: 'favorites', label: t('collection'), icon: Heart },
            { id: 'ai', label: t('ai_assistant'), icon: MessageSquare },
            { id: 'profile', label: t('profile'), icon: User }
          ].map((section) => (
            <button 
              key={section.id}
              onClick={() => setActiveSection(section.id as AppSection)} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative",
                activeSection === section.id 
                  ? "bg-blue-500/10 text-blue-500" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <section.icon className={cn(
                "h-5 w-5 transition-colors",
                activeSection === section.id ? "text-blue-500" : "text-zinc-500 group-hover:text-white"
              )} />
              {section.label}
              {activeSection === section.id && (
                <motion.div 
                  layoutId="sidebarActive"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-4">
          <LanguageSwitcher />
          <AdBanner location="sidebar" />
          <Card 
            className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none p-4 rounded-2xl overflow-hidden relative group cursor-pointer" 
            onClick={() => {
              setActiveTariff(null);
              setIsPremiumModalOpen(true);
            }}
          >
            <div className="relative z-10">
              <p className="text-white font-bold text-sm">{t('upgrade_pro')}</p>
              <p className="text-white/70 text-[10px] mt-1">{t('upgrade_desc')}</p>
            </div>
            <Crown className="absolute -right-2 -bottom-2 h-16 w-16 text-white/10 group-hover:scale-110 transition-transform" />
          </Card>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Navbar (Search & Profile only) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border sticky top-0 z-40 bg-inherit/80 backdrop-blur-md">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('search_placeholder')} 
                className="pl-10 bg-muted/50 border-border focus:ring-blue-500 h-11 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-8">
            {user ? (
              <>
                <NotificationBell onWatchAnime={(id) => {
                  const anime = animes.find(a => a.id === id);
                  if (anime) setSelectedAnime(anime);
                }} />
                <div 
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl bg-muted/50 border border-border cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setActiveSection('profile')}
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{profile?.firstName[0]}{profile?.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold truncate max-w-[100px]">{profile?.firstName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{profile?.status}</p>
                  </div>
                </div>
              </>
            ) : (
              <Button onClick={() => setIsLoginModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8 h-11 font-bold">
                {t('login')}
              </Button>
            )}
          </div>
        </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          {activeSection === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {showAll ? (
                <div className="px-4 md:px-16 pt-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">{t('view_all')}</h2>
                    <Button variant="outline" onClick={() => setShowAll(false)} className="rounded-xl border-border">
                      {t('cancel')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {animes.map((anime) => (
                      <motion.div 
                        key={anime.id}
                        whileHover={{ y: -10 }}
                        className="group cursor-pointer"
                        onClick={() => handleWatchAnime(anime)}
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                          <img src={anime.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center hover:scale-110 transition-transform">
                              {anime.accessType !== 'public' && (!profile?.tariffId || !anime.accessType.includes(profile.tariffId)) ? <Lock className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 fill-white text-white" />}
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <Badge className="bg-black/60 backdrop-blur-md border-none">{anime.rating}</Badge>
                            {anime.contentType && anime.contentType !== 'full' && (
                              <Badge className="bg-blue-500 text-white border-none text-[10px] uppercase">{t(anime.contentType)}</Badge>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold truncate group-hover:text-blue-500 transition-colors">{anime.title}</h4>
                        <p className="text-xs text-muted-foreground">{anime.year} • {anime.episodes} Eps</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Pro Button */}
              <div className="md:hidden px-4 pt-4">
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl h-12 flex items-center justify-between px-6 border-none"
                  onClick={() => {
                    setActiveTariff(null);
                    setIsPremiumModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    <span>{t('upgrade_pro')}</span>
                  </div>
                  <span className="text-xs opacity-80">{t('upgrade_now')}</span>
                </Button>
              </div>

              <div className="px-4 md:px-16 pt-8">
                <AdBanner location="top" />
              </div>
              {/* Hero Section */}
              {animes.length > 0 && (
                <section className="relative h-[60vh] md:h-[80vh] overflow-hidden">
                  <img 
                    src={animes[0].thumbnail} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-6 max-w-4xl">
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1">{t('featured')}</Badge>
                    <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{animes[0].title}</h2>
                    <p className="text-foreground/80 text-lg line-clamp-3 max-w-2xl">{animes[0].description}</p>
                    <div className="flex items-center gap-4">
                      <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8" onClick={() => handleWatchAnime(animes[0])}>
                        <Play className="mr-2 h-5 w-5 fill-white" /> {t('watch_now')}
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="rounded-full px-8 border-border hover:bg-accent"
                        onClick={(e) => handleAddToPlaylistClick(e, animes[0])}
                      >
                        <ListPlus className="mr-2 h-5 w-5" /> {t('add_to_playlist')}
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              {/* Trending Section */}
              <section className="px-4 md:px-16 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-blue-500">~</span> {t('trending_now')}
                  </h3>
                  <Button variant="link" className="text-muted-foreground" onClick={() => setShowAll(true)}>{t('view_all')}</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {trendingAnimes.slice(0, 6).map((anime) => (
                    <motion.div 
                      key={anime.id}
                      whileHover={{ y: -10 }}
                      className="group cursor-pointer"
                      onClick={() => handleWatchAnime(anime)}
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                        <img src={anime.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center hover:scale-110 transition-transform">
                            {anime.accessType !== 'public' && (!profile?.tariffId || !anime.accessType.includes(profile.tariffId)) ? <Lock className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 fill-white text-white" />}
                          </div>
                          <Button 
                            size="icon" 
                            className="h-12 w-12 rounded-full bg-zinc-800/80 hover:bg-blue-500 text-white transition-all hover:scale-110"
                            onClick={(e) => handleAddToPlaylistClick(e, anime)}
                          >
                            <ListPlus className="h-6 w-6" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          <Badge className="bg-black/60 backdrop-blur-md border-none">{anime.rating}</Badge>
                          {anime.accessType !== 'public' && (
                            <Badge className="bg-yellow-500 text-black border-none font-bold flex items-center gap-1">
                              <Crown className="h-3 w-3" /> PREMIUM
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold truncate group-hover:text-blue-500 transition-colors">{anime.title}</h4>
                      <p className="text-xs text-muted-foreground">{anime.year} • {anime.episodes} Eps</p>
                    </motion.div>
                  ))}
                  {animes.length === 0 && !loadingAnimes && (
                    <div className="col-span-full py-20 text-center text-muted-foreground">
                      No animes found. Check back later!
                    </div>
                  )}
                </div>
              </section>

              {/* Trailers Section */}
              {trailers.length > 0 && (
                <section className="px-4 md:px-16 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Play className="text-blue-500 h-6 w-6" /> {t('trailers')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {trailers.slice(0, 3).map((anime) => (
                      <motion.div 
                        key={anime.id}
                        whileHover={{ scale: 1.02 }}
                        className="group cursor-pointer relative aspect-video rounded-2xl overflow-hidden border border-border"
                        onClick={() => handleWatchAnime(anime)}
                      >
                        <img src={anime.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <Play className="h-6 w-6 fill-white text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h4 className="font-bold text-white truncate">{anime.title}</h4>
                          <p className="text-xs text-white/70 line-clamp-1">{anime.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Edits Section */}
              {edits.length > 0 && (
                <section className="px-4 md:px-16 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Heart className="text-red-500 h-6 w-6" /> {t('edits')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {edits.slice(0, 6).map((anime) => (
                      <motion.div 
                        key={anime.id}
                        whileHover={{ scale: 1.05 }}
                        className="group cursor-pointer relative aspect-[9/16] rounded-xl overflow-hidden border border-border"
                        onClick={() => handleWatchAnime(anime)}
                      >
                        <img src={anime.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <h4 className="text-[10px] font-bold text-white truncate">{anime.title}</h4>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Ongoing Section */}
              {ongoingAnimes.length > 0 && (
                <section className="px-4 md:px-16 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Play className="text-green-500 h-6 w-6" /> {t('ongoing_anime')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {ongoingAnimes.slice(0, 6).map((anime) => (
                      <motion.div 
                        key={anime.id}
                        whileHover={{ y: -10 }}
                        className="group cursor-pointer"
                        onClick={() => handleWatchAnime(anime)}
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                          <img src={anime.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center hover:scale-110 transition-transform">
                              {anime.accessType !== 'public' && (!profile?.tariffId || !anime.accessType.includes(profile.tariffId)) ? <Lock className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 fill-white text-white" />}
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <Badge className="bg-black/60 backdrop-blur-md border-none">{anime.rating}</Badge>
                            <Badge className="bg-green-500 text-white border-none text-[10px] uppercase">ONGOING</Badge>
                          </div>
                        </div>
                        <h4 className="font-semibold truncate group-hover:text-blue-500 transition-colors">{anime.title}</h4>
                        <p className="text-xs text-muted-foreground">{anime.year} • {anime.episodes} Eps</p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently Updated & Genres */}
              <section className="px-4 md:px-16 grid md:grid-cols-3 gap-12 pb-16">
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{t('recently_updated')}</h3>
                    <Button variant="link" className="text-muted-foreground" onClick={() => setShowAll(true)}>{t('view_all')}</Button>
                  </div>
                  <div className="space-y-4">
                    {animes.slice(0, 3).map((anime) => (
                      <Card key={anime.id} className="bg-card/50 border-border hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden" onClick={() => handleWatchAnime(anime)}>
                        <div className="flex gap-4 p-3">
                          <img src={anime.thumbnail} className="w-20 h-28 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className="font-semibold">{anime.title}</h4>
                            <p className="text-sm text-blue-500">{t('latest_episode')} #{anime.episodes}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t('updated_ago')} {new Date(anime.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 pr-4">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="rounded-full hover:bg-blue-500 hover:text-white"
                              onClick={(e) => handleAddToPlaylistClick(e, anime)}
                            >
                              <ListPlus className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full hover:bg-blue-500 hover:text-white">
                              {anime.accessType !== 'public' && (!profile?.tariffId || !anime.accessType.includes(profile.tariffId)) ? <Lock className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">Top Genres</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['Action', 'Romance', 'Fantasy', 'Comedy', 'Adventure', 'Drama'].map((genre) => (
                      <Button key={genre} variant="outline" className="h-24 flex flex-col gap-2 border-border hover:border-blue-500 hover:bg-blue-500/10 transition-all group">
                        <span className={cn("font-semibold", isDarkMode ? "text-muted-foreground group-hover:text-blue-500" : "text-muted-foreground group-hover:text-blue-500")}>{genre}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </section>

              <div className="px-4 md:px-16">
                <AdBanner location="bottom" />
              </div>
            </>
          )}
        </motion.div>
      )}

          {activeSection === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto p-4"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('ai_title')}</h2>
                  <p className="text-sm text-muted-foreground">{t('ai_desc')}</p>
                </div>
              </div>
              
              <Card className="flex-1 bg-card/50 border-border flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}>
                        <div className={cn(
                          "max-w-[80%] p-3 rounded-2xl text-sm",
                          msg.role === 'user' ? "bg-blue-500 text-white rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border flex gap-2">
                  <Input 
                    placeholder={t('type_message')} 
                    className="bg-muted border-border focus:ring-blue-500"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="icon" className="bg-blue-500 hover:bg-blue-600" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeSection === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12 pb-24 md:pb-8"
            >
              {user ? (
                <>
                  {/* Mobile/Tablet Pro Banner */}
                  {profile?.status !== 'premium' && (
                    <Card 
                      className="bg-gradient-to-br from-yellow-500 to-orange-600 border-none p-6 rounded-2xl overflow-hidden relative group cursor-pointer mb-8" 
                      onClick={() => {
                        setActiveTariff(null);
                        setIsPremiumModalOpen(true);
                      }}
                    >
                      <div className="relative z-10">
                        <h3 className="text-white font-bold text-xl">{t('upgrade_pro')}</h3>
                        <p className="text-white/80 text-sm mt-1">{t('upgrade_desc')}</p>
                        <Button className="mt-4 bg-white text-orange-600 hover:bg-white/90 font-bold rounded-xl">
                          {t('upgrade_now')}
                        </Button>
                      </div>
                      <Crown className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform" />
                    </Card>
                  )}

                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-blue-500">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{profile?.firstName[0]}{profile?.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <Button size="icon" className="absolute bottom-0 right-0 rounded-full bg-blue-500 hover:bg-blue-600" onClick={() => setIsProfileUpdateModalOpen(true)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{profile?.firstName} {profile?.lastName}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge variant="secondary" className={cn(
                          "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
                          profile?.status !== 'premium' && "bg-muted text-muted-foreground border-border"
                        )}>
                          {profile?.status === 'premium' ? t('premium_member') : t('standard_member')}
                        </Badge>
                        {profile?.role !== 'user' && (
                          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50 capitalize">{profile?.role}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <Card className="bg-card/50 border-border">
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-xl font-bold">{t('account_settings')}</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Moon className="h-5 w-5 text-muted-foreground" />
                              <span>{t('dark_mode')}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={toggleTheme}>
                              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Bell className="h-5 w-5 text-muted-foreground" />
                              <span>{t('notifications')}</span>
                            </div>
                            <Badge>{t('enabled')}</Badge>
                          </div>
                          <Button variant="destructive" className="w-full" onClick={() => signOut(auth)}>
                            <LogOut className="mr-2 h-4 w-4" /> {t('logout')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card className="bg-card/50 border-border">
                        <CardContent className="p-6">
                          <LanguageSwitcher />
                        </CardContent>
                      </Card>

                      <Card className="bg-card/50 border-border">
                        <CardContent className="p-6 space-y-6">
                          <h3 className="text-xl font-bold">{t('watch_stats')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-muted/50 text-center">
                            <p className="text-2xl font-bold text-blue-500">124</p>
                            <p className="text-xs text-muted-foreground">{t('anime_watched')}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/50 text-center">
                            <p className="text-2xl font-bold text-blue-500">2.4k</p>
                            <p className="text-xs text-muted-foreground">{t('episodes')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 space-y-6">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{t('sign_in_profile')}</h2>
                  <p className="text-muted-foreground">{t('keep_track')}</p>
                </div>
                <Button onClick={() => setIsLoginModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 px-8 h-12 rounded-full w-full max-w-xs mx-auto">
                  {t('login')}
                </Button>
                <div className="max-w-xs mx-auto pt-4">
                  <LanguageSwitcher />
                </div>
              </div>
            )}
            </motion.div>
          )}

          {activeSection === 'favorites' && (
            <motion.div 
              key="favorites"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 md:px-16 py-8 space-y-8"
            >
              <h2 className="text-3xl font-bold">{t('my_collection')}</h2>
              <Tabs defaultValue="watching" className="w-full">
                <TabsList className="bg-muted border-border">
                  <TabsTrigger value="watching">{t('watching')}</TabsTrigger>
                  <TabsTrigger value="completed">{t('completed')}</TabsTrigger>
                  <TabsTrigger value="plan">{t('plan_to_watch')}</TabsTrigger>
                  <TabsTrigger value="playlists">{t('playlists')}</TabsTrigger>
                </TabsList>
                <TabsContent value="watching" className="mt-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {animes.slice(0, 4).map((anime) => (
                      <div key={anime.id} className="group cursor-pointer" onClick={() => handleWatchAnime(anime)}>
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                          <img src={anime.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                            <div className="h-full bg-blue-500 w-2/3" />
                          </div>
                        </div>
                        <h4 className="font-semibold truncate">{anime.title}</h4>
                        <p className="text-xs text-muted-foreground">Ep 12 / {anime.episodes}</p>
                      </div>
                    ))}
                    {animes.length === 0 && (
                      <div className="col-span-full py-10 text-center text-muted-foreground">
                        Your collection is empty.
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="playlists" className="mt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPlaylists.length === 0 ? (
                      <div className="col-span-full text-center py-20 space-y-4">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                          <FolderPlus className="h-10 w-10" />
                        </div>
                        <p className="text-muted-foreground">{t('no_playlists')}</p>
                        <Button 
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => {
                            setPlaylistAnime(null);
                            setIsPlaylistModalOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> {t('create_playlist')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        {userPlaylists.map((playlist) => (
                          <Card key={playlist.id} className="bg-card/50 border-border hover:border-blue-500/50 transition-all group">
                            <CardContent className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                  <ListPlus className="h-6 w-6" />
                                </div>
                                <Badge variant="outline" className="border-border">
                                  {playlist.animeIds.length} {t('episodes')}
                                </Badge>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold group-hover:text-blue-500 transition-colors">{playlist.name}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{playlist.description || t('no_description')}</p>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button variant="secondary" className="flex-1 bg-muted hover:bg-accent">
                                  {t('view_all')}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <button 
                          onClick={() => {
                            setPlaylistAnime(null);
                            setIsPlaylistModalOpen(true);
                          }}
                          className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group h-full min-h-[200px]"
                        >
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Plus className="h-6 w-6" />
                          </div>
                          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('create_playlist')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-lg border-t border-border flex items-center justify-around px-4 z-40">
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('home')} className={cn(activeSection === 'home' ? "text-blue-500" : "text-muted-foreground")}>
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('favorites')} className={cn(activeSection === 'favorites' ? "text-blue-500" : "text-muted-foreground")}>
          <Heart className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('ai')} className={cn(activeSection === 'ai' ? "text-blue-500" : "text-muted-foreground")}>
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('profile')} className={cn(activeSection === 'profile' ? "text-blue-500" : "text-muted-foreground")}>
          <User className="h-6 w-6" />
        </Button>
      </nav>

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {authMode === 'login' ? t('welcome_back') : t('create_account')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {authMode === 'login' 
                ? t('sign_in_desc') 
                : t('join_meteor')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {authError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                {authError}
              </div>
            )}

            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('first_name')}</label>
                  <Input 
                    placeholder="John" 
                    className="bg-muted border-border"
                    value={authForm.firstName}
                    onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('last_name')}</label>
                  <Input 
                    placeholder="Doe" 
                    className="bg-muted border-border"
                    value={authForm.lastName}
                    onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('username')}</label>
                <Input 
                  placeholder="anime_fan" 
                  className="bg-muted border-border"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {t('email_or_username')}
              </label>
              <Input 
                placeholder={authMode === 'login' ? t('email_or_username') : "email@example.com"}
                className="bg-muted border-border"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('password')}</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  className="bg-muted border-border pr-10"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authMode === 'signup' && (
                <p className="text-[10px] text-muted-foreground">
                  Min 8 chars, 1 uppercase, 1 number, 1 special char.
                </p>
              )}
            </div>

            <Button onClick={handleAuth} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl">
              {authMode === 'login' ? t('sign_in_btn') : t('sign_up_btn')}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('or_continue')}</span>
              </div>
            </div>

            <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 border-border hover:bg-accent text-foreground font-bold rounded-xl">
              <Chrome className="mr-2 h-5 w-5" />
              Google
            </Button>
          </div>

          <div className="text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError(null);
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              {authMode === 'login' ? t('no_account') : t('have_account')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Update Modal */}
      <Dialog open={isProfileUpdateModalOpen} onOpenChange={setIsProfileUpdateModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('complete_profile')}</DialogTitle>
            <DialogDescription>Please provide your birth year to continue.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{t('birth_year')}</label>
              <Input 
                type="number" 
                placeholder="e.g. 1995" 
                className="bg-muted border-border"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleUpdateProfile} disabled={!birthYear}>
              {t('save_continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium/Tariff Modal */}
      <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
        <DialogContent className={cn(
          "bg-card border-border text-foreground",
          activeTariff ? "max-w-sm" : "max-w-2xl"
        )}>
          <DialogHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <Crown className="h-10 w-10 text-yellow-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {activeTariff ? `${activeTariff.name} ${t('required_plan')}` : t('choose_plan')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {activeTariff?.description || t('premium_desc')}
            </DialogDescription>
          </DialogHeader>

          {activeTariff ? (
            <div className="py-6 space-y-4">
              <div className="p-4 rounded-xl bg-muted border border-border space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {t('ad_free')}
                </p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {t('exclusive_content')}
                </p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {t('ultra_hd')}
                </p>
              </div>
              
              {activeTariff.price && (
                <div className="text-center py-2">
                  <p className="text-2xl font-black text-foreground">{activeTariff.price}</p>
                </div>
              )}

              <Button 
                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl"
                onClick={() => window.open(activeTariff.redirectUrl, '_blank')}
              >
                {activeTariff.buttonLabel || t('upgrade_now')}
              </Button>
            </div>
          ) : (
            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {tariffs.map((tariff) => (
                <Card key={tariff.id} className="bg-muted border-border p-5 rounded-2xl hover:border-yellow-500/50 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-yellow-500" />
                    </div>
                    {tariff.price && <p className="text-lg font-black text-foreground">{tariff.price}</p>}
                  </div>
                  <h4 className="text-lg font-bold mb-1">{tariff.name}</h4>
                  <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-2">{tariff.description}</p>
                  <Button 
                    className="w-full bg-card hover:bg-yellow-500 hover:text-black transition-colors rounded-xl h-10 text-sm font-bold"
                    onClick={() => window.open(tariff.redirectUrl, '_blank')}
                  >
                    {tariff.buttonLabel}
                  </Button>
                </Card>
              ))}
              {tariffs.length === 0 && (
                <div className="col-span-2 py-10 text-center text-muted-foreground">
                  {t('no_plans')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PlaylistModal 
        isOpen={isPlaylistModalOpen} 
        onClose={() => setIsPlaylistModalOpen(false)} 
        anime={playlistAnime} 
      />

      {/* Video Player Overlay */}
      <VideoPlayer 
        anime={selectedAnime} 
        onClose={() => setSelectedAnime(null)} 
        onWatchRelated={(id) => {
          const related = animes.find(a => a.id === id);
          if (related) handleWatchAnime(related);
        }}
        allAnimes={animes}
      />

      {/* Footer */}
      <footer className="hidden md:block border-t border-border/50 py-12 px-8 bg-card">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-12">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tighter text-blue-500">METEOR<span className={isDarkMode ? "text-white" : "text-foreground"}>DUB</span></h2>
            <p className="text-sm text-muted-foreground">The ultimate destination for anime lovers. Watch, share, and discuss your favorite shows.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Anime List</li>
              <li className="hover:text-foreground cursor-pointer">New Releases</li>
              <li className="hover:text-foreground cursor-pointer">Popular</li>
              <li className="hover:text-foreground cursor-pointer">Schedule</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Help Center</li>
              <li className="hover:text-foreground cursor-pointer">Terms of Service</li>
              <li className="hover:text-foreground cursor-pointer">Privacy Policy</li>
              <li className="hover:text-foreground cursor-pointer">Contact Us</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Newsletter</h4>
            <div className="flex gap-2">
              <Input placeholder="Email address" className="bg-muted border-border" />
              <Button className="bg-blue-500 hover:bg-blue-600">Join</Button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
          {t('copyright')}
        </div>
      </footer>
      </div>
    </div>
  );
}

