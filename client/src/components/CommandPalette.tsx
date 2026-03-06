import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Bot, Image as ImageIcon, FileText, Code2, Mic, Video, Globe, Zap,
  LayoutDashboard, Settings, CreditCard, History, MessageSquare,
  Star, ShoppingBag, HelpCircle, Activity, Rocket, BarChart3, User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <Bot size={14} />,
  image: <ImageIcon size={14} />,
  document: <FileText size={14} />,
  code: <Code2 size={14} />,
  audio: <Mic size={14} />,
  video: <Video size={14} />,
  search: <Globe size={14} />,
  custom: <Zap size={14} />,
};

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={14} />, group: "Navigation" },
  { label: "Marketplace", path: "/marketplace", icon: <ShoppingBag size={14} />, group: "Navigation" },
  { label: "Conversation History", path: "/dashboard/conversations", icon: <MessageSquare size={14} />, group: "Navigation" },
  { label: "Usage History", path: "/dashboard/history", icon: <History size={14} />, group: "Navigation" },
  { label: "Billing & Plans", path: "/dashboard/billing", icon: <CreditCard size={14} />, group: "Navigation" },
  { label: "Profile", path: "/dashboard/profile", icon: <User size={14} />, group: "Navigation" },
  { label: "Settings", path: "/dashboard/settings", icon: <Settings size={14} />, group: "Navigation" },
  { label: "FAQ", path: "/faq", icon: <HelpCircle size={14} />, group: "Navigation" },
  { label: "System Status", path: "/status", icon: <Activity size={14} />, group: "Navigation" },
  { label: "Changelog", path: "/changelog", icon: <Star size={14} />, group: "Navigation" },
];

const ADMIN_ITEMS = [
  { label: "Admin Panel", path: "/admin", icon: <LayoutDashboard size={14} />, group: "Admin" },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={14} />, group: "Admin" },
  { label: "Quick Deploy", path: "/admin/quick-deploy", icon: <Rocket size={14} />, group: "Admin" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: wrappers } = trpc.wrappers.list.useQuery();

  const handleOpen = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        handleOpen();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [handleOpen]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border/60 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search tools, pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* AI Tools */}
          {wrappers && wrappers.length > 0 && (
            <CommandGroup heading="AI Tools">
              {wrappers.map((w) => (
                <CommandItem
                  key={w.id}
                  value={`tool-${w.name}-${w.category}`}
                  onSelect={() => go(`/dashboard/tool/${w.slug}`)}
                  className="flex items-center gap-2"
                >
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-muted-foreground">{CATEGORY_ICONS[w.category] ?? <Zap size={14} />}</span>
                    <span>{w.name}</span>
                    {w.isFeatured && <Badge className="text-[10px] h-4 px-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Featured</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">{w.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.path}
                value={`nav-${item.label}`}
                onSelect={() => go(item.path)}
                className="flex items-center gap-2"
              >
                <span className="text-muted-foreground">{item.icon}</span>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Admin (only for admins) */}
          {user?.role === "admin" && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Admin">
                {ADMIN_ITEMS.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={`admin-${item.label}`}
                    onSelect={() => go(item.path)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
