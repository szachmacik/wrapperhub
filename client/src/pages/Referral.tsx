import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Gift, Copy, Share2, Users, TrendingUp, Star,
  ArrowLeft, CheckCircle, Zap, Crown
} from "lucide-react";

export default function Referral() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? `WH-${user.id.toString(36).toUpperCase().padStart(6, "0")}` : "WH-XXXXXX";
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const { data: stats } = trpc.plans.myUsage.useQuery();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link skopiowany do schowka!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "WrapperHub — Twój AI Toolkit",
        text: "Sprawdź WrapperHub — wszystkie narzędzia AI w jednym miejscu!",
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  const tiers = [
    { refs: 1, reward: "1 miesiąc Pro gratis", icon: Star, color: "text-yellow-500" },
    { refs: 5, reward: "3 miesiące Pro gratis", icon: TrendingUp, color: "text-blue-500" },
    { refs: 10, reward: "1 rok Business gratis", icon: Crown, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Program Poleceń</h1>
            <p className="text-sm text-muted-foreground">Zaproś znajomych i zdobywaj nagrody</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Zaproś i zarabiaj</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Za każdego znajomego który dołączy przez Twój link i wykupi plan, otrzymujesz nagrody.
          </p>
        </motion.div>

        {/* Referral Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Twój unikalny link
              </CardTitle>
              <CardDescription>
                Udostępnij ten link znajomym — każde kliknięcie jest śledzone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                <span className="flex-1 text-foreground">{referralLink}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCopy} className="flex-1" variant={copied ? "outline" : "default"}>
                  {copied ? (
                    <><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Skopiowano!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Kopiuj link</>
                  )}
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" /> Udostępnij
                </Button>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="font-mono text-base px-4 py-1">
                  Kod: {referralCode}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Zaproszeni", value: "0", icon: Users },
            { label: "Aktywni", value: "0", icon: Zap },
            { label: "Zarobione miesiące", value: "0", icon: Gift },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6 text-center">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Reward Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">Progi nagród</h3>
          <div className="space-y-3">
            {tiers.map((tier, i) => (
              <Card key={i} className="border-l-4 border-l-primary/30 hover:border-l-primary transition-colors">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <tier.icon className={`h-5 w-5 ${tier.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{tier.refs} {tier.refs === 1 ? "polecenie" : "polecenia/ń"}</div>
                      <div className="text-sm text-muted-foreground">{tier.reward}</div>
                    </div>
                  </div>
                  <Badge variant="outline">0 / {tier.refs}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Jak to działa?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Udostępnij link", desc: "Wyślij swój unikalny link znajomym przez email, social media lub messenger." },
                  { step: "2", title: "Znajomy dołącza", desc: "Gdy znajomy zarejestruje się przez Twój link i wykupi dowolny plan." },
                  { step: "3", title: "Odbierz nagrodę", desc: "Automatycznie otrzymujesz przedłużenie planu lub upgrade konta." },
                ].map((item) => (
                  <div key={item.step} className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto">
                      {item.step}
                    </div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
