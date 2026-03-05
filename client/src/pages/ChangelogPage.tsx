import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Bug, TrendingUp, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const TYPE_META = {
  feature:     { label: "Nowa funkcja",  icon: <Zap size={14} />,           color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  fix:         { label: "Poprawka",      icon: <Bug size={14} />,            color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  improvement: { label: "Ulepszenie",    icon: <TrendingUp size={14} />,     color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  breaking:    { label: "Breaking",      icon: <AlertTriangle size={14} />,  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

export default function ChangelogPage() {
  const { data: entries, isLoading } = trpc.changelog.list.useQuery({ limit: 30 });

  // Seed domyślne wpisy jeśli brak
  const defaultEntries = [
    { id: 1, version: "1.3.0", title: "Marketplace narzędzi AI", content: "Dodano publiczny katalog narzędzi z wyszukiwarką, filtrami kategorii i systemem ocen.", type: "feature" as const, publishedAt: new Date("2026-03-05") },
    { id: 2, version: "1.2.0", title: "Streaming chat AI", content: "Wdrożono streaming odpowiedzi AI przez SSE — odpowiedzi pojawiają się w czasie rzeczywistym.", type: "feature" as const, publishedAt: new Date("2026-03-04") },
    { id: 3, version: "1.1.0", title: "Panel admina z wykresami", content: "Dodano wykresy Recharts do panelu admina: przychód, marża, top narzędzia.", type: "improvement" as const, publishedAt: new Date("2026-03-03") },
    { id: 4, version: "1.0.0", title: "Pierwsze wydanie WrapperHub", content: "Platforma do zarządzania wrapperami AI z panelem klienta, admina i integracją Stripe.", type: "feature" as const, publishedAt: new Date("2026-03-01") },
  ];

  const displayEntries = (entries && entries.length > 0) ? entries : defaultEntries;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> Powrót</Link>
        </Button>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Changelog</h1>
          <p className="text-muted-foreground">Historia zmian i aktualizacji platformy WrapperHub.</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-8">
              {displayEntries.map((entry, idx) => {
                const meta = TYPE_META[entry.type] ?? TYPE_META.feature;
                return (
                  <div key={entry.id ?? idx} className="flex gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-primary border-2 border-background shadow-sm mt-1" />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-bold text-primary">v{entry.version}</span>
                        <Badge className={`text-xs flex items-center gap-1 ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(entry.publishedAt).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base mb-1">{entry.title}</h3>
                      <p className="text-sm text-muted-foreground">{entry.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
