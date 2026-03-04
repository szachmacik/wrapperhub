import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bot, Code2, FileText, ImageIcon, Music, Video, Search, Zap,
  ArrowLeft, ArrowRight, CheckCircle2, Rocket, Copy, ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

// ─── Preset templates ─────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "gpt4-chat",
    name: "GPT-4 Chat",
    desc: "General-purpose AI assistant powered by GPT-4",
    category: "chat" as const,
    provider: "openai",
    modelId: "gpt-4o",
    icon: "💬",
    color: "#7c3aed",
    marginMultiplier: "2.5",
    costPer1kTokens: "0.005",
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    desc: "Write, debug, and explain code in any language",
    category: "code" as const,
    provider: "openai",
    modelId: "gpt-4o",
    icon: "👨‍💻",
    color: "#2563eb",
    marginMultiplier: "2.0",
    costPer1kTokens: "0.005",
  },
  {
    id: "image-gen",
    name: "Image Generator",
    desc: "Create stunning images from text descriptions",
    category: "image" as const,
    provider: "openai",
    modelId: "dall-e-3",
    icon: "🎨",
    color: "#db2777",
    marginMultiplier: "3.0",
    costPerRequest: "0.04",
  },
  {
    id: "doc-analyzer",
    name: "Document Analyzer",
    desc: "Extract insights, summaries, and Q&A from documents",
    category: "document" as const,
    provider: "openai",
    modelId: "gpt-4o",
    icon: "📄",
    color: "#059669",
    marginMultiplier: "2.0",
    costPer1kTokens: "0.005",
  },
  {
    id: "translator",
    name: "AI Translator",
    desc: "Translate text between 100+ languages instantly",
    category: "chat" as const,
    provider: "openai",
    modelId: "gpt-4o-mini",
    icon: "🌍",
    color: "#d97706",
    marginMultiplier: "3.0",
    costPer1kTokens: "0.0002",
  },
  {
    id: "summarizer",
    name: "Content Summarizer",
    desc: "Summarize articles, papers, and long texts",
    category: "document" as const,
    provider: "openai",
    modelId: "gpt-4o-mini",
    icon: "📝",
    color: "#7c3aed",
    marginMultiplier: "2.5",
    costPer1kTokens: "0.0002",
  },
  {
    id: "seo-writer",
    name: "SEO Content Writer",
    desc: "Generate SEO-optimized blog posts and copy",
    category: "chat" as const,
    provider: "openai",
    modelId: "gpt-4o",
    icon: "✍️",
    color: "#0891b2",
    marginMultiplier: "3.0",
    costPer1kTokens: "0.005",
  },
  {
    id: "custom",
    name: "Custom Wrapper",
    desc: "Build your own wrapper from scratch",
    category: "custom" as const,
    provider: "openai",
    modelId: "gpt-4o",
    icon: "⚙️",
    color: "#6b7280",
    marginMultiplier: "2.0",
    costPer1kTokens: "0.005",
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <Bot className="h-4 w-4" />,
  code: <Code2 className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  search: <Search className="h-4 w-4" />,
  custom: <Zap className="h-4 w-4" />,
};

