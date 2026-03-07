import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Code2, FileText, ImageIcon, Sparkles, Zap, Shield, Globe, ArrowRight,
  CheckCircle2, TrendingUp, Star, Users, Activity, Clock, Rocket, Lock,
  Twitter, Github, MessageSquare, Heart,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <Bot className="h-6 w-6" />,
  image: <ImageIcon className="h-6 w-6" />,
  document: <FileText className="h-6 w-6" />,
  code: <Code2 className="h-6 w-6" />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const TESTIMONIALS = [
  { name: "Alex K.", role: "Indie Hacker", text: "WrapperHub saved me weeks of API integration work. I launched my AI product in a day.", avatar: "AK" },
  { name: "Maria S.", role: "Product Manager", text: "The margin system is genius. I resell AI tools to clients without them knowing the underlying cost.", avatar: "MS" },
  { name: "Tom W.", role: "Developer", text: "Self-hosting with Docker was a breeze. One command and everything worked perfectly.", avatar: "TW" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: wrappers } = trpc.wrappers.list.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();

  const featuredWrappers = wrappers?.filter((w) => w.isFeatured) ?? [];
  // Trending = first 3 wrappers sorted by id desc (most recently added = trending)
  const trendingWrappers = (wrappers ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
            <a href="#trending" className="hover:text-foreground transition-colors">Trending</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#tools" className="hover:text-foreground transition-colors">Tools</a>
            <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
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
      <section className="container mx-auto px-4 py-24 text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Zap className="h-3 w-3 mr-1.5" />
            All AI tools in one place — no API keys needed
          </Badge>
        </motion.div>
        <motion.h1
          initial="hidden" animate="visible" custom={1} variants={fadeUp}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent"
        >
          Your AI Toolkit,<br />Ready to Use
        </motion.h1>
        <motion.p
          initial="hidden" animate="visible" custom={2} variants={fadeUp}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Access the best AI tools — chat, image generation, document analysis, and more — all in one seamless platform. No API keys, no setup.
        </motion.p>
        <motion.div
          initial="hidden" animate="visible" custom={3} variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" className="text-base px-8" asChild>
            <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
              Start for Free <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <a href="#tools">Explore Tools</a>
          </Button>
        </motion.div>

        {/* Live stats */}
        <motion.div
          initial="hidden" animate="visible" custom={4} variants={fadeUp}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
        >
          {[
            { icon: <Bot className="h-4 w-4" />, value: `${(wrappers?.length ?? 4)}+`, label: "AI Tools" },
            { icon: <Users className="h-4 w-4" />, value: "1,200+", label: "Users" },
            { icon: <Activity className="h-4 w-4" />, value: "50K+", label: "Requests/month" },
            { icon: <Star className="h-4 w-4" />, value: "4.9", label: "Avg Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center justify-center gap-1.5 text-primary mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Trending Tools */}
      {trendingWrappers.length > 0 && (
        <section id="trending" className="bg-muted/20 py-16 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Trending Right Now</h2>
              <Badge variant="secondary" className="ml-2 text-xs">Live</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingWrappers.map((wrapper, i) => (
                <motion.div
                  key={wrapper.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-border/60 relative overflow-hidden"
                    onClick={() => navigate(isAuthenticated ? `/dashboard/tool/${wrapper.slug}` : getLoginUrl())}
                  >
                    {i === 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge className="text-xs bg-orange-500 text-white border-0">🔥 Hot</Badge>
                      </div>
                    )}
                    <CardContent className="p-5 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${wrapper.color ?? "#6366f1"}20`, color: wrapper.color ?? "#6366f1" }}
                      >
                        {CATEGORY_ICONS[wrapper.category] ?? <Bot className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{wrapper.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{wrapper.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-xs capitalize">{wrapper.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Instant
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tools Grid */}
      <section id="tools" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful AI Tools</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to supercharge your workflow with AI.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(featuredWrappers.length > 0 ? featuredWrappers : [
            { id: 1, name: "AI Chat", description: "Conversational AI powered by GPT-4o", category: "chat", color: "#6366f1", slug: "chat", isFeatured: true, isActive: true, marginMultiplier: "2", systemPrompt: null, createdAt: new Date(), updatedAt: new Date() },
            { id: 2, name: "Image Generator", description: "Create stunning images from text", category: "image", color: "#ec4899", slug: "image", isFeatured: true, isActive: true, marginMultiplier: "2", systemPrompt: null, createdAt: new Date(), updatedAt: new Date() },
            { id: 3, name: "Document Analyzer", description: "Extract insights from your documents", category: "document", color: "#10b981", slug: "document", isFeatured: true, isActive: true, marginMultiplier: "2", systemPrompt: null, createdAt: new Date(), updatedAt: new Date() },
            { id: 4, name: "Code Assistant", description: "Write and review code with AI", category: "code", color: "#f59e0b", slug: "code", isFeatured: true, isActive: true, marginMultiplier: "2", systemPrompt: null, createdAt: new Date(), updatedAt: new Date() },
          ]).map((wrapper, i) => (
            <motion.div
              key={wrapper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-border/50 h-full"
                onClick={() => navigate(isAuthenticated ? `/dashboard/tool/${wrapper.slug}` : getLoginUrl())}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${wrapper.color}20`, color: wrapper.color ?? undefined }}>
                    {CATEGORY_ICONS[wrapper.category] ?? <Bot className="h-6 w-6" />}
                  </div>
                  <CardTitle className="text-lg">{wrapper.name}</CardTitle>
                  <CardDescription>{wrapper.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs capitalize">{wrapper.category}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <a href="/marketplace">View All Tools in Marketplace <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/30 py-20 border-y border-border/50">
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
              { icon: <Rocket className="h-6 w-6" />, title: "Quick Deploy", desc: "Admins can add new AI tools in minutes with the Quick Deploy wizard." },
              { icon: <Lock className="h-6 w-6" />, title: "Margin Control", desc: "Set custom margins per tool. Clients pay your price, not the API cost." },
              { icon: <Activity className="h-6 w-6" />, title: "Usage Analytics", desc: "Track every request, revenue, and margin in real-time from the admin panel." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-background/60 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Loved by builders</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Join hundreds of developers and businesses using WrapperHub.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/20 py-20 border-y border-border/50">
        <div className="container mx-auto px-4">
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
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative h-full ${i === 1 ? "border-primary shadow-lg scale-105" : ""}`}>
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
                    {[
                      plan.monthlyRequestLimit ? `${plan.monthlyRequestLimit} requests/month` : "Unlimited requests",
                      "All AI tools included",
                      "Usage analytics",
                      i > 0 ? "Priority support" : "Community support",
                      i > 1 ? "Custom integrations" : null,
                    ].filter(Boolean).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    <Button className="w-full mt-4" variant={i === 1 ? "default" : "outline"} asChild>
                      <a href={isAuthenticated ? "/dashboard/billing" : getLoginUrl()}>
                        {plan.priceMonthly === "0" ? "Get Started Free" : `Get ${plan.name}`}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="link" asChild>
              <a href="/pricing">Compare all plan features →</a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-12 text-center"
        >
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Join thousands of users who are already using WrapperHub to power their AI workflows.
          </p>
          <Button size="lg" className="px-10" asChild>
            <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
              Start for Free <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">WrapperHub</span>
              </div>
              <p className="text-sm text-muted-foreground">All AI tools in one place. No API keys, no setup.</p>
              <div className="flex items-center gap-3 mt-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4" /></a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer"><Github className="h-4 w-4" /></a>
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#tools" className="hover:text-foreground transition-colors">AI Tools</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</a></li>
                <li><a href="/pricing" className="hover:text-foreground transition-colors">Compare Plans</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="/changelog" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="/status" className="hover:text-foreground transition-colors">System Status</a></li>
                <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Sign In</a></li>
                <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Get Started Free</a></li>
                <li><a href="/dashboard/billing" className="hover:text-foreground transition-colors">Upgrade Plan</a></li>
                <li><a href="/contact" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <Separator className="mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} WrapperHub. All rights reserved.</p>
            <div className="flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 mx-1 fill-red-500" /> for builders
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
