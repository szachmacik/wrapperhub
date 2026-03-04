import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Zap, Check, ArrowRight, MessageSquare, ImageIcon, FileText, Code2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to WrapperHub",
    subtitle: "Your AI toolkit, ready to use. No API keys, no setup.",
    icon: <Sparkles className="h-10 w-10" />,
  },
  {
    id: "tools",
    title: "Explore AI Tools",
    subtitle: "Access powerful AI capabilities with a single click.",
    icon: <Bot className="h-10 w-10" />,
  },
  {
    id: "plan",
    title: "Choose Your Plan",
    subtitle: "Start free, upgrade when you need more.",
    icon: <Zap className="h-10 w-10" />,
  },
];

const TOOLS = [
  { icon: <MessageSquare className="h-5 w-5" />, name: "AI Chat", desc: "Conversational AI for any task", color: "#7c3aed" },
  { icon: <Code2 className="h-5 w-5" />, name: "Code Assistant", desc: "Write, debug, and explain code", color: "#2563eb" },
  { icon: <ImageIcon className="h-5 w-5" />, name: "Image Generator", desc: "Create stunning visuals from text", color: "#db2777" },
  { icon: <FileText className="h-5 w-5" />, name: "Document Analyzer", desc: "Extract insights from documents", color: "#059669" },
];

export default function Onboarding() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  const { data: plans } = trpc.plans.list.useQuery();

  const handleFinish = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/60" : "w-2 bg-muted"}`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                {STEPS[0]!.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋</h1>
                <p className="text-muted-foreground">{STEPS[0]!.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  "No API keys required",
                  "4+ AI tools ready",
                  "Instant access",
                  "Pay as you grow",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" size="lg" onClick={() => setStep(1)}>
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Tools */}
        {step === 1 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary mb-4">
                  {STEPS[1]!.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{STEPS[1]!.title}</h2>
                <p className="text-muted-foreground text-sm">{STEPS[1]!.subtitle}</p>
              </div>
              <div className="space-y-3">
                {TOOLS.map((tool) => (
                  <div key={tool.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
                      {tool.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.desc}</div>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs">Free</Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full" size="lg" onClick={() => setStep(2)}>
                See Plans <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Plans */}
        {step === 2 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary mb-4">
                  {STEPS[2]!.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{STEPS[2]!.title}</h2>
                <p className="text-muted-foreground text-sm">{STEPS[2]!.subtitle}</p>
              </div>
              <div className="space-y-3">
                {plans?.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-xl border transition-colors ${plan.name === "Pro" ? "border-primary bg-primary/5" : "border-border/60"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">{plan.name}</div>
                      <div className="text-sm font-bold">
                        {parseFloat(plan.priceMonthly) === 0 ? "Free" : `$${plan.priceMonthly}/mo`}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{plan.description}</div>
                    {plan.name === "Pro" && <Badge className="mt-2 text-xs">Recommended</Badge>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleFinish}>
                  Start Free
                </Button>
                <Button className="flex-1" onClick={() => navigate("/billing")}>
                  Upgrade <Zap className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip link */}
        {step < 2 && (
          <button
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleFinish}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
