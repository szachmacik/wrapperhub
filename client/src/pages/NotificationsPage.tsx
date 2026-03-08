import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, ArrowLeft, Check, CheckCheck, Megaphone, Info, Zap, AlertTriangle, Star } from "lucide-react";
import { motion } from "framer-motion";

const TYPE_CONFIG = {
  info: { icon: <Info className="h-4 w-4 text-blue-500" />, label: "Info", color: "bg-blue-100 text-blue-800" },
  success: { icon: <Check className="h-4 w-4 text-green-500" />, label: "Sukces", color: "bg-green-100 text-green-800" },
  warning: { icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />, label: "Uwaga", color: "bg-yellow-100 text-yellow-800" },
  new_tool: { icon: <Star className="h-4 w-4 text-purple-500" />, label: "Nowe narzędzie", color: "bg-purple-100 text-purple-800" },
};

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"info" | "success" | "warning" | "new_tool">("info");

  const { data: notifications, refetch } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("Wszystkie oznaczone jako przeczytane"); refetch(); }
  });
  const broadcast = trpc.notifications.broadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Powiadomienie wysłane do ${data.count} użytkowników`);
      setShowBroadcastDialog(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!isAuthenticated) { navigate("/"); return null; }

  const unread = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                Powiadomienia
                {unread > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs">{unread}</Badge>
                )}
              </h1>
              <p className="text-muted-foreground text-sm">Historia powiadomień i alertów</p>
            </div>
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Oznacz wszystkie
              </Button>
            )}
            {user?.role === "admin" && (
              <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Megaphone className="h-4 w-4 mr-2" />
                    Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Wyślij powiadomienie do wszystkich</DialogTitle>
                    <DialogDescription>Powiadomienie zostanie wysłane do wszystkich zarejestrowanych użytkowników.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Typ powiadomienia</Label>
                      <Select value={broadcastType} onValueChange={v => setBroadcastType(v as typeof broadcastType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">{cfg.icon} {cfg.label}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tytuł</Label>
                      <Input placeholder="np. Nowe narzędzie dostępne!" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Wiadomość</Label>
                      <Textarea
                        placeholder="Treść powiadomienia..."
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>Anuluj</Button>
                    <Button
                      onClick={() => broadcast.mutate({ title: broadcastTitle, message: broadcastMessage, type: broadcastType })}
                      disabled={!broadcastTitle || !broadcastMessage || broadcast.isPending}
                    >
                      {broadcast.isPending ? "Wysyłanie..." : "Wyślij do wszystkich"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {!notifications || notifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Brak powiadomień</p>
                <p className="text-sm mt-1">Tutaj pojawią się nowe narzędzia i alerty</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-start gap-4 p-4 transition-colors ${!n.isRead ? "bg-primary/3" : ""} hover:bg-accent/5 cursor-pointer`}
                      onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                    >
                      <div className="mt-0.5 p-2 rounded-full bg-muted shrink-0">{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium text-sm ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </span>
                          <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString("pl-PL")}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
