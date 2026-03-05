import { useState } from "react";
import { ChevronDown, ArrowLeft, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    category: "Ogólne",
    items: [
      {
        q: "Czym jest WrapperHub?",
        a: "WrapperHub to platforma agregująca narzędzia AI — chat, generowanie obrazów, analiza dokumentów i więcej. Korzystasz z nich bez konfiguracji, bez własnych kluczy API. Wszystko działa od razu po zalogowaniu.",
      },
      {
        q: "Czy muszę mieć własny klucz OpenAI?",
        a: "Nie. WrapperHub zarządza kluczami API za Ciebie. Po prostu wybierz narzędzie i zacznij używać.",
      },
      {
        q: "Jak działa marża?",
        a: "Jako klient nie widzisz kosztów bazowych. Płacisz za pakiet subskrypcyjny i korzystasz z narzędzi w ramach limitu. Marża jest zarządzana przez administratora platformy.",
      },
    ],
  },
  {
    category: "Pakiety i płatności",
    items: [
      {
        q: "Jakie pakiety są dostępne?",
        a: "Oferujemy trzy pakiety: Free (ograniczone użycie), Pro (rozszerzone limity, więcej narzędzi) i Business (bez limitów, priorytetowe wsparcie). Szczegóły na stronie Billing.",
      },
      {
        q: "Czy mogę anulować subskrypcję?",
        a: "Tak, w każdej chwili. Subskrypcja pozostaje aktywna do końca opłaconego okresu.",
      },
      {
        q: "Jakie metody płatności akceptujecie?",
        a: "Akceptujemy karty Visa, Mastercard, American Express oraz inne metody obsługiwane przez Stripe.",
      },
    ],
  },
  {
    category: "Narzędzia AI",
    items: [
      {
        q: "Jakie narzędzia AI są dostępne?",
        a: "Oferujemy: Chat AI (GPT-4), Generator obrazów (DALL-E), Analizę dokumentów (PDF, Word), Asystenta kodu, Transkrypcję audio i więcej. Lista rośnie regularnie.",
      },
      {
        q: "Czy moje rozmowy są prywatne?",
        a: "Tak. Twoje konwersacje są przypisane do Twojego konta i nie są udostępniane innym użytkownikom.",
      },
      {
        q: "Jak szybko działają narzędzia?",
        a: "Chat AI odpowiada w czasie rzeczywistym (streaming). Generowanie obrazów zajmuje 5-20 sekund. Analiza dokumentów zależy od rozmiaru pliku.",
      },
    ],
  },
  {
    category: "Wersja lokalna",
    items: [
      {
        q: "Czy mogę zainstalować WrapperHub lokalnie?",
        a: "Tak! Oferujemy wersję Docker do samodzielnego hostowania. Wystarczy jedna komenda: `docker compose up -d`. Szczegóły w README.md.",
      },
      {
        q: "Jakie są wymagania systemowe dla wersji lokalnej?",
        a: "Docker 20+, Docker Compose 2+, 2GB RAM, 10GB wolnego miejsca. Działa na Linux, macOS i Windows.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{q}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
          <Link href="/"><ArrowLeft size={16} className="mr-2" /> Powrót</Link>
        </Button>

        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-primary/10 rounded-xl">
            <HelpCircle size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">FAQ</h1>
            <p className="text-muted-foreground">Najczęściej zadawane pytania</p>
          </div>
        </div>

        <div className="space-y-8">
          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                {section.category}
              </h2>
              <div className="bg-card rounded-xl border border-border/50 px-6">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-8 bg-muted/30 rounded-xl border border-border/50">
          <p className="text-muted-foreground mb-3">Nie znalazłeś odpowiedzi?</p>
          <p className="font-medium">Napisz do nas: <a href="mailto:support@wrapperhub.io" className="text-primary hover:underline">support@wrapperhub.io</a></p>
        </div>
      </div>
    </div>
  );
}
