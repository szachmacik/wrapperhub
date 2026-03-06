import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ArrowLeft, Zap, TrendingUp, Clock, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

const COLORS = ["#7c3aed", "#db2777", "#059669", "#2563eb", "#d97706", "#dc2626", "#0891b2"];

export default function UsageDashboard() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const { data: myPlan, isLoading: planLoading } = trpc.plans.myPlan.useQuery();
  const { data: usageLogs, isLoading: logsLoading } = trpc.plans.myUsage.useQuery();

  const stats = useMemo(() => {
    if (!usageLogs) return null;
    const logs = usageLogs;

    // Group by wrapper
    const byWrapper: Record<string, { name: string; count: number; tokens: number }> = {};
    for (const log of logs) {
      const key = log.wrapperName ?? "Unknown";
      if (!byWrapper[key]) byWrapper[key] = { name: key, count: 0, tokens: 0 };
      byWrapper[key].count++;
      byWrapper[key].tokens += (log.inputTokens ?? 0) + (log.outputTokens ?? 0);
    }

    // Group by day (last 14 days)
    const byDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      byDay[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
    }
    for (const log of logs) {
      const d = new Date(log.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in byDay) byDay[key]++;
    }

    // Group by category
    const byCategory: Record<string, number> = {};
    for (const log of logs) {
      const cat = log.requestType ?? "unknown";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    const totalRequests = logs.length;
    const totalTokens = logs.reduce((s, l) => s + (l.inputTokens ?? 0) + (l.outputTokens ?? 0), 0);
    const successRate = logs.length > 0
      ? Math.round((logs.filter((l) => l.status === "success").length / logs.length) * 100)
      : 100;

    // Average response time
    const avgMs = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (l.durationMs ?? 0), 0) / logs.length)
      : 0;

    return {
      totalRequests,
      totalTokens,
      successRate,
      avgMs,
      byWrapper: Object.values(byWrapper).sort((a, b) => b.count - a.count).slice(0, 8),
      byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
    };
  }, [usageLogs]);

  const planLimit = myPlan?.plan?.monthlyRequestLimit ?? 0;
  const planUsed = usageLogs?.length ?? 0;
  const usagePct = planLimit > 0 ? Math.min(100, Math.round((planUsed / planLimit) * 100)) : 0;

  const isLoading = planLoading || logsLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h1 className="font-semibold">Usage Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Plan usage */}
        {!planLoading && myPlan && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{myPlan.plan?.name ?? "Free"} Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {planUsed.toLocaleString()} / {planLimit > 0 ? planLimit.toLocaleString() : "∞"} requests this month
                  </p>
                </div>
                <Badge
                  variant={usagePct > 80 ? "destructive" : usagePct > 60 ? "secondary" : "default"}
                >
                  {usagePct}% used
                </Badge>
              </div>
              {planLimit > 0 && (
                <Progress
                  value={usagePct}
                  className={`h-2 ${usagePct > 80 ? "[&>div]:bg-destructive" : usagePct > 60 ? "[&>div]:bg-amber-500" : ""}`}
                />
              )}
              {usagePct > 80 && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ You're approaching your plan limit.{" "}
                  <button className="underline" onClick={() => navigate("/billing")}>Upgrade plan</button>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Requests", value: stats.totalRequests.toLocaleString(), icon: <Zap className="h-4 w-4 text-primary" />, sub: "all time" },
              { label: "Tokens Used", value: stats.totalTokens > 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : stats.totalTokens.toString(), icon: <TrendingUp className="h-4 w-4 text-green-500" />, sub: "all time" },
              { label: "Success Rate", value: `${stats.successRate}%`, icon: <Activity className="h-4 w-4 text-blue-500" />, sub: "last 200 requests" },
              { label: "Avg Response", value: stats.avgMs > 0 ? `${stats.avgMs}ms` : "—", icon: <Clock className="h-4 w-4 text-amber-500" />, sub: "response time" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {stat.icon}
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {stats && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily usage chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Requests (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.byDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Usage by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byCategory.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top tools */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Tools by Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byWrapper.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No usage data yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.byWrapper.map((w, i) => {
                      const max = stats.byWrapper[0]?.count ?? 1;
                      const pct = Math.round((w.count / max) * 100);
                      return (
                        <div key={w.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                          <span className="text-sm font-medium w-32 truncate">{w.name}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{w.count} req</span>
                          {w.tokens > 0 && (
                            <span className="text-xs text-muted-foreground w-16 text-right">
                              {w.tokens > 1000 ? `${(w.tokens / 1000).toFixed(1)}k` : w.tokens} tok
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
