import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Zap, Shield, Star } from "lucide-react";

const WHATS_NEW_VERSION = "v2.1.0";
const STORAGE_KEY = "wrapperhub_whats_new_seen";

const updates = [
  {
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    title: "Streaming AI Chat",
    desc: "Odpowiedzi AI pojawiają się w czasie rzeczywistym — szybciej i płynniej niż kiedykolwiek.",
    badge: "Nowe",
    badgeColor: "bg-purple-500",
  },
  {
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    title: "Quick Deploy Wizard",
    desc: "Wdróż nowy wrapper w 30 sekund — 8 gotowych szablonów z podglądem marży.",
    badge: "Ulepszono",
    badgeColor: "bg-yellow-500",
  },
  {
    icon: Shield,
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900/30",
    title: "BYOK — Własne klucze API",
    desc: "Podepnij własny klucz OpenAI i korzystaj z własnego limitu bez dodatkowych kosztów.",
    badge: "Nowe",
    badgeColor: "bg-green-500",
  },
  {
    icon: Star,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Embed Widget",
    desc: "Osadź dowolny wrapper na swojej stronie jedną linią kodu — bez logowania dla odwiedzających.",
    badge: "Nowe",
    badgeColor: "bg-blue-500",
  },
];

export function WhatsNew() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== WHATS_NEW_VERSION) {
      // Pokaż po 1.5s od załadowania
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary/10 to-purple-500/10 p-6 pb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-7 w-7"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Co nowego?</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">{WHATS_NEW_VERSION}</Badge>
                      <span className="text-xs text-muted-foreground">Marzec 2026</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Updates list */}
              <div className="p-4 space-y-3">
                {updates.map((update, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg ${update.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <update.icon className={`h-4 w-4 ${update.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{update.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${update.badgeColor}`}>
                          {update.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{update.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 pb-4">
                <Button onClick={handleClose} className="w-full">
                  Rozumiem, zaczynamy! 🚀
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
