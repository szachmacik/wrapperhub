import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, Moon, Sun, Monitor, Bell, Download,
  Shield, User, ArrowLeft, Trash2, LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<"light" | "dark" | "system">("system");
  const [, navigate] = useLocation();

  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => toast.success("Ustawienia zapisane"),
    onError: () => toast.error("Błąd zapisu ustawień"),
  });

  const [emailNotif, setEmailNotif] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailNotif(settings.emailNotifications);
      setMarketingEmails(settings.marketingEmails);
    }
  }, [settings]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setLocalTheme(newTheme);
    // Toggle to match desired theme
    if (newTheme === "dark" && theme === "light") toggleTheme?.();
    if (newTheme === "light" && theme === "dark") toggleTheme?.();
    updateSettings.mutate({ theme: newTheme });
  };

  const { data: usage } = trpc.plans.myUsage.useQuery();

  const handleExportJSON = () => {
    toast.info("Przygotowuję eksport JSON...");
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email, createdAt: user?.createdAt, role: user?.role },
      settings,
      usageHistory: usage ?? [],
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wrapperhub-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dane wyeksportowane jako JSON");
  };

  const handleExportCSV = () => {
    if (!usage || usage.length === 0) { toast.error("Brak historii do eksportu"); return; }
    const headers = ["Data", "Narzędzie", "Typ", "Tokeny wejściowe", "Tokeny wyjściowe", "Status", "Czas (ms)"];
    const rows = usage.map(u => [
      new Date(u.createdAt).toLocaleString("pl-PL"),
      u.wrapperName ?? "",
      u.requestType ?? "",
      String(u.inputTokens ?? 0),
      String(u.outputTokens ?? 0),
      u.status ?? "",
      String(u.durationMs ?? 0),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wrapperhub-usage-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Wyeksportowano ${usage.length} rekordów CSV`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Zaloguj się, aby zobaczyć ustawienia.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
          <Link href="/dashboard"><ArrowLeft size={16} className="mr-2" /> Dashboard</Link>
        </Button>

        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-primary/10 rounded-xl">
            <SettingsIcon size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ustawienia konta</h1>
            <p className="text-muted-foreground text-sm">Zarządzaj swoim kontem i preferencjami</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User size={16} /> Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <div className="font-medium">{user.name ?? "Użytkownik"}</div>
                  <div className="text-sm text-muted-foreground">{user.email ?? "Brak emaila"}</div>
                </div>
                <Badge variant="outline" className="ml-auto capitalize">{user.role}</Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/profile">Edytuj profil</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Motyw */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun size={16} /> Wygląd
              </CardTitle>
              <CardDescription>Wybierz motyw kolorystyczny aplikacji</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Jasny", icon: <Sun size={18} /> },
                  { value: "dark",  label: "Ciemny", icon: <Moon size={18} /> },
                  { value: "system", label: "System", icon: <Monitor size={18} /> },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleThemeChange(opt.value as "light" | "dark" | "system")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      (localTheme === opt.value || (localTheme === "system" && opt.value === "system"))
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Powiadomienia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell size={16} /> Powiadomienia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notif" className="font-medium">Powiadomienia email</Label>
                      <p className="text-xs text-muted-foreground">Alerty o użyciu, limity, faktury</p>
                    </div>
                    <Switch
                      id="email-notif"
                      checked={emailNotif}
                      onCheckedChange={(v) => {
                        setEmailNotif(v);
                        updateSettings.mutate({ emailNotifications: v });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing" className="font-medium">Emaile marketingowe</Label>
                      <p className="text-xs text-muted-foreground">Nowości, promocje, aktualizacje</p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={marketingEmails}
                      onCheckedChange={(v) => {
                        setMarketingEmails(v);
                        updateSettings.mutate({ marketingEmails: v });
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Prywatność i dane */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield size={16} /> Prywatność i dane
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Eksport danych</div>
                  <div className="text-xs text-muted-foreground">Pobierz kopię swoich danych (JSON + historia użycia)</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportJSON}>
                    <Download size={14} className="mr-2" /> JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download size={14} className="mr-2" /> CSV
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Historia konwersacji</div>
                  <div className="text-xs text-muted-foreground">Zarządzaj zapisanymi rozmowami</div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/profile">Przejdź</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Konto */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <Trash2 size={16} /> Konto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => { logout(); navigate("/"); }}
              >
                <LogOut size={14} className="mr-2" /> Wyloguj się
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => toast.error("Aby usunąć konto, skontaktuj się z support@wrapperhub.io")}
              >
                <Trash2 size={14} className="mr-2" /> Usuń konto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
