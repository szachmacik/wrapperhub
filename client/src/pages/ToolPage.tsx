import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Bot, Send, ImageIcon, FileText, Code2, Loader2,
  Download, Upload, Sparkles, MessageSquare, RefreshCw, History, X,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string; timestamp: string; streaming?: boolean };

// ─── Streaming fetch helper ────────────────────────────────────────────────────
async function streamChat(
  payload: { wrapperSlug: string; messages: Array<{ role: string; content: string }>; conversationId?: number },
  onDelta: (delta: string) => void,
  onDone: (conversationId?: number) => void,
  onError: (err: string) => void
) {
  const res = await fetch("/api/stream/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "Unknown error");
    onError(text);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      try {
        const parsed = JSON.parse(data) as { delta?: string; done?: boolean; error?: string; conversationId?: number };
        if (parsed.error) { onError(parsed.error); return; }
        if (parsed.delta) onDelta(parsed.delta);
        if (parsed.done) { onDone(parsed.conversationId); return; }
      } catch { /* skip */ }
    }
  }
  onDone(undefined);
}

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Image state
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [imageQuality, setImageQuality] = useState<"standard" | "hd">("standard");

  // Document state
  const [docContent, setDocContent] = useState("");
  const [docQuestion, setDocQuestion] = useState("");
  const [docAnswer, setDocAnswer] = useState("");
  const [docFileName, setDocFileName] = useState("");

  // Conversation history
  const { data: allConversations, refetch: refetchConversations } = trpc.wrappers.conversations.list.useQuery(
    undefined,
    { enabled: !!(wrapper?.category === "chat" || wrapper?.category === "code") }
  );
  // Filter conversations for current wrapper
  const conversations = allConversations?.filter((c) => c.conv.wrapperId === wrapper?.id).map((c) => c.conv) ?? [];

  const imageMutation = trpc.wrappers.generateImage.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl ?? null);
      setRevisedPrompt(data.revisedPrompt ?? null);
    },
    onError: (err) => toast.error(err.message),
  });

  const docMutation = trpc.wrappers.analyzeDocument.useMutation({
    onSuccess: (data) => { setDocAnswer(data.answer); },
    onError: (err) => toast.error(err.message),
  });

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSendChat = useCallback(async () => {
    if (!input.trim() || !wrapper || isStreaming) return;

    const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add streaming placeholder
    const streamingMsg: Message = { role: "assistant", content: "", timestamp: new Date().toISOString(), streaming: true };
    setMessages((prev) => [...prev, streamingMsg]);

    await streamChat(
      {
        wrapperSlug: slug,
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        conversationId,
      },
      (delta) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, content: last.content + delta };
          }
          return updated;
        });
      },
      (newConvId) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
        if (newConvId) setConversationId(newConvId);
        setIsStreaming(false);
        refetchConversations();
      },
      (err) => {
        toast.error(err || "AI request failed");
        setMessages((prev) => prev.filter((m) => !m.streaming));
        setIsStreaming(false);
      }
    );
  }, [input, wrapper, isStreaming, messages, conversationId, slug, refetchConversations]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDocContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const loadConversation = (conv: { id: number; messages: unknown; title: string | null; wrapperId: number; userId: number; createdAt: Date; updatedAt: Date }) => {
    const msgs = conv.messages as Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
    setMessages(msgs);
    setConversationId(conv.id);
    setShowHistory(false);
  };

  const getCategoryIcon = (cat?: string | null) => {
    switch (cat) {
      case "chat": return <MessageSquare className="h-4 w-4" />;
      case "image": return <ImageIcon className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "code": return <Code2 className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
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
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          {wrapper ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${wrapper.color || "#7c3aed"}20`, color: wrapper.color || "#7c3aed" }}
              >
                {getCategoryIcon(wrapper.category)}
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm truncate">{wrapper.name}</h1>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{wrapper.description}</p>
              </div>
              {wrapper.category === "chat" || wrapper.category === "code" ? (
                <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                  {isStreaming ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Thinking...</> : "Ready"}
                </Badge>
              ) : null}
            </div>
          ) : <Skeleton className="h-8 w-48" />}

          {(wrapper?.category === "chat" || wrapper?.category === "code") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="shrink-0 hidden sm:flex"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 max-w-5xl mx-auto w-full">
        {/* Conversation history sidebar */}
        {showHistory && (wrapper?.category === "chat" || wrapper?.category === "code") && (
          <aside className="w-64 border-r flex flex-col bg-muted/20 shrink-0">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-sm font-medium">History</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <button
                  className="w-full text-left text-sm p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  onClick={() => { setMessages([]); setConversationId(undefined); setShowHistory(false); }}
                >
                  + New conversation
                </button>
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`w-full text-left text-sm p-2 rounded-lg hover:bg-muted transition-colors truncate ${conv.id === conversationId ? "bg-muted font-medium" : ""}`}
                    onClick={() => loadConversation(conv)}
                  >
                    {conv.title || "Untitled"}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 px-4 py-6 min-w-0">
          {!wrapper ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : wrapper.category === "chat" || wrapper.category === "code" ? (
            // ─── Chat Interface ──────────────────────────────────────────────
            <div className="flex flex-col h-[calc(100vh-8rem)]">
              <ScrollArea className="flex-1" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${wrapper.color || "#7c3aed"}15`, color: wrapper.color || "#7c3aed" }}
                    >
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">{wrapper.name}</h2>
                    <p className="text-muted-foreground max-w-sm text-sm">{wrapper.description}</p>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
                      {(wrapper.category === "code"
                        ? ["Write a Python function to sort a list", "Explain this code snippet", "Debug my JavaScript", "Create a REST API endpoint"]
                        : ["Summarize the key points of...", "Help me write an email to...", "Explain the concept of...", "What are the best practices for..."]
                      ).map((suggestion) => (
                        <button
                          key={suggestion}
                          className="text-left text-sm p-3 rounded-xl border border-border/60 hover:bg-muted/50 hover:border-primary/30 transition-all"
                          onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4 pr-2">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1"
                            style={{ backgroundColor: `${wrapper.color || "#7c3aed"}15`, color: wrapper.color || "#7c3aed" }}
                          >
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 text-sm" : "text-sm"}`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {msg.streaming && !msg.content ? (
                                <div className="flex gap-1 py-2">
                                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              ) : (
                                <Streamdown>{msg.content}</Streamdown>
                              )}
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input area */}
              <div className="border-t pt-4 mt-2">
                <div className="relative flex gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    placeholder={`Message ${wrapper.name}... (Enter to send, Shift+Enter for new line)`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
                    }}
                    className="resize-none min-h-[52px] max-h-40 pr-12"
                    rows={1}
                    disabled={isStreaming}
                  />
                  <Button
                    onClick={handleSendChat}
                    disabled={!input.trim() || isStreaming}
                    size="icon"
                    className="h-[52px] w-[52px] shrink-0"
                  >
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground"
                    onClick={() => { setMessages([]); setConversationId(undefined); }}
                    disabled={isStreaming}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> New conversation
                  </Button>
                )}
              </div>
            </div>

          ) : wrapper.category === "image" ? (
            // ─── Image Generator ─────────────────────────────────────────────
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Describe your image</label>
                    <Textarea
                      placeholder="A serene mountain landscape at sunset with golden light reflecting on a calm lake, photorealistic..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Size</label>
                      <div className="flex flex-wrap gap-2">
                        {(["1024x1024", "1792x1024", "1024x1792"] as const).map((s) => (
                          <Button
                            key={s}
                            variant={imageSize === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setImageSize(s)}
                            className="text-xs"
                          >
                            {s === "1024x1024" ? "Square" : s === "1792x1024" ? "Landscape" : "Portrait"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quality</label>
                      <div className="flex gap-2">
                        {(["standard", "hd"] as const).map((q) => (
                          <Button
                            key={q}
                            variant={imageQuality === q ? "default" : "outline"}
                            size="sm"
                            onClick={() => setImageQuality(q)}
                            className="text-xs capitalize"
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (!imagePrompt.trim()) return;
                      setGeneratedImage(null);
                      setRevisedPrompt(null);
                      imageMutation.mutate({ wrapperSlug: slug, prompt: imagePrompt, size: imageSize, quality: imageQuality });
                    }}
                    disabled={!imagePrompt.trim() || imageMutation.isPending}
                    className="w-full"
                  >
                    {imageMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating... (10-20s)</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Generate Image</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {imageMutation.isPending && (
                <div className="aspect-square w-full max-w-lg mx-auto rounded-2xl bg-muted animate-pulse flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Creating your image...</p>
                  </div>
                </div>
              )}

              {generatedImage && (
                <div className="space-y-3">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-2xl shadow-lg border"
                  />
                  {revisedPrompt && (
                    <p className="text-xs text-muted-foreground italic px-1">
                      <strong>Revised prompt:</strong> {revisedPrompt}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = generatedImage;
                      a.download = "wrapperhub-image.png";
                      a.target = "_blank";
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download Image
                  </Button>
                </div>
              )}
            </div>

          ) : wrapper.category === "document" ? (
            // ─── Document Analyzer ───────────────────────────────────────────
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload Document</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {docFileName ? docFileName : "Click to upload .txt, .md, .csv, .json"}
                      </span>
                      <input type="file" className="hidden" accept=".txt,.md,.csv,.json,.xml,.html" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Or paste text directly</label>
                    <Textarea
                      placeholder="Paste document content here..."
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      className="resize-none font-mono text-xs"
                      rows={6}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your question</label>
                    <Textarea
                      placeholder="What is the main topic? Summarize the key points. Extract all dates mentioned..."
                      value={docQuestion}
                      onChange={(e) => setDocQuestion(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!docContent.trim() || !docQuestion.trim()) return;
                      docMutation.mutate({ wrapperSlug: slug, content: docContent, question: docQuestion });
                    }}
                    disabled={!docContent.trim() || !docQuestion.trim() || docMutation.isPending}
                    className="w-full"
                  >
                    {docMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                    ) : (
                      <><FileText className="h-4 w-4 mr-2" />Analyze Document</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {docAnswer && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" /> Analysis Result
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{docAnswer}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>This tool type is not yet supported in the UI.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
