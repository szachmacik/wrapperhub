import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bot, MessageSquare, Image, FileText, Code2, History, Zap } from "lucide-react";
import { useLocation } from "wouter";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  code: <Code2 className="h-4 w-4" />,
};

export default function UsageHistory() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const { data: usage, isLoading } = trpc.plans.myUsage.useQuery();

  const totalRequests = usage?.length ?? 0;
  const successCount = usage?.filter((u) => u.status === "success").length ?? 0;
  const totalTokens = usage?.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <h1 className="font-semibold">Usage History</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Requests", value: totalRequests, icon: <Zap className="h-4 w-4" /> },
            { label: "Successful", value: successCount, icon: <Bot className="h-4 w-4" /> },
            { label: "Total Tokens", value: totalTokens.toLocaleString(), icon: <MessageSquare className="h-4 w-4" /> },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* History list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !usage || usage.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No activity yet. Start using AI tools to see your history here.</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard")}>Explore Tools</Button>
              </div>
            ) : (
              <div className="divide-y">
                {usage.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      {CATEGORY_ICONS[item.requestType] ?? <Bot className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.wrapperName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.inputTokens + item.outputTokens > 0
                          ? `${(item.inputTokens + item.outputTokens).toLocaleString()} tokens`
                          : "1 request"}
                        {item.durationMs ? ` · ${(item.durationMs / 1000).toFixed(1)}s` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={item.status === "success" ? "secondary" : "destructive"} className="text-xs mb-1">
                        {item.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
