import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Code2, Plus, Trash2, Copy, ArrowLeft, Globe, Zap, BarChart3, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function EmbedWidget() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWrapperId, setSelectedWrapperId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [allowedOrigins, setAllowedOrigins] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTokenForSnippet, setSelectedTokenForSnippet] = useState<{ token: string; wrapperId: number } | null>(null);

  const { data: embedTokens, refetch } = trpc.embed.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wrappers } = trpc.wrappers.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: snippetData } = trpc.embed.getSnippet.useQuery(
    { token: selectedTokenForSnippet?.token ?? "", wrapperId: selectedTokenForSnippet?.wrapperId ?? 0 },
    { enabled: !!selectedTokenForSnippet }
  );

  const createToken = trpc.embed.create.useMutation({
    onSuccess: () => {
      toast.success("Token embed utworzony");
      setShowCreateDialog(false);
      setSelectedWrapperId("");
      setLabel("");
      setAllowedOrigins("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteToken = trpc.embed.delete.useMutation({
    onSuccess: () => { toast.success("Token usunięty"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    toast.success("Skopiowano do schowka");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!isAuthenticated) { navigate("/"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              Embed Widget
            </h1>
            <p className="text-muted-foreground text-sm">Osadź dowolne narzędzie AI na swojej stronie jednym snippetem</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Globe className="h-5 w-5 text-blue-500" />, title: "Dowolna strona", desc: "Wklej snippet na WordPress, Webflow, Squarespace i inne" },
            { icon: <Zap className="h-5 w-5 text-yellow-500" />, title: "Bez logowania", desc: "Odwiedzający korzystają bez konta WrapperHub" },
            { icon: <BarChart3 className="h-5 w-5 text-green-500" />, title: "Pełne statystyki", desc: "Licznik requestów per embed token w panelu" },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  {b.icon}
                  <div>
                    <p className="font-medium text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tokens List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Twoje tokeny embed</CardTitle>
                <CardDescription>Każdy token = jeden widget na jednej stronie</CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nowy token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Utwórz token embed</DialogTitle>
                    <DialogDescription>Token pozwoli osadzić wybrane narzędzie na zewnętrznej stronie.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Narzędzie AI</Label>
                      <Select value={selectedWrapperId} onValueChange={setSelectedWrapperId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz narzędzie..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wrappers?.map(w => (
                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Etykieta (opcjonalna)</Label>
                      <Input placeholder="np. Widget na stronie głównej" value={label} onChange={e => setLabel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Dozwolone domeny (opcjonalne)</Label>
                      <Input
                        placeholder="np. example.com, mysite.pl"
                        value={allowedOrigins}
                        onChange={e => setAllowedOrigins(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Oddziel przecinkami. Puste = wszystkie domeny.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Anuluj</Button>
                    <Button
                      onClick={() => createToken.mutate({
                        wrapperId: Number(selectedWrapperId),
                        label: label || undefined,
                        allowedOrigins: allowedOrigins ? allowedOrigins.split(",").map(s => s.trim()) : undefined,
                      })}
                      disabled={!selectedWrapperId || createToken.isPending}
                    >
                      {createToken.isPending ? "Tworzenie..." : "Utwórz token"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!embedTokens || embedTokens.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Code2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm">Brak tokenów embed</p>
                  <p className="text-xs mt-1">Utwórz pierwszy token aby osadzić widget</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {embedTokens.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTokenForSnippet?.token === t.token
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent/5"
                      }`}
                      onClick={() => setSelectedTokenForSnippet({ token: t.token, wrapperId: t.wrapperId })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{t.label || `Token #${t.id}`}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.token.slice(0, 20)}...</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{t.requestCount} requestów</Badge>
                            {t.isActive && <Badge variant="outline" className="text-xs bg-green-100 text-green-800">Aktywny</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={e => { e.stopPropagation(); copyToClipboard(t.token, `token-${t.id}`); }}
                          >
                            {copiedToken === `token-${t.id}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={e => { e.stopPropagation(); deleteToken.mutate({ id: t.id }); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Snippet Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Snippet do wklejenia</CardTitle>
              <CardDescription>
                {selectedTokenForSnippet ? "Kliknij aby skopiować i wklej na swojej stronie" : "Wybierz token aby zobaczyć snippet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTokenForSnippet ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Code2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Wybierz token z listy</p>
                </div>
              ) : (
                <Tabs defaultValue="html">
                  <TabsList className="mb-4">
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="react">React</TabsTrigger>
                    <TabsTrigger value="preview">Podgląd</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html">
                    <div className="relative">
                      <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                        {snippetData?.snippet ?? "Ładowanie..."}
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => snippetData && copyToClipboard(snippetData.snippet, "html-snippet")}
                      >
                        {copiedToken === "html-snippet" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="react">
                    <div className="relative">
                      <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-64 font-mono whitespace-pre-wrap">
{`import { useEffect, useRef } from 'react';

export function WrapperHubWidget({ token, wrapperId }) {
  return (
    <iframe
      src={\`https://wrapperhub.manus.space/embed/\${wrapperId}?token=\${token}\`}
      style={{
        width: '100%',
        height: '600px',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
      allow="clipboard-write"
    />
  );
}

// Użycie:
// <WrapperHubWidget 
//   token="${selectedTokenForSnippet.token}" 
//   wrapperId={${selectedTokenForSnippet.wrapperId}} 
// />`}
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`<WrapperHubWidget token="${selectedTokenForSnippet.token}" wrapperId={${selectedTokenForSnippet.wrapperId}} />`, "react-snippet")}
                      >
                        {copiedToken === "react-snippet" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="preview">
                    <Alert>
                      <Globe className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Widget będzie wyświetlany jako iframe 100% szerokości × 600px wysokości z zaokrąglonymi rogami i cieniem. 
                        Użytkownicy mogą korzystać z narzędzia AI bez opuszczania Twojej strony.
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4 border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
                      <Code2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">Podgląd widgetu</p>
                      <p className="text-xs mt-1">Widget załaduje się tutaj po wklejeniu snippetu na Twojej stronie</p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Jak to działa?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Utwórz token", desc: "Wybierz narzędzie AI i utwórz unikalny token embed" },
                { step: "2", title: "Skopiuj snippet", desc: "Skopiuj wygenerowany kod HTML lub React" },
                { step: "3", title: "Wklej na stronie", desc: "Wklej snippet w dowolnym miejscu na swojej stronie" },
                { step: "4", title: "Widget działa", desc: "Odwiedzający korzystają z AI bez opuszczania Twojej strony" },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
