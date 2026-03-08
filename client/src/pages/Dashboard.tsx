import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ToolGridSkeleton, EmptyState } from "@/components/LoadingSkeletons";
import { Progress } from "@/components/ui/progress";
import { NotificationBell } from "@/components/NotificationBell";
import { CommandPalette } from "@/components/CommandPalette";
import { RecentActivityWidget, UserStatsWidget } from "@/components/RecentActivity";
import { Settings as SettingsIcon, Globe } from "lucide-react";
import {
  Bot, Code2, FileText, ImageIcon, Sparkles, LogOut,
  BarChart3, MessageSquare, Crown, ArrowRight, Zap, History, Rocket, User, Menu,
  Heart, Activity, Key, Puzzle, Bell,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  code: <Code2 className="h-5 w-5" />,
};

export default function Dashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const { data: wrappers, isLoading: wrappersLoading } = trpc.wrappers.listForUser.useQuery();
  const { data: myPlan } = trpc.plans.myPlan.useQuery();
  const { data: usage } = trpc.plans.myUsage.useQuery();

  const recentUsage = usage?.slice(0, 5) ?? [];
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col p-4 gap-2 hidden md:flex">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">WrapperHub</span>
        </div>

        <nav className="flex-1 space-y-1">
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard")}>
            <Zap className="h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/history")}>
            <History className="h-4 w-4" /> History
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/billing")}>
            <Crown className="h-4 w-4" /> Billing
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/profile")}>
            <User className="h-4 w-4" /> Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/settings")}>
            <SettingsIcon className="h-4 w-4" /> Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/marketplace")}>
            <Globe className="h-4 w-4" /> Marketplace
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/favorites")}>
            <Heart className="h-4 w-4" /> Favorites
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/conversations")}>
            <MessageSquare className="h-4 w-4" /> Conversations
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/usage")}>
            <Activity className="h-4 w-4" /> Usage Stats
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/notifications")}>
            <Bell className="h-4 w-4" /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/api-keys")}>
            <Key className="h-4 w-4" /> API Keys (BYOK)
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/dashboard/embed")}>
            <Puzzle className="h-4 w-4" /> Embed Widget
          </Button>
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/admin")}>
                <BarChart3 className="h-4 w-4" /> Admin Panel
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/admin/quick-deploy")}>
                <Rocket className="h-4 w-4" /> Quick Deploy
              </Button>
            </>
          )}
        </nav>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{myPlan?.plan?.name ?? "Free"} plan</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" className="flex-1 justify-start gap-2 text-muted-foreground" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden border-b p-3 flex items-center justify-between bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">WrapperHub</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-4 border-b">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">WrapperHub</span>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                  <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => handleNav("/dashboard")}>
                    <Zap className="h-4 w-4" /> Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleNav("/dashboard/history")}>
                    <History className="h-4 w-4" /> History
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleNav("/dashboard/billing")}>
                    <Crown className="h-4 w-4" /> Billing
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleNav("/profile")}>
                    <User className="h-4 w-4" /> Profile
                  </Button>
                  {isAdmin && (
                    <>
                      <div className="pt-4 pb-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleNav("/admin")}>
                        <BarChart3 className="h-4 w-4" /> Admin Panel
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => handleNav("/admin/quick-deploy")}>
                        <Rocket className="h-4 w-4" /> Quick Deploy
                      </Button>
                    </>
                  )}
                </nav>
                <div className="border-t p-3">
                  <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
                      <p className="text-xs text-muted-foreground">{myPlan?.plan?.name ?? "Free"} plan</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>

        <div className="p-6 max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋</h1>
            <p className="text-muted-foreground mt-1">Choose an AI tool to get started.</p>
          </div>

          {/* Plan banner */}
          {myPlan && (() => {
            const limit = myPlan.plan.monthlyRequestLimit ?? 0;
            const used = usage?.length ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            return (
              <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{myPlan.plan.name} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {limit > 0 ? `${used.toLocaleString()} / ${limit.toLocaleString()} requests this month` : "Unlimited requests"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {limit > 0 && (
                        <Badge variant={pct > 80 ? "destructive" : pct > 60 ? "secondary" : "outline"} className="text-xs">
                          {pct}% used
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/billing")}>
                        Upgrade <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {limit > 0 && (
                    <Progress
                      value={pct}
                      className={`h-1.5 ${pct > 80 ? "[&>div]:bg-destructive" : pct > 60 ? "[&>div]:bg-amber-500" : ""}`}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Tools Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your AI Tools</h2>
            {wrappersLoading ? (
              <ToolGridSkeleton count={4} />
            ) : (wrappers ?? []).length === 0 ? (
              <EmptyState
                icon={<Bot size={48} />}
                title="Brak dostępnych narzędzi"
                description="Administrator nie dodał jeszcze żadnych narzędzi AI. Sprawdź ponownie później."
              />
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              >
                {(wrappers ?? []).map((wrapper) => (
                  <motion.div
                    key={wrapper.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.35 }}
                  >
                  <Card
                    className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-border/60 h-full"
                    onClick={() => navigate(`/dashboard/tool/${wrapper.slug}`)}
                  >
                    <CardHeader className="pb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: `${wrapper.color}20`, color: wrapper.color ?? undefined }}
                      >
                        {CATEGORY_ICONS[wrapper.category] ?? <Bot className="h-5 w-5" />}
                      </div>
                      <CardTitle className="text-base">{wrapper.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{wrapper.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs capitalize">{wrapper.category}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
                {(!wrappers || wrappers.length === 0) && (
                  <div className="col-span-4 text-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No tools available yet. Check back soon!</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Bottom widgets: Activity + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            <RecentActivityWidget />
            <UserStatsWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
