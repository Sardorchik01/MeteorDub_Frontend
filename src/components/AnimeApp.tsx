import * as React from 'react';
import { 
  Home, Search, Play, User, Heart, MessageSquare, 
  Bell, Menu, LogOut, Settings, Moon, Sun, Send,
  Chrome, Lock, Crown, Eye, EyeOff
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
import { MOCK_ANIMES } from '../constants';
import { Anime, AppSection, ChatMessage, UserProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export default function AnimeApp() {
  const { user, profile, isAuthReady } = useAuth();
  const [activeSection, setActiveSection] = React.useState<AppSection>('home');
  const [selectedAnime, setSelectedAnime] = React.useState<Anime | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDarkMode, setIsDarkMode] = React.useState(true);
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

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Hey! Looking for recommendations? How about "Chainsaw Man" or "Spy x Family"?', timestamp: Date.now() }
  ]);
  const [inputMessage, setInputMessage] = React.useState('');

  React.useEffect(() => {
    if (user && profile && !profile.birthYear) {
      setIsProfileUpdateModalOpen(true);
    }
  }, [user, profile]);

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

        await signInWithEmailAndPassword(auth, loginEmail, authForm.password);
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

  const handleWatchAnime = (anime: Anime) => {
    if (anime.accessType === 'premium') {
      if (!user) {
        setIsLoginModalOpen(true);
        return;
      }
      if (profile?.status !== 'premium') {
        setIsPremiumModalOpen(true);
        return;
      }
    }
    setSelectedAnime(anime);
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
        content: `That's a great choice! If you like that, you might also enjoy ${MOCK_ANIMES[Math.floor(Math.random() * MOCK_ANIMES.length)].title}.`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-300",
      isDarkMode ? "bg-[#0a0a0b] text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Desktop Navbar */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 sticky top-0 z-40 bg-inherit/80 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold tracking-tighter text-blue-500">METEOR<span className={isDarkMode ? "text-white" : "text-zinc-900"}>DUB</span></h1>
          <nav className="flex items-center gap-6">
            <button onClick={() => setActiveSection('home')} className={cn("text-sm font-medium transition-colors", activeSection === 'home' ? "text-blue-500" : "text-zinc-400 hover:text-white")}>Home</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-white">Anime List</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-white">Genres</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-white">Schedule</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-white">News</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search anime..." 
              className="pl-10 bg-zinc-900/50 border-zinc-800 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
              </Button>
              <Avatar className="h-10 w-10 border-2 border-zinc-800 cursor-pointer" onClick={() => setActiveSection('profile')}>
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{profile?.firstName[0]}{profile?.lastName[0]}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button onClick={() => setIsLoginModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6">
              Login
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
              {/* Hero Section */}
              <section className="relative h-[60vh] md:h-[80vh] overflow-hidden">
                <img 
                  src={MOCK_ANIMES[0].thumbnail} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-6 max-w-4xl">
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-3 py-1">Featured</Badge>
                  <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{MOCK_ANIMES[0].title}</h2>
                  <p className="text-zinc-300 text-lg line-clamp-3 max-w-2xl">{MOCK_ANIMES[0].description}</p>
                  <div className="flex items-center gap-4">
                    <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8" onClick={() => handleWatchAnime(MOCK_ANIMES[0])}>
                      <Play className="mr-2 h-5 w-5 fill-white" /> Watch Now
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 border-zinc-700 hover:bg-zinc-800">
                      <Heart className="mr-2 h-5 w-5" /> Add to List
                    </Button>
                  </div>
                </div>
              </section>

              {/* Trending Section */}
              <section className="px-4 md:px-16 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-blue-500">~</span> Trending Now
                  </h3>
                  <Button variant="link" className="text-zinc-400">View All</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {MOCK_ANIMES.map((anime) => (
                    <motion.div 
                      key={anime.id}
                      whileHover={{ y: -10 }}
                      className="group cursor-pointer"
                      onClick={() => handleWatchAnime(anime)}
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                        <img src={anime.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            {anime.accessType === 'premium' && profile?.status !== 'premium' ? <Lock className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 fill-white text-white" />}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          <Badge className="bg-black/60 backdrop-blur-md border-none">{anime.rating}</Badge>
                          {anime.accessType === 'premium' && (
                            <Badge className="bg-yellow-500 text-black border-none font-bold flex items-center gap-1">
                              <Crown className="h-3 w-3" /> PREMIUM
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold truncate group-hover:text-blue-500 transition-colors">{anime.title}</h4>
                      <p className="text-xs text-zinc-500">{anime.year} • {anime.episodes} Eps</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Recently Updated & Genres */}
              <section className="px-4 md:px-16 grid md:grid-cols-3 gap-12 pb-16">
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Recently Updated</h3>
                    <Button variant="link" className="text-zinc-400">View All</Button>
                  </div>
                  <div className="space-y-4">
                    {MOCK_ANIMES.slice(0, 3).map((anime) => (
                      <Card key={anime.id} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer overflow-hidden" onClick={() => handleWatchAnime(anime)}>
                        <div className="flex gap-4 p-3">
                          <img src={anime.thumbnail} className="w-20 h-28 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className="font-semibold">{anime.title}</h4>
                            <p className="text-sm text-blue-500">Latest Episode #{anime.episodes}</p>
                            <p className="text-xs text-zinc-500 mt-1">Updated 2 hours ago</p>
                          </div>
                          <div className="flex items-center pr-4">
                            <Button size="icon" variant="ghost" className="rounded-full hover:bg-blue-500 hover:text-white">
                              {anime.accessType === 'premium' && profile?.status !== 'premium' ? <Lock className="h-5 w-5" /> : <Play className="h-5 w-5" />}
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
                      <Button key={genre} variant="outline" className="h-24 flex flex-col gap-2 border-zinc-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all group">
                        <span className={cn("font-semibold", isDarkMode ? "text-zinc-400 group-hover:text-blue-500" : "text-zinc-600 group-hover:text-blue-500")}>{genre}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </section>
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
                  <h2 className="text-xl font-bold">Anime AI Assistant</h2>
                  <p className="text-sm text-zinc-500">Ask me for recommendations or info!</p>
                </div>
              </div>
              
              <Card className="flex-1 bg-zinc-900/50 border-zinc-800 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}>
                        <div className={cn(
                          "max-w-[80%] p-3 rounded-2xl text-sm",
                          msg.role === 'user' ? "bg-blue-500 text-white rounded-tr-none" : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-zinc-800 flex gap-2">
                  <Input 
                    placeholder="Type your message..." 
                    className="bg-zinc-800 border-zinc-700 focus:ring-blue-500"
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
              className="max-w-4xl mx-auto p-8 space-y-12"
            >
              {user ? (
                <>
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
                          profile?.status !== 'premium' && "bg-zinc-500/20 text-zinc-500 border-zinc-500/50"
                        )}>
                          {profile?.status === 'premium' ? 'Premium Member' : 'Standard Member'}
                        </Badge>
                        {profile?.role !== 'user' && (
                          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50 capitalize">{profile?.role}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-xl font-bold">Account Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Moon className="h-5 w-5 text-zinc-400" />
                              <span>Dark Mode</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
                              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Bell className="h-5 w-5 text-zinc-400" />
                              <span>Notifications</span>
                            </div>
                            <Badge>Enabled</Badge>
                          </div>
                          <Button variant="destructive" className="w-full" onClick={() => signOut(auth)}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-6 space-y-6">
                        <h3 className="text-xl font-bold">Watch Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-zinc-800/50 text-center">
                            <p className="text-2xl font-bold text-blue-500">124</p>
                            <p className="text-xs text-zinc-500">Anime Watched</p>
                          </div>
                          <div className="p-4 rounded-xl bg-zinc-800/50 text-center">
                            <p className="text-2xl font-bold text-blue-500">2.4k</p>
                            <p className="text-xs text-zinc-500">Episodes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 space-y-6">
                  <div className="h-20 w-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-10 w-10 text-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Sign in to view profile</h2>
                    <p className="text-zinc-500">Keep track of your favorites and watch history.</p>
                  </div>
                  <Button onClick={() => setIsLoginModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 px-8 h-12 rounded-full">
                    Login with Google
                  </Button>
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
              <h2 className="text-3xl font-bold">My Collection</h2>
              <Tabs defaultValue="watching" className="w-full">
                <TabsList className="bg-zinc-900 border-zinc-800">
                  <TabsTrigger value="watching">Watching</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="plan">Plan to Watch</TabsTrigger>
                </TabsList>
                <TabsContent value="watching" className="mt-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {MOCK_ANIMES.slice(0, 4).map((anime) => (
                      <div key={anime.id} className="group cursor-pointer" onClick={() => handleWatchAnime(anime)}>
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                          <img src={anime.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                            <div className="h-full bg-blue-500 w-2/3" />
                          </div>
                        </div>
                        <h4 className="font-semibold truncate">{anime.title}</h4>
                        <p className="text-xs text-zinc-500">Ep 12 / 24</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0b]/90 backdrop-blur-lg border-t border-zinc-800 flex items-center justify-around px-4 z-40">
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('home')} className={cn(activeSection === 'home' ? "text-blue-500" : "text-zinc-500")}>
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('favorites')} className={cn(activeSection === 'favorites' ? "text-blue-500" : "text-zinc-500")}>
          <Heart className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('ai')} className={cn(activeSection === 'ai' ? "text-blue-500" : "text-zinc-500")}>
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveSection('profile')} className={cn(activeSection === 'profile' ? "text-blue-500" : "text-zinc-500")}>
          <User className="h-6 w-6" />
        </Button>
      </nav>

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              {authMode === 'login' 
                ? 'Sign in to access premium content and save your favorites.' 
                : 'Join MeteorDub to start your anime journey.'}
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
                  <label className="text-xs font-medium text-zinc-500">First Name</label>
                  <Input 
                    placeholder="John" 
                    className="bg-zinc-900 border-zinc-800"
                    value={authForm.firstName}
                    onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Last Name</label>
                  <Input 
                    placeholder="Doe" 
                    className="bg-zinc-900 border-zinc-800"
                    value={authForm.lastName}
                    onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500">Username</label>
                <Input 
                  placeholder="anime_fan" 
                  className="bg-zinc-900 border-zinc-800"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500">
                {authMode === 'login' ? 'Username yoki Email' : 'Email Address'}
              </label>
              <Input 
                placeholder={authMode === 'login' ? "Usernameyingiz yoki elektron pochtangizni kiritng" : "email@example.com"}
                className="bg-zinc-900 border-zinc-800"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  className="bg-zinc-900 border-zinc-800 pr-10"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authMode === 'signup' && (
                <p className="text-[10px] text-zinc-500">
                  Min 8 chars, 1 uppercase, 1 number, 1 special char.
                </p>
              )}
            </div>

            <Button onClick={handleAuth} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl">
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 border-zinc-800 hover:bg-zinc-900 text-white font-bold rounded-xl">
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
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Update Modal */}
      <Dialog open={isProfileUpdateModalOpen} onOpenChange={setIsProfileUpdateModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>Please provide your birth year to continue.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500">Birth Year</label>
              <Input 
                type="number" 
                placeholder="e.g. 1995" 
                className="bg-zinc-900 border-zinc-800"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleUpdateProfile} disabled={!birthYear}>
              Save and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Modal */}
      <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <Crown className="h-10 w-10 text-yellow-500" />
            </div>
            <DialogTitle className="text-2xl font-bold">Premium Required</DialogTitle>
            <DialogDescription className="text-zinc-500">
              This anime is exclusive to Premium members. Upgrade your plan to watch this and many more!
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <p className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Ad-free experience
              </p>
              <p className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Exclusive premium animes
              </p>
              <p className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> 4K Ultra HD quality
              </p>
            </div>
            <Button 
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl"
              onClick={() => window.open(selectedAnime?.upgradeLink || 'https://meteordub.uz/upgrade', '_blank')}
            >
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Overlay */}
      <VideoPlayer 
        anime={selectedAnime} 
        onClose={() => setSelectedAnime(null)} 
      />

      {/* Footer */}
      <footer className="hidden md:block border-t border-zinc-800/50 py-12 px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-12">
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tighter text-blue-500">METEOR<span className={isDarkMode ? "text-white" : "text-zinc-900"}>DUB</span></h2>
            <p className="text-sm text-zinc-500">The ultimate destination for anime lovers. Watch, share, and discuss your favorite shows.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="hover:text-white cursor-pointer">Anime List</li>
              <li className="hover:text-white cursor-pointer">New Releases</li>
              <li className="hover:text-white cursor-pointer">Popular</li>
              <li className="hover:text-white cursor-pointer">Schedule</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Support</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="hover:text-white cursor-pointer">Help Center</li>
              <li className="hover:text-white cursor-pointer">Terms of Service</li>
              <li className="hover:text-white cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer">Contact Us</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Newsletter</h4>
            <div className="flex gap-2">
              <Input placeholder="Email address" className="bg-zinc-900 border-zinc-800" />
              <Button className="bg-blue-500 hover:bg-blue-600">Join</Button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-zinc-800/50 text-center text-xs text-zinc-500">
          © 2024 MeteorDub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
