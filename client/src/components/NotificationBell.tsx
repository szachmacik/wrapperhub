import { useState, useEffect } from "react";
import { Bell, CheckCheck, X, Zap, CreditCard, Star, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/_core/hooks/useAuth";

type NotificationType = "info" | "success" | "warning" | "new_tool" | "billing";

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  link?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  info: <Info size={14} className="text-blue-500" />,
  success: <CheckCheck size={14} className="text-green-500" />,
  warning: <AlertTriangle size={14} className="text-orange-500" />,
  new_tool: <Zap size={14} className="text-purple-500" />,
  billing: <CreditCard size={14} className="text-primary" />,
};

const STORAGE_KEY = "wrapperhub_notifications";

function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Seed initial notifications for new users
function seedInitialNotifications(): AppNotification[] {
  return [
    {
      id: "welcome-1",
      type: "success",
      title: "Welcome to WrapperHub!",
      message: "Your account is ready. Explore AI tools in the Marketplace.",
      createdAt: new Date(Date.now() - 1000 * 60 * 2),
      read: false,
      link: "/marketplace",
    },
    {
      id: "new-tool-1",
      type: "new_tool",
      title: "New Tool: Code Assistant",
      message: "GPT-4o powered code review and generation is now available.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      read: false,
      link: "/marketplace",
    },
    {
      id: "info-1",
      type: "info",
      title: "Platform Update",
      message: "Streaming chat, image generation and document analysis are live.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
      link: "/changelog",
    },
  ];
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = getStoredNotifications();
    if (stored.length === 0) {
      const initial = seedInitialNotifications();
      saveNotifications(initial);
      setNotifications(initial);
    } else {
      setNotifications(stored);
    }
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markRead = (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const dismiss = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                <CheckCheck size={12} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Bell size={24} className="mx-auto mb-2 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="mt-0.5 shrink-0">
                    {NOTIFICATION_ICONS[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-tight ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                        className="text-muted-foreground/50 hover:text-muted-foreground shrink-0 mt-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  setNotifications([]);
                  saveNotifications([]);
                }}
              >
                Clear all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
