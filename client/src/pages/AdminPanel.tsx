import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, BarChart3, Bot, Code2, FileText, ImageIcon, Key, Plus,
  Settings, Trash2, Users, Zap, TrendingUp, DollarSign, Activity, Edit, Download, Rocket,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function AdminPanel() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  if (user && user.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h1 className="font-semibold">Admin Panel</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/analytics")}>
              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/quick-deploy")}>
              <Rocket className="h-4 w-4 mr-2" /> Quick Deploy
            </Button>
            <Badge variant="secondary">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="wrappers"><Bot className="h-4 w-4 mr-2" />Wrappers</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="apikeys"><Key className="h-4 w-4 mr-2" />API Keys</TabsTrigger>
            <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-2" />Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="wrappers"><WrappersTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="apikeys"><ApiKeysTab /></TabsContent>
          <TabsContent value="logs"><LogsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = trpc.plans.admin.usageStats.useQuery({ days: 30 });
  const { data: logsRaw } = trpc.plans.admin.usageLogs.useQuery({ limit: 500 });
  const logsData = logsRaw ?? [];

  const stats = data?.stats;
  const byWrapper = data?.byWrapper ?? [];

  // Build daily chart data from logs
  const dailyData = useMemo(() => {
    if (!logsData?.length) return [];
    const map = new Map<string, { date: string; requests: number; revenue: number; margin: number }>();
    for (const item of logsData) {
      const entry = item.log;
      const date = new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = map.get(date) ?? { date, requests: 0, revenue: 0, margin: 0 };
      map.set(date, {
        date,
        requests: existing.requests + 1,
        revenue: existing.revenue + parseFloat(entry.totalChargedUsd ?? "0"),
        margin: existing.margin + parseFloat(entry.marginUsd ?? "0"),
      });
    }
    return Array.from(map.values()).slice(-14).map((d) => ({
      ...d,
      revenue: parseFloat(d.revenue.toFixed(4)),
      margin: parseFloat(d.margin.toFixed(4)),
    }));
  }, [logsData]);

  const handleExportCSV = () => {
    if (!logsData?.length) { toast.error("No data to export"); return; }
    const headers = ["Date", "User", "Wrapper", "Type", "Tokens", "Cost USD", "Margin USD", "Charged USD", "Status", "Duration ms"];
    const rows = logsData.map(({ log: l, wrapper: w, user: u }) => [
      new Date(l.createdAt).toISOString(),
      u.name ?? u.email ?? l.userId,
      w.name,
      l.requestType,
      (l.inputTokens ?? 0) + (l.outputTokens ?? 0),
      l.baseCostUsd,
      l.marginUsd,
      l.totalChargedUsd,
      l.status,
      l.durationMs,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `wrapperhub-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats?.totalRequests ?? 0, icon: <Zap className="h-4 w-4" />, color: "text-blue-500" },
          { label: "Revenue (USD)", value: `$${parseFloat(stats?.totalRevenue ?? "0").toFixed(2)}`, icon: <DollarSign className="h-4 w-4" />, color: "text-green-500" },
          { label: "Margin (USD)", value: `$${parseFloat(stats?.totalMargin ?? "0").toFixed(2)}`, icon: <TrendingUp className="h-4 w-4" />, color: "text-purple-500" },
          { label: "Total Tokens", value: (stats?.totalTokens ?? 0).toLocaleString(), icon: <Activity className="h-4 w-4" />, color: "text-orange-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <p className="text-2xl font-bold">{isLoading ? "..." : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label} (30 days)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Revenue & Margin</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No usage data yet. Start using tools to see stats.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(4)}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="margin" stroke="#059669" fill="url(#colorMargin)" name="Margin" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Usage by wrapper */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by Wrapper</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {byWrapper.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byWrapper.map((b) => ({ name: b.wrapperName?.slice(0, 12), requests: Number(b.totalRequests) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Wrapper</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {byWrapper.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {byWrapper.map((item) => (
                  <div key={item.wrapperId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.wrapperName}</span>
                        <span className="text-xs text-muted-foreground">${parseFloat(item.totalRevenue ?? "0").toFixed(4)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, (Number(item.totalRequests) / Math.max(1, ...byWrapper.map(b => Number(b.totalRequests)))) * 100)}%` }}
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
  );
}

