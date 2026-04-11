import * as React from 'react';
import { 
  Users, Film, TrendingUp, Eye, 
  ArrowUpRight, ArrowDownRight, Activity, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Anime, UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const CACHE_KEY = 'admin_dashboard_stats';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = React.useState({
    totalViews: 0,
    activeUsers: 0,
    newSubscriptions: 0,
    animeUploads: 0,
    recentActivity: [] as any[],
    chartData: [] as any[]
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      // Check cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setStats(data);
          setLoading(false);
          return;
        }
      }

      try {
        // Fetch real data
        const [usersSnap, animesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'animes'))
        ]);

        const users = usersSnap.docs.map(doc => doc.data() as UserProfile);
        const animes = animesSnap.docs.map(doc => doc.data() as Anime);

        const totalViews = animes.reduce((acc, curr) => acc + (curr.views || 0), 0);
        const activeUsers = users.length;
        const newSubscriptions = users.filter(u => u.tariffId && u.tariffId !== 'free').length;
        const animeUploads = animes.length;

        // Mock chart data for now as we don't have historical stats in Firestore yet
        const chartData = [
          { name: 'Mon', views: Math.floor(totalViews * 0.1) },
          { name: 'Tue', views: Math.floor(totalViews * 0.15) },
          { name: 'Wed', views: Math.floor(totalViews * 0.12) },
          { name: 'Thu', views: Math.floor(totalViews * 0.2) },
          { name: 'Fri', views: Math.floor(totalViews * 0.18) },
          { name: 'Sat', views: Math.floor(totalViews * 0.13) },
          { name: 'Sun', views: Math.floor(totalViews * 0.12) },
        ];

        // Recent activity from animes
        const recentActivity = animes
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5)
          .map(anime => ({
            id: anime.id,
            title: `${t('anime_catalog')}: ${anime.title}`,
            time: new Date(anime.createdAt).toLocaleString()
          }));

        const newStats = {
          totalViews,
          activeUsers,
          newSubscriptions,
          animeUploads,
          recentActivity,
          chartData
        };

        setStats(newStats);
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newStats,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('total_views')} 
          value={stats.totalViews.toLocaleString()} 
          change="+0%" 
          trend="up" 
          icon={Eye} 
          color="blue" 
        />
        <StatCard 
          title={t('active_users')} 
          value={stats.activeUsers.toLocaleString()} 
          change="+0%" 
          trend="up" 
          icon={Users} 
          color="purple" 
        />
        <StatCard 
          title={t('premium_users')} 
          value={stats.newSubscriptions.toLocaleString()} 
          change="+0%" 
          trend="up" 
          icon={TrendingUp} 
          color="green" 
        />
        <StatCard 
          title={t('anime_uploads')} 
          value={stats.animeUploads.toLocaleString()} 
          change="+0%" 
          trend="up" 
          icon={Film} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              {t('traffic_overview')} (Cached 2h)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{t('recent_activity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Film className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-center text-muted-foreground py-10">{t('no_activity')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    green: 'text-green-500 bg-green-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
  };

  return (
    <Card className="bg-card border-border hover:border-accent transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-xl", colors[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div className={cn(
            "flex items-center text-xs font-bold",
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          )}>
            {change}
            {trend === 'up' ? <ArrowUpRight className="ml-1 h-3 w-3" /> : <ArrowDownRight className="ml-1 h-3 w-3" />}
          </div>
        </div>
        <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
