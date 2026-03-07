import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Zap, Shield, Globe, Users, Code2, BarChart3,
  ArrowLeft, Github, Twitter, Linkedin, Star,
} from "lucide-react";

const TEAM = [
  { name: "WrapperHub Team", role: "Platform Engineers", avatar: "WH", bio: "Building the fastest way to deploy AI tools at scale." },
];

const VALUES = [
  { icon: <Zap className="h-5 w-5" />, title: "Speed First", desc: "Deploy a new AI wrapper in under 60 seconds. No boilerplate, no config hell." },
  { icon: <Shield className="h-5 w-5" />, title: "Secure by Default", desc: "API keys encrypted at rest, rate limiting built-in, audit logs for every request." },
  { icon: <Globe className="h-5 w-5" />, title: "Any AI, Anywhere", desc: "OpenAI, Anthropic, Mistral, local models — wrap anything with a unified interface." },
  { icon: <Users className="h-5 w-5" />, title: "Client-Ready", desc: "Multi-tenant from day one. Manage clients, plans and margins from one panel." },
  { icon: <Code2 className="h-5 w-5" />, title: "Self-Hostable", desc: "One Docker command. Your data stays yours — no vendor lock-in." },
  { icon: <BarChart3 className="h-5 w-5" />, title: "Margin Transparency", desc: "See real-time cost vs. revenue per wrapper. Know your profit on every request." },
];

const STATS = [
  { value: "< 60s", label: "Deploy time" },
  { value: "10+", label: "AI providers" },
  { value: "3", label: "Pricing plans" },
  { value: "100%", label: "Self-hostable" },
];

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Home
          </Button>
          <span className="font-semibold">About WrapperHub</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <Badge className="mb-4">Our Mission</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-purple-400 bg-clip-text text-transparent">
            The fastest way to ship AI products
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            WrapperHub was built for builders who want to move fast. We aggregate the best AI tools,
            wrap them in a clean interface, and let you deploy to clients with a margin — in minutes, not months.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate("/dashboard")}>Get Started</Button>
            <Button variant="outline" onClick={() => navigate("/tools")}>Browse Tools</Button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">What we stand for</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Six principles that guide every decision we make.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {v.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Our story</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-4">
            <p>
              WrapperHub started with a simple frustration: every time a new AI model dropped, it took weeks to
              integrate it into a product, configure billing, set up rate limiting, and build a client-facing UI.
            </p>
            <p>
              We built WrapperHub to solve that. One platform where you can take any AI API, wrap it in a
              polished interface, set your margin, and hand it to a client — all in under an hour.
            </p>
            <p>
              Whether you're running a solo AI consultancy or scaling a SaaS product, WrapperHub gives you
              the infrastructure layer so you can focus on the product layer.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-muted-foreground mb-8">
            Join builders who are shipping AI products faster with WrapperHub.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/dashboard")}>Start for free</Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")}>Talk to us</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2025 WrapperHub. All rights reserved.</span>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Github className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
