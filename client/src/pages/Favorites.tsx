import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, MessageSquare, Star, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  chat: "#7c3aed", image: "#db2777", document: "#059669",
  code: "#2563eb", audio: "#d97706", video: "#dc2626",
  search: "#0891b2", custom: "#6b7280",
};

export default function Favorites() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: wrappers } = trpc.wrappers.list.useQuery();
  const { data: favIds, refetch } = trpc.favorites.list.useQuery();
  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(data.isFavorited ? "Added to favorites" : "Removed from favorites");
    },
  });

  const favorites = useMemo(() => {
    if (!wrappers || !favIds) return [];
    return wrappers.filter((w) => favIds.includes(w.id));
  }, [wrappers, favIds]);

  const filtered = useMemo(() => {
    if (!search) return favorites;
    return favorites.filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.description ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [favorites, search]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <h1 className="font-semibold">Favorite Tools</h1>
          </div>
          <Badge variant="secondary" className="ml-auto">{favorites.length} saved</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {favorites.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search favorites..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No favorites yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Save tools you use often for quick access.
            </p>
            <Button onClick={() => navigate("/marketplace")}>Browse Marketplace</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No favorites match your search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((w) => {
              const color = CATEGORY_COLORS[w.category] ?? "#6b7280";
              return (
                <Card
                  key={w.id}
                  className="group hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                  onClick={() => navigate(`/dashboard/tool/${w.slug}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${color}20` }}
                      >
                        {w.icon || "🤖"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{w.name}</span>
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0"
                            style={{ color, borderColor: `${color}40` }}
                          >
                            {w.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {w.description || "AI-powered tool"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Use tool"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/tool/${w.slug}`);
                          }}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          title="Remove from favorites"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFav.mutate({ wrapperId: w.id });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
