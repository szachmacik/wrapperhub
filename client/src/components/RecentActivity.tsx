import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Bot, Image as ImageIcon, FileText, Code2, Mic, Video, Globe, Zap,
  TrendingUp, Clock, Activity, BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";

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

const CATEGORY_COLORS: Record<string, string> = {
  chat: "bg-blue-500/10 text-blue-600",
  image: "bg-purple-500/10 text-purple-600",
  document: "bg-orange-500/10 text-orange-600",
  code: "bg-green-500/10 text-green-600",
  audio: "bg-pink-500/10 text-pink-600",
  video: "bg-red-500/10 text-red-600",
  search: "bg-cyan-500/10 text-cyan-600",
  custom: "bg-yellow-500/10 text-yellow-600",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function RecentActivityWidget() {
  const [, navigate] = useLocation();
  const { data: logs, isLoading } = trpc.plans.myUsage.useQuery();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
          <button
            onClick={() => navigate("/dashboard/history")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View all →
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))
        ) : (logs ?? []).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Clock size={24} className="mx-auto mb-2 opacity-30" />
            <p>No activity yet</p>
            <button
              onClick={() => navigate("/marketplace")}
              className="text-primary hover:underline text-xs mt-1"
            >
              Explore tools →
            </button>
          </div>
        ) : (
          (logs ?? []).slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 py-1.5 hover:bg-muted/30 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
              onClick={() => navigate("/dashboard/history")}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground`}>
                <Zap size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{log.wrapperName ?? "Unknown tool"}</p>
                <p className="text-xs text-muted-foreground">
                  {(log.inputTokens ?? 0) + (log.outputTokens ?? 0) > 0
                    ? `${(log.inputTokens ?? 0) + (log.outputTokens ?? 0)} tokens`
                    : log.requestType ?? "request"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(log.createdAt)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function UserStatsWidget() {
  const { data: rawLogs, isLoading } = trpc.plans.myUsage.useQuery();

  // Compute stats from usage logs
  const stats = rawLogs ? {
    totalRequests: rawLogs.length,
    totalTokens: rawLogs.reduce((s, l) => s + (l.inputTokens ?? 0) + (l.outputTokens ?? 0), 0),
    uniqueWrappers: new Set(rawLogs.map((l) => l.wrapperName)).size,
    thisMonthRequests: rawLogs.filter((l) => {
      const d = new Date(l.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  } : null;
  const { data: myPlan } = trpc.plans.myPlan.useQuery();

  const usagePercent = stats && myPlan?.plan?.monthlyRequestLimit
    ? Math.min(100, Math.round((stats.totalRequests / myPlan.plan.monthlyRequestLimit) * 100))
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <CardTitle className="text-base">Your Stats</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <>
            {/* Usage bar */}
            {myPlan?.plan?.monthlyRequestLimit && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Monthly Usage</span>
                  <span className="font-medium">
                    {stats?.totalRequests ?? 0} / {myPlan.plan.monthlyRequestLimit.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground">{usagePercent}% used this month</p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-xl font-bold">{(stats?.totalRequests ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <p className="text-xs text-muted-foreground">Tokens Used</p>
                <p className="text-xl font-bold">{((stats?.totalTokens ?? 0) / 1000).toFixed(1)}k</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <p className="text-xs text-muted-foreground">Tools Used</p>
                <p className="text-xl font-bold">{stats?.uniqueWrappers ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-xl font-bold">{stats?.thisMonthRequests ?? 0}</p>
              </div>
            </div>

            {/* Plan badge */}
            {myPlan?.plan && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="text-sm font-medium">{myPlan.plan.name} Plan</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {myPlan.userPlan?.status ?? "active"}
                </Badge>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