// ─── Wrappers Tab ─────────────────────────────────────────────────────────────
function WrappersTab() {
  const utils = trpc.useUtils();
  const { data: wrappers } = trpc.wrappers.admin.list.useQuery();
  const upsertMutation = trpc.wrappers.admin.upsert.useMutation({ onSuccess: () => { utils.wrappers.admin.list.invalidate(); toast.success("Wrapper saved!"); } });
  const deleteMutation = trpc.wrappers.admin.delete.useMutation({ onSuccess: () => { utils.wrappers.admin.list.invalidate(); toast.success("Wrapper deleted."); } });

  const [editWrapper, setEditWrapper] = useState<typeof wrappers extends (infer T)[] | undefined ? T | null : null>(null);
  const [open, setOpen] = useState(false);

  const ICONS: Record<string, React.ReactNode> = { chat: <Bot className="h-4 w-4" />, image: <ImageIcon className="h-4 w-4" />, document: <FileText className="h-4 w-4" />, code: <Code2 className="h-4 w-4" /> };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsertMutation.mutate({
      id: editWrapper?.id,
      name: fd.get("name") as string,
      slug: fd.get("slug") as string,
      description: fd.get("description") as string,
      category: fd.get("category") as "chat" | "image" | "document" | "code" | "audio" | "video" | "search" | "custom",
      provider: fd.get("provider") as string,
      modelId: fd.get("modelId") as string,
      icon: fd.get("icon") as string,
      color: fd.get("color") as string,
      costPerRequest: fd.get("costPerRequest") as string,
      costPer1kTokens: fd.get("costPer1kTokens") as string,
      marginMultiplier: fd.get("marginMultiplier") as string,
      isActive: fd.get("isActive") === "on",
      isFeatured: fd.get("isFeatured") === "on",
    });
    setOpen(false);
    setEditWrapper(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">AI Wrappers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditWrapper(null)}>
              <Plus className="h-4 w-4 mr-2" /> Add Wrapper
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editWrapper ? "Edit Wrapper" : "New Wrapper"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input name="name" defaultValue={editWrapper?.name} required /></div>
                <div><Label>Slug</Label><Input name="slug" defaultValue={editWrapper?.slug} required /></div>
              </div>
              <div><Label>Description</Label><Textarea name="description" defaultValue={editWrapper?.description ?? ""} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select name="category" defaultValue={editWrapper?.category ?? "chat"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["chat", "image", "document", "code", "audio", "video", "search", "custom"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Provider</Label><Input name="provider" defaultValue={editWrapper?.provider ?? "openai"} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Model ID</Label><Input name="modelId" defaultValue={editWrapper?.modelId ?? ""} placeholder="gpt-4o" /></div>
                <div><Label>Icon (lucide)</Label><Input name="icon" defaultValue={editWrapper?.icon ?? "bot"} /></div>
              </div>
              <div><Label>Color</Label><Input name="color" type="color" defaultValue={editWrapper?.color ?? "#6366f1"} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Cost/Request ($)</Label><Input name="costPerRequest" defaultValue={editWrapper?.costPerRequest ?? "0"} /></div>
                <div><Label>Cost/1k Tokens ($)</Label><Input name="costPer1kTokens" defaultValue={editWrapper?.costPer1kTokens ?? "0"} /></div>
                <div><Label>Margin Multiplier</Label><Input name="marginMultiplier" defaultValue={editWrapper?.marginMultiplier ?? "2.0"} /></div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch name="isActive" defaultChecked={editWrapper?.isActive ?? true} /><Label>Active</Label></div>
                <div className="flex items-center gap-2"><Switch name="isFeatured" defaultChecked={editWrapper?.isFeatured ?? false} /><Label>Featured</Label></div>
              </div>
              <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>Save Wrapper</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {(wrappers ?? []).map((w) => (
          <Card key={w.id} className={`${!w.isActive ? "opacity-60" : ""}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${w.color}20`, color: w.color ?? undefined }}>
                {ICONS[w.category] ?? <Bot className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{w.name}</span>
                  <Badge variant="secondary" className="text-xs">{w.category}</Badge>
                  {!w.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  {w.isFeatured && <Badge className="text-xs">Featured</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{w.provider} · {w.modelId} · Margin: {w.marginMultiplier}x</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditWrapper(w); setOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this wrapper?")) deleteMutation.mutate({ id: w.id }); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const utils = trpc.useUtils();
  const { data: users } = trpc.plans.admin.listUsers.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const assignPlanMutation = trpc.plans.admin.assignPlan.useMutation({ onSuccess: () => { utils.plans.admin.listUsers.invalidate(); toast.success("Plan assigned!"); } });
  const updateRoleMutation = trpc.plans.admin.updateUserRole.useMutation({ onSuccess: () => { utils.plans.admin.listUsers.invalidate(); toast.success("Role updated!"); } });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return (users ?? []).filter((u) => {
      const matchSearch = !search ||
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const exportCSV = () => {
    const header = "ID,Name,Email,Role,Created\n";
    const rows = filtered.map((u) =>
      `${u.id},"${u.name ?? ""}","${u.email ?? ""}",${u.role},${new Date(u.createdAt).toISOString()}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `wrapperhub-users-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported!");
  };

  const adminCount = (users ?? []).filter(u => u.role === "admin").length;
  const userCount = (users ?? []).filter(u => u.role === "user").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users ({users?.length ?? 0})</h2>
          <p className="text-xs text-muted-foreground">{adminCount} admins · {userCount} users</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{user.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{user.email ?? user.openId}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">{user.role}</Badge>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role: role as "user" | "admin" })}
                  >
                    <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(planId) => assignPlanMutation.mutate({ userId: user.id, planId: parseInt(planId) })}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Assign plan" /></SelectTrigger>
                    <SelectContent>
                      {(plans ?? []).map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No users matching filters.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────
function ApiKeysTab() {
  const utils = trpc.useUtils();
  const { data: keys } = trpc.plans.admin.listApiKeys.useQuery();
  const upsertMutation = trpc.plans.admin.upsertApiKey.useMutation({ onSuccess: () => { utils.plans.admin.listApiKeys.invalidate(); toast.success("API key saved!"); setOpen(false); } });
  const deleteMutation = trpc.plans.admin.deleteApiKey.useMutation({ onSuccess: () => { utils.plans.admin.listApiKeys.invalidate(); toast.success("Key deleted."); } });
  const [open, setOpen] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsertMutation.mutate({ provider: fd.get("provider") as string, label: fd.get("label") as string, key: fd.get("key") as string });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">Manage provider API keys used by all wrappers.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add API Key</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label>Provider</Label><Input name="provider" placeholder="openai" required /></div>
              <div><Label>Label (optional)</Label><Input name="label" placeholder="Production key" /></div>
              <div><Label>API Key</Label><Input name="key" type="password" placeholder="sk-..." required /></div>
              <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>Save Key</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {(keys ?? []).map((key) => (
              <div key={key.id} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><Key className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{key.provider}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key.keyHash} {key.label ? `· ${key.label}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={key.isActive ? "secondary" : "outline"} className="text-xs">{key.isActive ? "Active" : "Inactive"}</Badge>
                  {key.lastUsedAt && <span className="text-xs text-muted-foreground">Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this key?")) deleteMutation.mutate({ id: key.id }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!keys || keys.length === 0) && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No API keys configured. Add your OpenAI key to enable AI tools.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────
function LogsTab() {
  const { data: logs } = trpc.plans.admin.usageLogs.useQuery({ limit: 500 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    return (logs ?? []).filter(({ log, wrapper, user }) => {
      const matchSearch = !search ||
        (user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (user.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        wrapper.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || log.status === statusFilter;
      const matchType = typeFilter === "all" || log.requestType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [logs, search, statusFilter, typeFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const totalMargin = filtered.reduce((s, { log }) => s + parseFloat(log.marginUsd), 0);
  const totalCost = filtered.reduce((s, { log }) => s + parseFloat(log.baseCostUsd), 0);
  const totalTokens = filtered.reduce((s, { log }) => s + log.inputTokens + log.outputTokens, 0);

  const exportCSV = () => {
    const header = "ID,User,Wrapper,Type,Tokens,Cost,Margin,Status,Time\n";
    const rows = filtered.map(({ log, wrapper, user }) =>
      `${log.id},"${user.name ?? user.email ?? ""}","${wrapper.name}",${log.requestType},${log.inputTokens + log.outputTokens},${log.baseCostUsd},${log.marginUsd},${log.status},${new Date(log.createdAt).toISOString()}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `wrapperhub-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exported!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Usage Logs</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} entries · ${totalMargin.toFixed(4)} margin · {totalTokens.toLocaleString()} tokens</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search user or wrapper..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="h-8 text-sm max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Margin</p>
          <p className="text-xl font-bold text-green-600">${totalMargin.toFixed(4)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Base Cost</p>
          <p className="text-xl font-bold">${totalCost.toFixed(4)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Tokens</p>
          <p className="text-xl font-bold">{(totalTokens / 1000).toFixed(1)}k</p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Wrapper</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Margin</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map(({ log, wrapper, user }) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-3 text-xs">{user.name ?? user.email ?? "—"}</td>
                    <td className="p-3 text-xs font-medium">{wrapper.name}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{log.requestType}</Badge></td>
                    <td className="p-3 text-right text-xs">{(log.inputTokens + log.outputTokens).toLocaleString()}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground">${parseFloat(log.baseCostUsd).toFixed(4)}</td>
                    <td className="p-3 text-right text-xs text-green-600 font-medium">+${parseFloat(log.marginUsd).toFixed(4)}</td>
                    <td className="p-3"><Badge variant={log.status === "success" ? "secondary" : "destructive"} className="text-xs">{log.status}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No logs matching filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages} ({filtered.length} results)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
