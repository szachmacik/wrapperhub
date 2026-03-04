import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Bot, Send, Image, FileText, Code2, Loader2,
  Download, Upload, Sparkles, MessageSquare, RefreshCw,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string; timestamp: string };

export default function ToolPage() {
  useAuth({ redirectOnUnauthenticated: true });
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params.slug;

  const { data: wrappers } = trpc.wrappers.listForUser.useQuery();
  const wrapper = wrappers?.find((w) => w.slug === slug);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Image state
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");

  // Document state
  const [docContent, setDocContent] = useState("");
  const [docQuestion, setDocQuestion] = useState("");
  const [docAnswer, setDocAnswer] = useState("");

  const chatMutation = trpc.wrappers.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.message, timestamp: new Date().toISOString() }]);
      setConversationId(data.conversationId as number | undefined);
    },
    onError: (err) => toast.error(err.message),
  });

  const imageMutation = trpc.wrappers.generateImage.useMutation({
    onSuccess: (data) => { setGeneratedImage(data.imageUrl ?? null); },
    onError: (err) => toast.error(err.message),
  });

  const docMutation = trpc.wrappers.analyzeDocument.useMutation({
    onSuccess: (data) => { setDocAnswer(data.answer); },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendChat = () => {
    if (!input.trim() || !wrapper) return;
    const userMsg: Message = { role: "user", content: input, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({
      wrapperSlug: slug,
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      conversationId,
    });
  };

  const handleGenerateImage = () => {
    if (!imagePrompt.trim() || !wrapper) return;
    setGeneratedImage(null);
    imageMutation.mutate({ wrapperSlug: slug, prompt: imagePrompt, size: imageSize });
  };

  const handleAnalyzeDoc = () => {
    if (!docContent.trim() || !docQuestion.trim() || !wrapper) return;
    docMutation.mutate({ wrapperSlug: slug, content: docContent, question: docQuestion });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setDocContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  if (!wrapper && wrappers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-semibold mb-2">Tool not found</h2>
          <p className="text-muted-foreground mb-4">This tool is not available on your plan.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {wrapper ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${wrapper.color}20`, color: wrapper.color ?? undefined }}>
                {wrapper.category === "chat" ? <MessageSquare className="h-4 w-4" /> :
                  wrapper.category === "image" ? <Image className="h-4 w-4" /> :
                    wrapper.category === "document" ? <FileText className="h-4 w-4" /> :
                      <Code2 className="h-4 w-4" />}
              </div>
              <div>
                <h1 className="font-semibold text-sm">{wrapper.name}</h1>
                <p className="text-xs text-muted-foreground">{wrapper.description}</p>
              </div>
            </div>
          ) : <Skeleton className="h-8 w-48" />}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {!wrapper ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : wrapper.category === "chat" || wrapper.category === "code" ? (
          // ─── Chat Interface ────────────────────────────────────────────────
          <div className="flex flex-col h-[calc(100vh-8rem)]">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4" style={{ color: wrapper.color ?? undefined }}>
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{wrapper.name}</h2>
                  <p className="text-muted-foreground max-w-sm">{wrapper.description}</p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                    {(wrapper.category === "code"
                      ? ["Write a Python function to sort a list", "Explain this code snippet", "Debug my JavaScript", "Create a REST API endpoint"]
                      : ["Summarize the key points of...", "Help me write an email to...", "Explain the concept of...", "What are the best practices for..."]
                    ).map((suggestion) => (
                      <button
                        key={suggestion}
                        className="text-left text-sm p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
                        onClick={() => setInput(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1" style={{ color: wrapper.color ?? undefined }}>
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: wrapper.color ?? undefined }} />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            <div className="border-t pt-4 mt-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Message ${wrapper.name}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  className="resize-none min-h-[52px] max-h-32"
                  rows={1}
                />
                <Button onClick={handleSendChat} disabled={!input.trim() || chatMutation.isPending} size="icon" className="h-[52px] w-[52px] flex-shrink-0">
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground" onClick={() => { setMessages([]); setConversationId(undefined); }}>
                  <RefreshCw className="h-3 w-3 mr-1" /> New conversation
                </Button>
              )}
            </div>
          </div>
        ) : wrapper.category === "image" ? (
          // ─── Image Generator ───────────────────────────────────────────────
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Describe your image</label>
                  <Textarea
                    placeholder="A serene mountain landscape at sunset with golden light reflecting on a calm lake..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Size</label>
                  <div className="flex gap-2">
                    {(["1024x1024", "1792x1024", "1024x1792"] as const).map((s) => (
                      <Button key={s} variant={imageSize === s ? "default" : "outline"} size="sm" onClick={() => setImageSize(s)}>
                        {s === "1024x1024" ? "Square" : s === "1792x1024" ? "Landscape" : "Portrait"}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleGenerateImage} disabled={!imagePrompt.trim() || imageMutation.isPending} className="w-full">
                  {imageMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Image</>}
                </Button>
              </CardContent>
            </Card>

            {imageMutation.isPending && (
              <div className="aspect-square max-w-lg mx-auto rounded-xl bg-muted animate-pulse flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Creating your image...</p>
                </div>
              </div>
            )}

            {generatedImage && (
              <Card className="overflow-hidden max-w-lg mx-auto">
                <img src={generatedImage} alt="Generated" className="w-full" />
                <CardContent className="p-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={generatedImage} download="generated-image.png" target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" /> Download
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setGeneratedImage(null); setImagePrompt(""); }}>
                    <RefreshCw className="h-4 w-4 mr-2" /> New
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : wrapper.category === "document" ? (
          // ─── Document Analyzer ─────────────────────────────────────────────
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Upload or paste document content</label>
                  <div className="flex gap-2 mb-3">
                    <label className="cursor-pointer">
                      <input type="file" accept=".txt,.md,.csv" className="hidden" onChange={handleFileUpload} />
                      <Button variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-2" /> Upload File</span>
                      </Button>
                    </label>
                    {docContent && <Badge variant="secondary" className="text-xs">{docContent.length} chars loaded</Badge>}
                  </div>
                  <Textarea
                    placeholder="Paste your document content here, or upload a file above..."
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="resize-none font-mono text-xs"
                    rows={8}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your question</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="What is the main topic of this document?"
                      value={docQuestion}
                      onChange={(e) => setDocQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAnalyzeDoc(); }}
                    />
                    <Button onClick={handleAnalyzeDoc} disabled={!docContent.trim() || !docQuestion.trim() || docMutation.isPending}>
                      {docMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {docAnswer && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">Analysis Result</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">{docAnswer}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
