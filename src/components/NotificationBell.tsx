import * as React from 'react';
import { Bell, Info, CheckCircle2, AlertCircle, XCircle, Play } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell({ onWatchAnime }: { onWatchAnime?: (animeId: string) => void }) {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative h-11 w-11 rounded-xl bg-muted/50 border border-border"
      )}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border text-foreground p-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">Notifications</h3>
          {unreadCount > 0 && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount} New</span>}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={cn(
                  "p-4 flex gap-3 focus:bg-accent cursor-pointer border-b border-border/50",
                  !n.read && "bg-blue-500/5"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className={cn("text-sm font-medium", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  {n.animeId && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchAnime?.(n.animeId!);
                        markAsRead(n.id);
                      }}
                      className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider"
                    >
                      <Play className="h-3 w-3 fill-blue-500" /> Watch Anime
                    </button>
                  )}
                  <p className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(n.createdAt)} ago</p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <div className="p-2">
          <button className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full text-xs text-muted-foreground hover:text-foreground h-10"
          )}>
            View All Notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