export default function QuickDeploy() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [step, setStep] = useState<"template" | "configure" | "done">("template");
  const [selected, setSelected] = useState<typeof TEMPLATES[0] | null>(null);
  type WrapperCategory = "chat" | "image" | "document" | "code" | "audio" | "video" | "search" | "custom";
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "chat" as WrapperCategory,
    provider: "openai",
    modelId: "gpt-4o",
    icon: "💬",
    color: "#7c3aed",
    marginMultiplier: "2.0",
    costPerRequest: "0",
    costPer1kTokens: "0.005",
    isActive: true,
    isFeatured: false,
  });
  const [deployedSlug, setDeployedSlug] = useState("");

  const upsertMutation = trpc.wrappers.admin.upsert.useMutation({
    onSuccess: () => {
      utils.wrappers.admin.list.invalidate();
      utils.wrappers.list.invalidate();
      setStep("done");
      toast.success("Wrapper deployed successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  if (user && user.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  const selectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelected(t);
    setForm({
      name: t.name,
      slug: t.id,
      description: t.desc,
      category: t.category as WrapperCategory,
      provider: t.provider,
      modelId: t.modelId,
      icon: t.icon,
      color: t.color,
      marginMultiplier: t.marginMultiplier,
      costPerRequest: t.costPerRequest ?? "0",
      costPer1kTokens: t.costPer1kTokens ?? "0.005",
      isActive: true,
      isFeatured: false,
    });
    setStep("configure");
  };

  const handleDeploy = () => {
    upsertMutation.mutate({
      name: form.name,
      slug: form.slug,
      description: form.description,
      category: form.category,
      provider: form.provider,
      modelId: form.modelId,
      icon: form.icon,
      color: form.color,
      marginMultiplier: form.marginMultiplier,
      costPerRequest: form.costPerRequest,
      costPer1kTokens: form.costPer1kTokens,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    });
    setDeployedSlug(form.slug);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => step === "template" ? navigate("/admin") : setStep("template")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-semibold">Quick Deploy</span>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {["template", "configure", "done"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" :
                  (["template", "configure", "done"].indexOf(step) > i) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {(["template", "configure", "done"].indexOf(step) > i) ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </div>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Step 1: Template selection */}
        {step === "template" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Choose a Template</h1>
              <p className="text-muted-foreground mt-1">Pick a pre-configured wrapper or start from scratch.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group"
                  onClick={() => selectTemplate(t)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${t.color}15` }}
                      >
                        {t.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">{t.category}</Badge>
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{t.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium" style={{ color: t.color }}>{t.marginMultiplier}x margin</span>
                      <span>·</span>
                      <span>{t.provider}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === "configure" && selected && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Configure Wrapper</h1>
              <p className="text-muted-foreground mt-1">Customize settings before deploying.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    />
                    <p className="text-xs text-muted-foreground">/dashboard/tool/{form.slug}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Icon (emoji)</Label>
                      <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={form.color}
                          onChange={(e) => setForm({ ...form, color: e.target.value })}
                          className="h-10 w-12 rounded border border-input cursor-pointer"
                        />
                        <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & margin */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing & Margin</CardTitle>
                  <CardDescription>Clients never see these values</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["chat", "code", "image", "document", "audio", "video", "search", "custom"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["openai", "anthropic", "google", "mistral", "custom"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model ID</Label>
                    <Input value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Margin Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        value={form.marginMultiplier}
                        onChange={(e) => setForm({ ...form, marginMultiplier: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">e.g. 2.0 = 100% margin</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cost/1k tokens ($)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={form.costPer1kTokens}
                        onChange={(e) => setForm({ ...form, costPer1kTokens: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label>Active</Label>
                      <p className="text-xs text-muted-foreground">Visible to clients</p>
                    </div>
                    <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured</Label>
                      <p className="text-xs text-muted-foreground">Highlighted in dashboard</p>
                    </div>
                    <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Margin preview */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Margin preview: </span>
                    <span className="text-muted-foreground">
                      If base cost is $0.01 → you charge ${(0.01 * parseFloat(form.marginMultiplier || "1")).toFixed(4)} → margin ${(0.01 * (parseFloat(form.marginMultiplier || "1") - 1)).toFixed(4)} ({((parseFloat(form.marginMultiplier || "1") - 1) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("template")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleDeploy}
                disabled={upsertMutation.isPending || !form.name || !form.slug}
              >
                {upsertMutation.isPending ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⚙️</span> Deploying...</span>
                ) : (
                  <span className="flex items-center gap-2"><Rocket className="h-4 w-4" /> Deploy Wrapper</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Wrapper Deployed!</h1>
              <p className="text-muted-foreground mt-2">
                <strong>{form.name}</strong> is now live and available to your clients.
              </p>
            </div>
            <Card className="w-full max-w-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Client URL</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded">/dashboard/tool/{deployedSlug}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { navigator.clipboard.writeText(`/dashboard/tool/${deployedSlug}`); toast.success("Copied!"); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Margin</span>
                  <Badge variant="secondary">{form.marginMultiplier}x ({((parseFloat(form.marginMultiplier) - 1) * 100).toFixed(0)}%)</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Back to Admin
              </Button>
              <Button onClick={() => navigate(`/dashboard/tool/${deployedSlug}`)}>
                <ExternalLink className="h-4 w-4 mr-2" /> Test Wrapper
              </Button>
              <Button variant="secondary" onClick={() => { setStep("template"); setSelected(null); }}>
                Deploy Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
