import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bot,
  Code2,
  FileText,
  Image,
  Sparkles,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <Bot className="h-6 w-6" />,
  image: <Image className="h-6 w-6" />,
  document: <FileText className="h-6 w-6" />,
  code: <Code2 className="h-6 w-6" />,
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: wrappers } = trpc.wrappers.list.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();

  const featuredWrappers = wrappers?.filter((w) => w.isFeatured) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">WrapperHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#tools" className="hover:text-foreground transition-colors">Tools</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")}>
                Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button asChild>
                  <a href={getLoginUrl()}>Get Started Free</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1.5">
          <Zap className="h-3 w-3 mr-1" />
          All AI tools in one place
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
          Your AI Toolkit,<br />Ready to Use
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Access the best AI tools — chat, image generation, document analysis, and more — all in one seamless platform. No API keys, no setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-base px-8" asChild>
            <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
              Start for Free <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <a href="#tools">Explore Tools</a>
          </Button>
        </div>
        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: "4+", label: "AI Tools" },
            { value: "3", label: "Plans" },
            { value: "∞", label: "Possibilities" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful AI Tools</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to supercharge your workflow with AI.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredWrappers.length > 0 ? featuredWrappers.map((wrapper) => (
            <Card key={wrapper.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50" onClick={() => navigate(isAuthenticated ? `/dashboard/tool/${wrapper.slug}` : getLoginUrl())}>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${wrapper.color}20`, color: wrapper.color ?? undefined }}>
                  {CATEGORY_ICONS[wrapper.category] ?? <Bot className="h-6 w-6" />}
                </div>
                <CardTitle className="text-lg">{wrapper.name}</CardTitle>
                <CardDescription>{wrapper.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs capitalize">{wrapper.category}</Badge>
              </CardContent>
            </Card>
          )) : (
            // Skeleton placeholders
            [
              { name: "AI Chat", desc: "Conversational AI powered by GPT-4o", cat: "chat", color: "#6366f1" },
              { name: "Image Generator", desc: "Create stunning images from text", cat: "image", color: "#ec4899" },
              { name: "Document Analyzer", desc: "Extract insights from your documents", cat: "document", color: "#10b981" },
              { name: "Code Assistant", desc: "Write and review code with AI", cat: "code", color: "#f59e0b" },
            ].map((t) => (
              <Card key={t.name} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                    {CATEGORY_ICONS[t.cat]}
                  </div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription>{t.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs capitalize">{t.cat}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why WrapperHub?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built for speed, simplicity, and scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="h-6 w-6" />, title: "Instant Access", desc: "No API keys, no configuration. Sign in and start using AI tools immediately." },
              { icon: <Shield className="h-6 w-6" />, title: "Secure & Private", desc: "Your data stays yours. We never store your conversations beyond your session." },
              { icon: <Globe className="h-6 w-6" />, title: "Self-Hostable", desc: "Run WrapperHub on your own server with a single Docker command." },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {(plans && plans.length > 0 ? plans : [
            { id: 1, name: "Free", priceMonthly: "0", description: "Get started with basic AI tools", monthlyRequestLimit: 50, slug: "free" },
            { id: 2, name: "Pro", priceMonthly: "29", description: "For power users and professionals", monthlyRequestLimit: 1000, slug: "pro" },
            { id: 3, name: "Business", priceMonthly: "99", description: "Unlimited access for teams", monthlyRequestLimit: null, slug: "business" },
          ]).map((plan, i) => (
            <Card key={plan.id} className={`relative ${i === 1 ? "border-primary shadow-lg scale-105" : ""}`}>
              {i === 1 && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.priceMonthly}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{plan.monthlyRequestLimit ? `${plan.monthlyRequestLimit} requests/month` : "Unlimited requests"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>All {plan.slug === "free" ? "basic" : "AI"} tools included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Priority support</span>
                </div>
                <Button className="w-full mt-4" variant={i === 1 ? "default" : "outline"} asChild>
                  <a href={isAuthenticated ? "/dashboard/billing" : getLoginUrl()}>
                    {plan.priceMonthly === "0" ? "Get Started Free" : `Get ${plan.name}`}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">WrapperHub</span>
          </div>
          <p>© {new Date().getFullYear()} WrapperHub. All AI tools in one place.</p>
        </div>
      </footer>
    </div>
  );
}
