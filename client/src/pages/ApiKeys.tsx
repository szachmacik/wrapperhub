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
import { toast } from "sonner";
import { Key, Plus, Trash2, Eye, EyeOff, ArrowLeft, Shield, Zap, Info } from "lucide-react";
import { motion } from "framer-motion";

const PROVIDERS = [
  { value: "openai", label: "OpenAI", description: "GPT-4, GPT-3.5, DALL-E, Whisper", color: "bg-green-100 text-green-800" },
  { value: "anthropic", label: "Anthropic", description: "Claude 3 Opus, Sonnet, Haiku", color: "bg-orange-100 text-orange-800" },
  { value: "google", label: "Google AI", description: "Gemini Pro, Gemini Ultra", color: "bg-blue-100 text-blue-800" },
  { value: "mistral", label: "Mistral AI", description: "Mistral Large, Medium, Small", color: "bg-purple-100 text-purple-800" },
];

export default function ApiKeys() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: keys, refetch } = trpc.byok.list.useQuery(undefined, { enabled: isAuthenticated });
  const addKey = trpc.byok.add.useMutation({
    onSuccess: () => {
      toast.success("Klucz API dodany pomyślnie");
      setShowAddDialog(false);
      setProvider("");
      setApiKey("");
      setLabel("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteKey = trpc.byok.delete.useMutation({
    onSuccess: () => { toast.success("Klucz usunięty"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6 text-primary" />
              Własne klucze API (BYOK)
            </h1>
            <p className="text-muted-foreground text-sm">Bring Your Own Key — używaj własnych kluczy i oszczędzaj na marży</p>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Jak to działa?</strong> Gdy dodasz własny klucz API, WrapperHub będzie go używać zamiast naszego. 
            Płacisz bezpośrednio dostawcy AI — bez marży. Twoje klucze są szyfrowane i nigdy nie są wyświetlane w całości.
          </AlertDescription>
        </Alert>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Zap className="h-5 w-5 text-yellow-500" />, title: "Brak marży", desc: "Płacisz tylko dostawcy AI, bez naszej prowizji" },
            { icon: <Shield className="h-5 w-5 text-green-500" />, title: "Pełna kontrola", desc: "Własne limity, własne modele, własne ustawienia" },
            { icon: <Key className="h-5 w-5 text-blue-500" />, title: "Bezpieczne", desc: "Klucze szyfrowane, nigdy nie wyświetlane w całości" },
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

        {/* Keys List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Twoje klucze API</CardTitle>
              <CardDescription>Zarządzaj własnymi kluczami dla różnych dostawców AI</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj klucz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj własny klucz API</DialogTitle>
                  <DialogDescription>
                    Klucz zostanie zaszyfrowany i użyty zamiast naszego przy wywołaniach AI.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Dostawca AI</Label>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz dostawcę..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            <div>
                              <span className="font-medium">{p.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{p.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Klucz API</Label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-7 w-7"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Etykieta (opcjonalna)</Label>
                    <Input
                      placeholder="np. Klucz produkcyjny"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
                  <Button
                    onClick={() => addKey.mutate({ provider: provider as "openai" | "anthropic" | "google" | "mistral", apiKey, label: label || undefined })}
                    disabled={!provider || !apiKey || addKey.isPending}
                  >
                    {addKey.isPending ? "Dodawanie..." : "Dodaj klucz"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {!keys || keys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Brak własnych kluczy API</p>
                <p className="text-sm mt-1">Dodaj własny klucz aby korzystać bez marży</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key, i) => {
                  const providerInfo = PROVIDERS.find(p => p.value === key.provider);
                  return (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Key className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{key.label || providerInfo?.label}</span>
                            <Badge variant="outline" className={`text-xs ${providerInfo?.color}`}>
                              {providerInfo?.label}
                            </Badge>
                            {key.isActive && <Badge variant="outline" className="text-xs bg-green-100 text-green-800">Aktywny</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{key.keyPreview}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteKey.mutate({ id: key.id })}
                        disabled={deleteKey.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supported Providers */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Obsługiwani dostawcy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PROVIDERS.map(p => (
                <div key={p.value} className="p-3 rounded-lg border text-center">
                  <Badge className={`mb-2 ${p.color}`}>{p.label}</Badge>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
