import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, User, Crown, Zap, MessageSquare, ImageIcon,
  FileText, Code2, BarChart3, Calendar, Clock, CheckCircle2,
  XCircle, AlertCircle, TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  code: <Code2 className="h-4 w-4" />,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <AlertCircle className="h-4 w-4 text-yellow-500" />,
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pl-PL", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("pl-PL", {
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function Profile() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const { data: myPlan, isLoading: planLoading } = trpc.plans.myPlan.useQuery();
  const { data: usage, isLoading: usageLoading } = trpc.plans.myUsage.useQuery();

  // Compute stats from usage
  const stats = useMemo(() => {
    if (!usage) return null;
    const total = usage.length;
    const successful = usage.filter((u) => u.status === "success").length;
    const failed = usage.filter((u) => u.status === "error").length;
    const totalTokens = usage.reduce((sum, u) => sum + (u.inputTokens ?? 0) + (u.outputTokens ?? 0), 0);
    const avgDuration = usage.length > 0
      ? usage.reduce((sum, u) => sum + (u.durationMs ?? 0), 0) / usage.length
      : 0;

    // Requests by wrapper
    const byWrapper: Record<string, number> = {};
    usage.forEach((u) => {
      byWrapper[u.wrapperName] = (byWrapper[u.wrapperName] ?? 0) + 1;
    });
    const topWrappers = Object.entries(byWrapper)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Requests by day (last 7 days)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
    });
    const byDay: Record<string, number> = {};
    usage.forEach((u) => {
      const day = new Date(u.createdAt).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
      byDay[day] = (byDay[day] ?? 0) + 1;
    });

    return { total, successful, failed, totalTokens, avgDuration, topWrappers, last7, byDay };
  }, [usage]);

  const planLimit = myPlan?.plan?.monthlyRequestLimit ?? null;
  const planUsed = stats?.total ?? 0;
  const planPercent = planLimit ? Math.min(100, (planUsed / planLimit) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span className="font-semibold">My Profile</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Profile card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold">{user?.name ?? "User"}</h1>
                  {user?.role === "admin" && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5">{user?.email ?? "No email"}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {user?.createdAt ? formatDate(user.createdAt) : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last sign in {user?.lastSignedIn ? formatDate(user.lastSignedIn) : "—"}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>

        {/* Plan & usage */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" /> Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {planLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : myPlan ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">{myPlan.plan.name}</span>
                    <Badge variant="secondary">{myPlan.userPlan.status}</Badge>
                  </div>
                  {planLimit && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly requests</span>
                        <span className="font-medium">{planUsed} / {planLimit}</span>
                      </div>
                      <Progress value={planPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">{(100 - planPercent).toFixed(0)}% remaining</p>
                    </div>
                  )}
                  {!planLimit && (
                    <p className="text-sm text-muted-foreground">Unlimited requests</p>
                  )}
                  <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/dashboard/billing")}>
                    Manage Plan
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">No active plan</p>
                  <Button size="sm" onClick={() => navigate("/dashboard/billing")}>Get Started</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total requests</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total tokens</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</p>
                    <p className="text-xs text-muted-foreground">Avg. response</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No usage data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top tools used */}
        {stats && stats.topWrappers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Most Used Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topWrappers.map(([name, count], i) => {
                  const maxCount = stats.topWrappers[0]?.[1] ?? 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{count} req</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Recent Activity
            </CardTitle>
            <CardDescription>Last 20 requests</CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : usage && usage.length > 0 ? (
              <div className="space-y-1">
                {usage.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-muted-foreground">
                      {STATUS_ICONS[item.status ?? "success"]}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{item.wrapperName}</span>
                      <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
                        {item.requestType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      {(item.inputTokens || item.outputTokens) ? (
                        <span>{((item.inputTokens ?? 0) + (item.outputTokens ?? 0)).toLocaleString()} tok</span>
                      ) : null}
                      <span>{formatDuration(item.durationMs)}</span>
                      <span className="hidden sm:inline">{formatDate(item.createdAt)} {formatTime(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/history")}>
                    View full history →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No activity yet. Start using AI tools!</p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/dashboard")}>
                  Explore Tools
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
