import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot, Code2, FileText, Image, Sparkles, LogOut, Settings,
  BarChart3, MessageSquare, Crown, ArrowRight, Zap, History,
} from "lucide-react";
import { useLocation } from "wouter";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  code: <Code2 className="h-5 w-5" />,
};

export default function Dashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

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
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/admin")}>
                <BarChart3 className="h-4 w-4" /> Admin Panel
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
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">WrapperHub</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /></Button>
        </div>

        <div className="p-6 max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋</h1>
            <p className="text-muted-foreground mt-1">Choose an AI tool to get started.</p>
          </div>

          {/* Plan banner */}
          {myPlan && (
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{myPlan.plan.name} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {myPlan.plan.monthlyRequestLimit ? `${myPlan.plan.monthlyRequestLimit} requests/month` : "Unlimited requests"}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/billing")}>
                  Upgrade <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tools Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your AI Tools</h2>
            {wrappersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(wrappers ?? []).map((wrapper) => (
                  <Card
                    key={wrapper.id}
                    className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-border/60"
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
                ))}
                {(!wrappers || wrappers.length === 0) && (
                  <div className="col-span-4 text-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No tools available yet. Check back soon!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {recentUsage.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/history")}>
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {recentUsage.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          {CATEGORY_ICONS[item.requestType] ?? <Bot className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.wrapperName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.inputTokens + item.outputTokens > 0 ? `${item.inputTokens + item.outputTokens} tokens` : "1 request"} · {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={item.status === "success" ? "secondary" : "destructive"} className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
