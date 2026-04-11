import * as React from 'react';
import { 
  Send, Users, Search, Check, 
  Loader2, Bell, Play, Info, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '../contexts/NotificationContext';
import { Anime, Tariff, UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function NotificationManagement() {
  const { t } = useLanguage();
  const { sendNotification } = useNotifications();
  const [animes, setAnimes] = React.useState<Anime[]>([]);
  const [tariffs, setTariffs] = React.useState<Tariff[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isSending, setIsSending] = React.useState(false);

  const [targetType, setTargetType] = React.useState<'all' | 'tariff' | 'users'>('all');
  const [selectedTariffIds, setSelectedTariffIds] = React.useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [selectedAnimeId, setSelectedAnimeId] = React.useState<string>('');
  
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  
  const [animeSearch, setAnimeSearch] = React.useState('');
  const [userSearch, setUserSearch] = React.useState('');

  React.useEffect(() => {
    // Fetch Animes
    const qAnime = query(collection(db, 'animes'), orderBy('createdAt', 'desc'));
    const unsubAnime = onSnapshot(qAnime, (snapshot) => {
      setAnimes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Anime[]);
    });

    // Fetch Tariffs
    const qTariff = query(collection(db, 'tariffs'), orderBy('createdAt', 'desc'));
    const unsubTariff = onSnapshot(qTariff, (snapshot) => {
      setTariffs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tariff[]);
    });

    // Fetch Users (for specific user selection)
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any);
    });

    return () => {
      unsubAnime();
      unsubTariff();
      unsubUsers();
    };
  }, []);

  const filteredAnimes = animes.filter(a => 
    a.title.toLowerCase().includes(animeSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSend = async () => {
    if (!title || !message) return;
    
    setIsSending(true);
    try {
      let targetUsers: string[] = [];

      if (targetType === 'all') {
        targetUsers = users.map(u => u.uid);
      } else if (targetType === 'tariff') {
        targetUsers = users.filter(u => u.tariffId && selectedTariffIds.includes(u.tariffId)).map(u => u.uid);
      } else {
        targetUsers = selectedUserIds;
      }

      // Send notifications in batches or one by one (for simplicity here, one by one)
      const promises = targetUsers.map(userId => 
        sendNotification(userId, title, message, 'info', selectedAnimeId)
      );

      await Promise.all(promises);
      
      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUserIds([]);
      setSelectedTariffIds([]);
      setSelectedAnimeId('');
      alert(t('broadcast_sent'));
    } catch (error) {
      console.error('Error sending broadcast:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('notifications_mgmt')}</h2>
          <p className="text-muted-foreground">{t('send_broadcast')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium">{t('notification_title')}</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Anime Release!"
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">{t('notification_message')}</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full min-h-[120px] bg-muted border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">{t('linked_anime')}</label>
              <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder={t('search')}
                    className="w-full bg-muted border border-border rounded-lg h-9 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={animeSearch}
                    onChange={(e) => setAnimeSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[150px] border border-border rounded-lg bg-background">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setSelectedAnimeId('')}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                        !selectedAnimeId ? "bg-blue-500/10 text-blue-500 font-medium" : "hover:bg-accent"
                      )}
                    >
                      <span>{t('no_related')}</span>
                      {!selectedAnimeId && <Check className="h-4 w-4" />}
                    </button>
                    {filteredAnimes.map((anime) => (
                      <button
                        key={anime.id}
                        onClick={() => setSelectedAnimeId(anime.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                          selectedAnimeId === anime.id ? "bg-blue-500/10 text-blue-500 font-medium" : "hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <img src={anime.thumbnail} className="h-8 w-6 object-cover rounded" referrerPolicy="no-referrer" />
                          <span className="truncate">{anime.title}</span>
                        </div>
                        {selectedAnimeId === anime.id && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium">{t('target_type')}</label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={targetType === 'all' ? 'default' : 'outline'}
                  onClick={() => setTargetType('all')}
                  className="h-20 flex flex-col gap-2 rounded-xl"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-[10px]">{t('all_users')}</span>
                </Button>
                <Button 
                  variant={targetType === 'tariff' ? 'default' : 'outline'}
                  onClick={() => setTargetType('tariff')}
                  className="h-20 flex flex-col gap-2 rounded-xl"
                >
                  <Crown className="h-5 w-5" />
                  <span className="text-[10px]">{t('by_tariff')}</span>
                </Button>
                <Button 
                  variant={targetType === 'users' ? 'default' : 'outline'}
                  onClick={() => setTargetType('users')}
                  className="h-20 flex flex-col gap-2 rounded-xl"
                >
                  <Bell className="h-5 w-5" />
                  <span className="text-[10px]">{t('specific_users')}</span>
                </Button>
              </div>
            </div>

            {targetType === 'tariff' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t('select_tariff')}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedTariffIds(tariffs.map(t => t.id))}
                      className="text-[10px] text-blue-500 hover:underline"
                    >
                      Select all
                    </button>
                    <button 
                      onClick={() => setSelectedTariffIds([])}
                      className="text-[10px] text-muted-foreground hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {tariffs.map((tariff) => (
                    <Button
                      key={tariff.id}
                      variant={selectedTariffIds.includes(tariff.id) ? 'default' : 'outline'}
                      onClick={() => {
                        if (selectedTariffIds.includes(tariff.id)) {
                          setSelectedTariffIds(selectedTariffIds.filter(id => id !== tariff.id));
                        } else {
                          setSelectedTariffIds([...selectedTariffIds, tariff.id]);
                        }
                      }}
                      className="justify-start h-12 rounded-xl relative overflow-hidden"
                    >
                      <Badge variant="outline" className="mr-2">{tariff.price}</Badge>
                      <span className="truncate">{tariff.name}</span>
                      {selectedTariffIds.includes(tariff.id) && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {selectedTariffIds.length} tariffs selected
                </p>
              </div>
            )}

            {targetType === 'users' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium">{t('select_users')}</label>
                <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder={t('search')}
                      className="w-full bg-muted border border-border rounded-lg h-9 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[200px] border border-border rounded-lg bg-background">
                    <div className="p-2 space-y-1">
                      {filteredUsers.map((u) => (
                        <button
                          key={u.uid}
                          onClick={() => {
                            if (selectedUserIds.includes(u.uid)) {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== u.uid));
                            } else {
                              setSelectedUserIds([...selectedUserIds, u.uid]);
                            }
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                            selectedUserIds.includes(u.uid) ? "bg-blue-500/10 text-blue-500 font-medium" : "hover:bg-accent"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{u.username}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                          {selectedUserIds.includes(u.uid) && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <span>{selectedUserIds.length} users selected</span>
                    <button onClick={() => setSelectedUserIds([])} className="hover:text-foreground">Clear all</button>
                  </div>
                </div>
              </div>
            )}

            <Button 
              className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
              disabled={isSending || !title || !message || (targetType === 'tariff' && selectedTariffIds.length === 0) || (targetType === 'users' && selectedUserIds.length === 0)}
              onClick={handleSend}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('send_broadcast')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
