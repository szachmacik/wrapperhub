import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Webhook, Zap, Globe, Code2, Link2, CheckCircle, Copy, ExternalLink } from "lucide-react";

const integrations = [
  {
    category: "AI Providers",
    items: [
      { name: "OpenAI", desc: "GPT-4, DALL-E, Whisper — przez BYOK lub platformowy klucz", status: "available", icon: "🤖", docs: "#" },
      { name: "Anthropic Claude", desc: "Claude 3.5 Sonnet i Haiku — przez BYOK", status: "byok", icon: "🧠", docs: "#" },
      { name: "Google Gemini", desc: "Gemini Pro i Flash — przez BYOK", status: "byok", icon: "✨", docs: "#" },
      { name: "Mistral AI", desc: "Mistral Large i Mixtral — przez BYOK", status: "byok", icon: "🌪️", docs: "#" },
    ],
  },
  {
    category: "Automatyzacja",
    items: [
      { name: "Webhooks", desc: "Wyślij HTTP POST do dowolnego URL przy każdym evencie", status: "available", icon: "🔗", docs: "#" },
      { name: "Zapier", desc: "Połącz WrapperHub z 6000+ aplikacjami przez Zapier", status: "coming", icon: "⚡", docs: "#" },
      { name: "Make (Integromat)", desc: "Automatyzacje wizualne z Make.com", status: "coming", icon: "🔄", docs: "#" },
      { name: "n8n", desc: "Self-hosted automatyzacja z n8n", status: "coming", icon: "🔧", docs: "#" },
    ],
  },
  {
    category: "Embed & API",
    items: [
      { name: "Embed Widget", desc: "Osadź wrapper na dowolnej stronie jako chatbot", status: "available", icon: "📦", docs: "/dashboard/embed" },
      { name: "REST API", desc: "Bezpośredni dostęp do wrapperów przez klucz API", status: "available", icon: "🌐", docs: "#" },
      { name: "JavaScript SDK", desc: "npm install wrapperhub-sdk — integracja w 5 minut", status: "coming", icon: "📦", docs: "#" },
      { name: "Python SDK", desc: "pip install wrapperhub — dla skryptów i automatyzacji", status: "coming", icon: "🐍", docs: "#" },
    ],
  },
  {
    category: "Płatności",
    items: [
      { name: "Stripe", desc: "Subskrypcje, jednorazowe płatności, webhooks", status: "available", icon: "💳", docs: "#" },
      { name: "PayU", desc: "Polskie płatności — BLIK, przelewy, karty", status: "coming", icon: "🏦", docs: "#" },
      { name: "Przelewy24", desc: "Popularna polska bramka płatnicza", status: "coming", icon: "💰", docs: "#" },
    ],
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: "Dostępne", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  byok: { label: "BYOK", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  coming: { label: "Wkrótce", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

export default function Integrations() {
  const [, navigate] = useLocation();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

  const apiKey = "wh_live_" + Math.random().toString(36).slice(2, 18);

  const handleSaveWebhook = () => {
    if (!webhookUrl.startsWith("https://")) {
      toast.error("URL musi zaczynać się od https://");
      return;
    }
    setWebhookSaved(true);
    toast.success("Webhook zapisany! Testowy event wysłany.");
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("Klucz API skopiowany!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Integracje
            </h1>
            <p className="text-sm text-muted-foreground">Połącz WrapperHub z Twoim ekosystemem</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* REST API Key */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Twój klucz API
              </CardTitle>
              <CardDescription>Używaj tego klucza do bezpośrednich wywołań REST API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm bg-background"
                  type="password"
                />
                <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 font-mono">
                <div className="text-green-600 dark:text-green-400 mb-1"># Przykład użycia</div>
                <div>curl -X POST https://api.wrapperhub.app/v1/chat \</div>
                <div className="pl-4">-H "Authorization: Bearer {apiKey.slice(0, 20)}..." \</div>
                <div className="pl-4">-d '{"{"}"wrapperId": "chatgpt", "message": "Hello"{"}"}' </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Webhook */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-orange-500" />
                Webhook URL
              </CardTitle>
              <CardDescription>
                Otrzymuj HTTP POST przy każdym evencie: nowy użytkownik, płatność, request AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://twoja-strona.pl/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveWebhook} disabled={webhookSaved}>
                  {webhookSaved ? <><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Zapisano</> : "Zapisz"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Eventy: <code className="bg-muted px-1 rounded">user.created</code>{" "}
                <code className="bg-muted px-1 rounded">payment.success</code>{" "}
                <code className="bg-muted px-1 rounded">ai.request</code>{" "}
                <code className="bg-muted px-1 rounded">wrapper.deployed</code>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Integration categories */}
        {integrations.map((category, ci) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + ci * 0.05 }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              {category.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.items.map((item, i) => {
                const statusInfo = statusConfig[item.status];
                return (
                  <Card
                    key={i}
                    className={`transition-all ${item.status === "coming" ? "opacity-60" : "hover:border-primary/30 hover:shadow-sm cursor-pointer"}`}
                  >
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="text-2xl w-10 text-center">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{item.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                      {item.status !== "coming" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => item.docs !== "#" && navigate(item.docs)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
