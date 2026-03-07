import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MessageSquare, Clock, Search, Trash2, Play } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ToolHistory() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");

  const { data: wrapper } = trpc.wrappers.getBySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: conversationsRaw, isLoading } = trpc.wrappers.conversations.list.useQuery();
  const conversations = conversationsRaw?.filter((c) => c.wrapper.id === (wrapper?.id ?? -1));

  const deleteConversation = trpc.wrappers.conversations.delete.useMutation({
    onSuccess: () => {
      utils.wrappers.conversations.list.invalidate();
      toast.success("Conversation deleted.");
    },
  });

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (!search.trim()) return conversations;
    return conversations.filter((c) =>
      c.conv.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const getMsgCount = (c: { conv: { messages: unknown[] | null } }) =>
    Array.isArray(c.conv.messages) ? c.conv.messages.length : 0;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/tool/${slug}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tool
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h1 className="font-semibold">
              {wrapper ? `${wrapper.name} — History` : "Conversation History"}
            </h1>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => navigate(`/dashboard/tool/${slug}`)}>
              <Play className="h-4 w-4 mr-2" /> New Conversation
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary/60" />
              <div>
                <p className="text-2xl font-bold">{conversations?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total conversations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary/60" />
              <div>
                <p className="text-2xl font-bold">
                  {conversations && conversations.length > 0
                    ? formatDate(conversations[0].conv.createdAt)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last conversation</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {search ? "No conversations match your search." : "No conversations yet. Start chatting!"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => navigate(`/dashboard/tool/${slug}`)}>
                  Start First Conversation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {filtered.map((item) => (
              <motion.div
                key={item.conv.id}
                variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-sm transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => navigate(`/dashboard/tool/${slug}?conv=${item.conv.id}`)}
                    >
                      <p className="font-medium text-sm truncate">
                        {item.conv.title || `Conversation #${item.conv.id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(item.conv.createdAt)}</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {getMsgCount(item)} msg
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/dashboard/tool/${slug}?conv=${item.conv.id}`)}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this conversation?")) {
                            deleteConversation.mutate({ id: item.conv.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
