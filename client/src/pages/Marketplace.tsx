import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Star, Heart, Zap, Image as ImageIcon, FileText, Code2,
  Mic, Video, Globe, Bot, Filter, TrendingUp, Sparkles, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  chat:     { label: "Chat AI",      icon: <Bot size={16} />,       color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  image:    { label: "Obrazy",       icon: <ImageIcon size={16} />, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  document: { label: "Dokumenty",    icon: <FileText size={16} />,  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  code:     { label: "Kod",          icon: <Code2 size={16} />,     color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  audio:    { label: "Audio",        icon: <Mic size={16} />,       color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  video:    { label: "Wideo",        icon: <Video size={16} />,     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  search:   { label: "Wyszukiwanie", icon: <Globe size={16} />,     color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  custom:   { label: "Custom",       icon: <Zap size={16} />,       color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
};

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {value > 0 ? `${value.toFixed(1)} (${count})` : "Brak ocen"}
      </span>
    </div>
  );
}

function WrapperCard({ wrapper, isFavorited, onToggleFavorite }: {
  wrapper: { id: number; name: string; description: string | null; category: string; provider: string; isFeatured: boolean };
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
}) {
  const { data: ratingData } = trpc.ratings.getForWrapper.useQuery({ wrapperId: wrapper.id });
  const { data: tags } = trpc.tags.getForWrapper.useQuery({ wrapperId: wrapper.id });
  const meta = CATEGORY_META[wrapper.category] ?? CATEGORY_META.custom;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30 relative overflow-hidden">
      {wrapper.isFeatured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/20 to-transparent px-3 py-1">
          <span className="text-xs font-medium text-primary flex items-center gap-1">
            <Sparkles size={10} /> Featured
          </span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${meta.color}`}>
              {meta.icon}
            </div>
            <div>
              <CardTitle className="text-base">{wrapper.name}</CardTitle>
              <span className="text-xs text-muted-foreground">{wrapper.provider}</span>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(wrapper.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted"
          >
            <Heart
              size={16}
              className={isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm line-clamp-2">
          {wrapper.description ?? "Narzędzie AI gotowe do użycia."}
        </CardDescription>

        <StarRating
          value={ratingData?.stats?.avg ?? 0}
          count={ratingData?.stats?.count ?? 0}
        />

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className={`text-xs ${meta.color}`}>
            {meta.label}
          </Badge>
          {tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <Link href={`/tools/${wrapper.id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full text-xs">Szczegóły</Button>
          </Link>
          <Link href={`/dashboard/tool/${wrapper.id}`} className="flex-1">
            <Button size="sm" className="w-full group/btn text-xs">
              Użyj <ArrowRight size={12} className="ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "featured" | "newest" | "rating">("featured");

  const { data: wrappersData, isLoading } = trpc.wrappers.list.useQuery();
  const { data: favoriteIds = [] } = trpc.favorites.list.useQuery(undefined, { enabled: isAuthenticated });

  const utils = trpc.useUtils();
  const toggleFavoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast(data.isFavorited ? "Dodano do ulubionych" : "Usunięto z ulubionych");
      utils.favorites.list.invalidate(undefined);
    },
  });

  const handleToggleFavorite = (wrapperId: number) => {
    if (!isAuthenticated) {
      toast("Zaloguj się, aby dodać do ulubionych", {
        action: { label: "Zaloguj", onClick: () => window.location.href = getLoginUrl() },
      });
      return;
    }
    toggleFavoriteMutation.mutate({ wrapperId });
  };

  const wrappers = wrappersData ?? [];
  const categories = ["all", ...Array.from(new Set(wrappers.map((w) => w.category)))];

  const filtered = useMemo(() => {
    let result = wrappers.filter((w) => {
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || (w.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || w.category === selectedCategory;
      return matchSearch && matchCategory;
    });
    if (sortBy === "featured") result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    else if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "newest") result = [...result].reverse();
    return result;
  }, [wrappers, search, selectedCategory, selectedTag, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles size={14} /> Marketplace narzędzi AI
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Odkryj narzędzia AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Gotowe do użycia wrappery AI — chat, obrazy, kod, dokumenty i więcej. Bez konfiguracji, bez kluczy API.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Szukaj narzędzi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 text-base rounded-full border-border/60 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><TrendingUp size={14} /> {wrappers.length} narzędzi</span>
          <span className="flex items-center gap-1.5"><Zap size={14} /> {categories.length - 1} kategorii</span>
          {isAuthenticated && <span className="flex items-center gap-1.5"><Heart size={14} /> {favoriteIds.length} ulubionych</span>}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter size={14} /> Kategoria:
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {cat === "all" ? "Wszystkie" : (CATEGORY_META[cat]?.label ?? cat)}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sortuj:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
            >
              <option value="featured">Polecane</option>
              <option value="name">Nazwa A-Z</option>
              <option value="newest">Najnowsze</option>
              <option value="rating">Najwyżej oceniane</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak wyników</h3>
            <p className="text-muted-foreground">Spróbuj innej frazy lub zmień kategorię</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSelectedCategory("all"); }}>
              Wyczyść filtry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((wrapper) => (
              <WrapperCard
                key={wrapper.id}
                wrapper={wrapper}
                isFavorited={favoriteIds.includes(wrapper.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* CTA dla niezalogowanych */}
        {!isAuthenticated && (
          <div className="mt-16 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-10 border border-primary/20">
            <h2 className="text-2xl font-bold mb-3">Gotowy do działania?</h2>
            <p className="text-muted-foreground mb-6">Zaloguj się i zacznij korzystać z narzędzi AI bez konfiguracji.</p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Zaloguj się za darmo</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
