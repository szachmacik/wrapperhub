import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, MessageSquare, Zap, CheckCircle2,
  Github, Twitter,
} from "lucide-react";

const TOPICS = [
  { value: "general", label: "General inquiry" },
  { value: "billing", label: "Billing & plans" },
  { value: "technical", label: "Technical support" },
  { value: "partnership", label: "Partnership" },
  { value: "enterprise", label: "Enterprise" },
  { value: "bug", label: "Bug report" },
];

const FAQS = [
  { q: "How quickly can I deploy a new wrapper?", a: "Under 60 seconds using the Quick Deploy wizard. Pick a template, set your margin, activate — done." },
  { q: "Can I self-host WrapperHub?", a: "Yes. Run `docker compose up -d` and you're live. Full instructions in the README." },
  { q: "How does the margin system work?", a: "You set a multiplier per wrapper (e.g. 2x). Clients pay the multiplied price; you pocket the difference." },
  { q: "What AI providers are supported?", a: "OpenAI, Anthropic, Mistral, and any OpenAI-compatible endpoint. More coming soon." },
];

export default function Contact() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState("general");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In production this would POST to a backend endpoint
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Home
          </Button>
          <span className="font-semibold">Contact Us</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Get in touch</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Have a question, found a bug, or want to explore enterprise options?
            We typically respond within 24 hours.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Send a message
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="font-semibold text-lg mb-2">Message sent!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      We'll get back to you within 24 hours.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First name</Label>
                        <Input id="firstName" name="firstName" placeholder="Jan" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last name</Label>
                        <Input id="lastName" name="lastName" placeholder="Kowalski" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="jan@firma.pl" required />
                    </div>
                    <div>
                      <Label>Topic</Label>
                      <Select value={topic} onValueChange={setTopic}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOPICS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Describe your question or issue..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Zap className="h-4 w-4 mr-2" /> Send message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right column: channels + FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium">GitHub Issues</div>
                    <div className="text-xs text-muted-foreground">Bug reports & feature requests</div>
                  </div>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium">Twitter / X</div>
                    <div className="text-xs text-muted-foreground">Quick questions & updates</div>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-xs text-muted-foreground">hello@wrapperhub.io</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick FAQ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {FAQS.map((faq) => (
                  <div key={faq.q}>
                    <p className="text-sm font-medium mb-1">{faq.q}</p>
                    <p className="text-xs text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/faq")}>
                  View all FAQs
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
