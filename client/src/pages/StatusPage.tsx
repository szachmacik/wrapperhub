import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Clock, ArrowLeft, Activity } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ServiceStatus = "operational" | "degraded" | "outage";

interface Service {
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: string;
  latency?: string;
}

const SERVICES: Service[] = [
  { name: "API Gateway",          description: "Główny punkt wejścia API",       status: "operational", uptime: "99.98%", latency: "45ms" },
  { name: "Chat AI (GPT-4)",      description: "Wrapper OpenAI Chat",            status: "operational", uptime: "99.95%", latency: "320ms" },
  { name: "Generator obrazów",    description: "Wrapper DALL-E 3",               status: "operational", uptime: "99.90%", latency: "8.2s" },
  { name: "Analiza dokumentów",   description: "Przetwarzanie PDF/Word",         status: "operational", uptime: "99.97%", latency: "1.2s" },
  { name: "Asystent kodu",        description: "Wrapper GPT-4 Turbo (kod)",      status: "operational", uptime: "99.95%", latency: "280ms" },
  { name: "Baza danych",          description: "MySQL / TiDB",                   status: "operational", uptime: "99.99%", latency: "12ms" },
  { name: "Autentykacja",         description: "OAuth / JWT",                    status: "operational", uptime: "100%",   latency: "28ms" },
  { name: "Płatności (Stripe)",   description: "Checkout i webhooks",            status: "operational", uptime: "99.99%", latency: "180ms" },
  { name: "Storage (S3)",         description: "Przechowywanie plików",          status: "operational", uptime: "99.99%", latency: "55ms" },
];

const INCIDENTS = [
  {
    date: "2026-03-04",
    title: "Zwiększone opóźnienia Chat AI",
    description: "Przez 12 minut obserwowaliśmy zwiększone opóźnienia w odpowiedziach Chat AI z powodu przeciążenia upstream OpenAI. Problem rozwiązany.",
    status: "resolved" as const,
    duration: "12 min",
  },
];

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === "operational") return <CheckCircle2 size={18} className="text-green-500" />;
  if (status === "degraded")    return <AlertCircle size={18} className="text-yellow-500" />;
  return <AlertCircle size={18} className="text-red-500" />;
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const map = {
    operational: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    degraded:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    outage:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  const labels = { operational: "Sprawny", degraded: "Degradacja", outage: "Awaria" };
  return <Badge className={`text-xs ${map[status]}`}>{labels[status]}</Badge>;
}

function UptimeBar() {
  // Symulacja 90 dni uptime
  const days = Array.from({ length: 90 }, (_, i) => {
    const rand = Math.random();
    if (rand > 0.98) return "degraded";
    if (rand > 0.999) return "outage";
    return "operational";
  });

  return (
    <div className="flex gap-0.5 items-end h-8">
      {days.map((status, i) => (
        <div
          key={i}
          title={`Dzień ${90 - i} temu`}
          className={`flex-1 rounded-sm transition-all hover:opacity-80 ${
            status === "operational" ? "bg-green-500 h-full" :
            status === "degraded"    ? "bg-yellow-500 h-3/4" :
                                       "bg-red-500 h-1/2"
          }`}
        />
      ))}
    </div>
  );
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const allOperational = SERVICES.every((s) => s.status === "operational");

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> Powrót</Link>
        </Button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className={`p-3 rounded-xl ${allOperational ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
            <Activity size={24} className={allOperational ? "text-green-600" : "text-yellow-600"} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Status systemu</h1>
            <p className={`font-medium ${allOperational ? "text-green-600" : "text-yellow-600"}`}>
              {allOperational ? "Wszystkie systemy sprawne" : "Niektóre systemy mają problemy"}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> Aktualizacja co 30s
            </div>
            <div className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString("pl-PL")}
            </div>
          </div>
        </div>

        {/* Uptime bar */}
        <div className="bg-card rounded-xl border border-border/50 p-6 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>90 dni temu</span>
            <span>Dziś</span>
          </div>
          <UptimeBar />
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> Sprawny</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" /> Degradacja</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Awaria</span>
          </div>
        </div>

        {/* Services */}
        <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50 mb-8">
          {SERVICES.map((service) => (
            <div key={service.name} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={service.status} />
                <div>
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                {service.latency && (
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    <div className="font-medium text-foreground">{service.latency}</div>
                    <div>latency</div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground hidden sm:block">
                  <div className="font-medium text-foreground">{service.uptime}</div>
                  <div>uptime</div>
                </div>
                <StatusBadge status={service.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Historia incydentów</h2>
          {INCIDENTS.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Brak incydentów w ostatnich 90 dniach.
            </div>
          ) : (
            <div className="space-y-4">
              {INCIDENTS.map((incident, i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-muted-foreground">{incident.date}</span>
                      <h3 className="font-medium">{incident.title}</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      Rozwiązany
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <div className="text-xs text-muted-foreground mt-2">Czas trwania: {incident.duration}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
