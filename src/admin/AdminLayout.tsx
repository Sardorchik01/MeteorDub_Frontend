import * as React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Film, Users, Shield, LogOut, 
  Menu, X, Search, Settings, ChevronRight, CreditCard, Bot,
  Sun, Moon, Bell, Image as ImageIcon
} from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import Dashboard from './Dashboard';
import AnimeManagement from './AnimeManagement';
import MemberManagement from './MemberManagement';
import AdminManagement from './AdminManagement';
import TariffManagement from './TariffManagement';
import AdManagement from './AdManagement';
import AISettings from './AISettings';
import NotificationManagement from './NotificationManagement';
import StoryManagement from './StoryManagement';
import AdminLogin from './Login';

import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminLayout() {
  const { t } = useLanguage();
  const { profile, loading, isAuthReady } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  if (!isAuthReady || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;
  }

  // Login route is public for admins
  if (location.pathname === '/admin/login') {
    return <AdminLogin />;
  }

  // Protect all other admin routes
  if (!profile || profile.role === 'user') {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { label: t('dashboard'), icon: LayoutDashboard, path: '/admin', roles: ['superadmin', 'uploader', 'support'] },
    { label: t('anime_catalog'), icon: Film, path: '/admin/animes', roles: ['superadmin', 'uploader'] },
    { label: t('tariffs'), icon: CreditCard, path: '/admin/tariffs', roles: ['superadmin'] },
    { label: t('members'), icon: Users, path: '/admin/members', roles: ['superadmin', 'support'] },
    { label: t('ads'), icon: CreditCard, path: '/admin/ads', roles: ['superadmin'] },
    { label: t('ai_settings'), icon: Bot, path: '/admin/ai-settings', roles: ['superadmin'] },
    { label: 'Stories', icon: ImageIcon, path: '/admin/stories', roles: ['superadmin'] },
    { label: t('notifications_mgmt'), icon: Bell, path: '/admin/notifications', roles: ['superadmin', 'uploader', 'support'] },
    { label: t('admins'), icon: Shield, path: '/admin/admins', roles: ['superadmin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border transition-all duration-300 flex flex-col z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold text-blue-500">ADMIN<span className="text-foreground">PANEL</span></h1>}
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                location.pathname === item.path ? "bg-blue-500 text-white" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {isSidebarOpen && (
          <div className="px-4 mb-4">
            <LanguageSwitcher />
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className="px-4 mb-4 flex items-center justify-between">
            {isSidebarOpen && <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dark_mode')}</span>}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{profile.firstName} {profile.lastName}</p>
                <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className={cn("w-full mt-4 text-red-500 hover:text-red-400 hover:bg-red-500/10", !isSidebarOpen && "px-0")}
            onClick={() => signOut(auth)}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="ml-3">{t('logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground capitalize">{location.pathname.split('/').pop() || t('dashboard')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder={t('search')} 
                className="bg-muted border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <NotificationBell />
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/animes" element={<AnimeManagement />} />
            <Route path="/tariffs" element={<TariffManagement />} />
            <Route path="/members" element={<MemberManagement />} />
            <Route path="/ads" element={<AdManagement />} />
            <Route path="/ai-settings" element={<AISettings />} />
            <Route path="/stories" element={<StoryManagement />} />
            <Route path="/notifications" element={<NotificationManagement />} />
            <Route path="/admins" element={<AdminManagement />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
