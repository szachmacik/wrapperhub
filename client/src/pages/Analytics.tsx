import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, DollarSign, Users, Zap, ArrowLeft,
  BarChart2, Award, Activity
} from "lucide-react";
import { Link } from "wouter";

const COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

function StatCard({ title, value, sub, icon, trend }: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; trend?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}% vs poprzedni miesiąc
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: statsRaw, isLoading: statsLoading } = trpc.plans.admin.usageStats.useQuery({ days: 30 }, { enabled: isAdmin });
  const { data: logsRaw, isLoading: logsLoading } = trpc.plans.admin.usageLogs.useQuery({ limit: 200 }, { enabled: isAdmin });
  const statsData = statsRaw?.stats;

  // Generuj dane do wykresów z logów
  const chartData = useMemo(() => {
    if (!logsRaw || logsRaw.length === 0) return [];
    const byDay: Record<string, { date: string; requests: number; revenue: number; cost: number }> = {};
    logsRaw.forEach((row) => {
      const date = new Date(row.log.createdAt).toLocaleDateString("pl-PL", { month: "short", day: "numeric" });
      if (!byDay[date]) byDay[date] = { date, requests: 0, revenue: 0, cost: 0 };
      byDay[date].requests += 1;
      byDay[date].revenue += Number(row.log.totalChargedUsd ?? 0);
      byDay[date].cost += Number(row.log.baseCostUsd ?? 0);
    });
    return Object.values(byDay).slice(-14);
  }, [logsRaw]);

  const categoryData = useMemo(() => {
    if (!logsRaw || logsRaw.length === 0) return [];
    const byCat: Record<string, number> = {};
    logsRaw.forEach((row) => {
      const cat = row.wrapper.category ?? "other";
      byCat[cat] = (byCat[cat] ?? 0) + 1;
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [logsRaw]);

  const topWrappers = useMemo(() => {
    if (!logsRaw || logsRaw.length === 0) return [];
    const byWrapper: Record<string, { name: string; requests: number; revenue: number }> = {};
    logsRaw.forEach((row) => {
      const key = String(row.log.wrapperId);
      if (!byWrapper[key]) byWrapper[key] = { name: row.wrapper.name ?? `Wrapper ${key}`, requests: 0, revenue: 0 };
      byWrapper[key].requests += 1;
      byWrapper[key].revenue += Number(row.log.totalChargedUsd ?? 0);
    });
    return Object.values(byWrapper).sort((a, b) => b.requests - a.requests).slice(0, 5);
  }, [logsRaw]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Dostęp tylko dla administratorów.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard">Wróć do dashboardu</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = statsLoading || logsLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href="/admin"><ArrowLeft size={16} className="mr-2" /> Admin Panel</Link>
          </Button>
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs">
              <Activity size={10} className="mr-1" /> Live data
            </Badge>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Szczegółowe statystyki platformy WrapperHub</p>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Łączny przychód"
              value={`$${Number(statsData?.totalRevenue ?? 0).toFixed(4)}`}
              sub="Wszystkie płatności"
              icon={<DollarSign size={18} />}
              trend={12}
            />
            <StatCard
              title="Użytkownicy"
              value={String(statsData?.totalRequests ?? 0)}
              sub={`Ostatnie 30 dni`}
              icon={<Users size={18} />}
              trend={8}
            />
            <StatCard
              title="Requesty"
              value={String(logsRaw?.length ?? 0)}
              sub="Łącznie wszystkich narzędzi"
              icon={<Zap size={18} />}
              trend={23}
            />
            <StatCard
              title="Marża"
              value={`$${Number(statsData?.totalMargin ?? 0).toFixed(4)}`}
              sub="Zysk po kosztach API"
              icon={<TrendingUp size={18} />}
              trend={15}
            />
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue over time */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign size={16} className="text-primary" /> Przychód i marża (14 dni)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="margin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `$${v.toFixed(4)}`} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Przychód" stroke="#7c3aed" fill="url(#revenue)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cost" name="Koszt" stroke="#10b981" fill="url(#margin)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 size={16} className="text-primary" /> Kategorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-48 w-full" /> : categoryData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Brak danych</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity size={16} className="text-primary" /> Requesty dziennie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="requests" name="Requesty" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top wrappers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award size={16} className="text-primary" /> Top narzędzia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : topWrappers.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Brak danych</div>
              ) : (
                <div className="space-y-3">
                  {topWrappers.map((w, i) => (
                    <div key={w.name} className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{w.name}</span>
                          <span className="text-muted-foreground">{w.requests} req</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(w.requests / (topWrappers[0]?.requests ?? 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
