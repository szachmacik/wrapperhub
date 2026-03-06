import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, MessageSquare, Search, Trash2, Clock, ChevronRight, Bot,
  RefreshCw, Calendar, Hash,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function ConversationHistory() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedWrapper, setSelectedWrapper] = useState<string>("all");

  const { data: conversations, isLoading, refetch } = trpc.wrappers.conversations.list.useQuery();
  const deleteConv = trpc.wrappers.conversations.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Conversation deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  // Group by wrapper
  const wrapperGroups = useMemo(() => {
    if (!conversations) return {};
    const groups: Record<string, string> = {};
    for (const { wrapper } of conversations) {
      groups[wrapper.slug] = wrapper.name;
    }
    return groups;
  }, [conversations]);

  const filtered = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter(({ conv, wrapper }) => {
      const matchesSearch = search === "" ||
        conv.title?.toLowerCase().includes(search.toLowerCase()) ||
        wrapper.name.toLowerCase().includes(search.toLowerCase());
      const matchesWrapper = selectedWrapper === "all" || wrapper.slug === selectedWrapper;
      return matchesSearch && matchesWrapper;
    });
  }, [conversations, search, selectedWrapper]);

  const formatDate = (d: Date | string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getMessageCount = (conv: { messages: unknown }) => {
    try {
      const msgs = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages;
      return Array.isArray(msgs) ? msgs.length : 0;
    } catch { return 0; }
  };

  const getPreview = (conv: { messages: unknown }) => {
    try {
      const msgs = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages;
      if (!Array.isArray(msgs) || msgs.length === 0) return "Empty conversation";
      const last = msgs[msgs.length - 1];
      return (last?.content as string)?.slice(0, 120) + ((last?.content as string)?.length > 120 ? "..." : "") || "No content";
    } catch { return "No preview"; }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h1 className="font-semibold">Conversation History</h1>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {filtered.length} conversations
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedWrapper === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedWrapper("all")}
            >
              All Tools
            </Button>
            {Object.entries(wrapperGroups).map(([slug, name]) => (
              <Button
                key={slug}
                variant={selectedWrapper === slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWrapper(slug)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Start chatting with any AI tool to see your history here.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <Bot className="h-4 w-4 mr-2" /> Browse Tools
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-3 pr-2">
              {filtered.map(({ conv, wrapper }) => (
                <Card
                  key={conv.id}
                  className="group hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/dashboard/tool/${wrapper.slug}?conv=${conv.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ background: wrapper.color || "#7c3aed" + "20" }}
                      >
                        {wrapper.icon || "🤖"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{conv.title || "Untitled conversation"}</span>
                          <Badge variant="outline" className="text-xs shrink-0">{wrapper.name}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {getPreview(conv)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(conv.updatedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {getMessageCount(conv)} messages
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Resume conversation"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/tool/${wrapper.slug}?conv=${conv.id}`);
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConv.mutate({ id: conv.id });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
