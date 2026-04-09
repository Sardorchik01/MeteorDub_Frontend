import * as React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Film, Users, Shield, LogOut, 
  Menu, X, Bell, Search, Settings, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import Dashboard from './Dashboard';
import AnimeManagement from './AnimeManagement';
import MemberManagement from './MemberManagement';
import AdminManagement from './AdminManagement';
import AdminLogin from './Login';

export default function AdminLayout() {
  const { profile, loading, isAuthReady } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  if (!isAuthReady || loading) {
    return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white">Loading...</div>;
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
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', roles: ['superadmin', 'uploader', 'support'] },
    { label: 'Anime Catalog', icon: Film, path: '/admin/animes', roles: ['superadmin', 'uploader'] },
    { label: 'Members', icon: Users, path: '/admin/members', roles: ['superadmin', 'support'] },
    { label: 'Admins', icon: Shield, path: '/admin/admins', roles: ['superadmin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold text-blue-500">ADMIN<span className="text-white">PANEL</span></h1>}
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
                location.pathname === item.path ? "bg-blue-500 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
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
          <Button variant="ghost" className={cn("w-full mt-4 text-red-500 hover:text-red-400 hover:bg-red-500/10", !isSidebarOpen && "px-0")}>
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-zinc-900 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950" />
            </Button>
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
            <Route path="/members" element={<MemberManagement />} />
            <Route path="/admins" element={<AdminManagement />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
