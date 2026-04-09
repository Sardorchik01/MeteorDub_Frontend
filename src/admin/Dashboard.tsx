import * as React from 'react';
import { 
  Users, Film, TrendingUp, Eye, 
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { cn } from '@/lib/utils';

const data = [
  { name: 'Mon', views: 4000, subs: 240 },
  { name: 'Tue', views: 3000, subs: 139 },
  { name: 'Wed', views: 2000, subs: 980 },
  { name: 'Thu', views: 2780, subs: 390 },
  { name: 'Fri', views: 1890, subs: 480 },
  { name: 'Sat', views: 2390, subs: 380 },
  { name: 'Sun', views: 3490, subs: 430 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Views" 
          value="1.2M" 
          change="+12.5%" 
          trend="up" 
          icon={Eye} 
          color="blue" 
        />
        <StatCard 
          title="Active Users" 
          value="45.2k" 
          change="+3.2%" 
          trend="up" 
          icon={Users} 
          color="purple" 
        />
        <StatCard 
          title="New Subscriptions" 
          value="1,284" 
          change="-2.4%" 
          trend="down" 
          icon={TrendingUp} 
          color="green" 
        />
        <StatCard 
          title="Anime Uploads" 
          value="842" 
          change="+4" 
          trend="up" 
          icon={Film} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Traffic Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center">
                  <Film className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">New anime uploaded: Demon Slayer S4</p>
                  <p className="text-xs text-zinc-500">2 hours ago</p>
                </div>
              </div>
            ))}
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
    <Card className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
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
        <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
