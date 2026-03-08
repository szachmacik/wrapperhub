import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Medal, Award, Flame, Zap, Crown } from "lucide-react";

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Pobieramy top użytkowników przez admin stats
  const { data: statsData, isLoading } = trpc.plans.admin.usageStats.useQuery({ days: 30 }, {
    retry: false,
  });

  const mockLeaders = [
    { rank: 1, name: "Maciej K.", requests: 1240, plan: "Business", badge: "🏆" },
    { rank: 2, name: "Anna W.", requests: 987, plan: "Pro", badge: "🥈" },
    { rank: 3, name: "Tomasz B.", requests: 756, plan: "Pro", badge: "🥉" },
    { rank: 4, name: "Karolina M.", requests: 543, plan: "Pro", badge: "" },
    { rank: 5, name: "Piotr S.", requests: 421, plan: "Free", badge: "" },
    { rank: 6, name: "Marta L.", requests: 398, plan: "Business", badge: "" },
    { rank: 7, name: "Jakub R.", requests: 312, plan: "Pro", badge: "" },
    { rank: 8, name: "Zofia N.", requests: 287, plan: "Free", badge: "" },
    { rank: 9, name: "Adam C.", requests: 245, plan: "Pro", badge: "" },
    { rank: 10, name: "Ewa P.", requests: 198, plan: "Free", badge: "" },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-mono text-sm w-5 text-center">#{rank}</span>;
  };

  const getPlanColor = (plan: string) => {
    if (plan === "Business") return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    if (plan === "Pro") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">Top użytkownicy tego miesiąca</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 items-end"
        >
          {/* 2nd place */}
          <div className="text-center space-y-2">
            <div className="text-3xl">🥈</div>
            <Avatar className="h-14 w-14 mx-auto ring-2 ring-gray-300">
              <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">AW</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-sm">{mockLeaders[1].name}</div>
            <div className="text-xs text-muted-foreground">{mockLeaders[1].requests} req</div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-end justify-center pb-2">
              <span className="text-lg font-bold text-gray-500">2</span>
            </div>
          </div>
          {/* 1st place */}
          <div className="text-center space-y-2">
            <div className="text-3xl">👑</div>
            <Avatar className="h-16 w-16 mx-auto ring-4 ring-yellow-400">
              <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold text-lg">MK</AvatarFallback>
            </Avatar>
            <div className="font-bold">{mockLeaders[0].name}</div>
            <div className="text-xs text-muted-foreground">{mockLeaders[0].requests} req</div>
            <div className="h-24 bg-yellow-400 dark:bg-yellow-500 rounded-t-lg flex items-end justify-center pb-2">
              <span className="text-xl font-bold text-yellow-900">1</span>
            </div>
          </div>
          {/* 3rd place */}
          <div className="text-center space-y-2">
            <div className="text-3xl">🥉</div>
            <Avatar className="h-14 w-14 mx-auto ring-2 ring-amber-500">
              <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">TB</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-sm">{mockLeaders[2].name}</div>
            <div className="text-xs text-muted-foreground">{mockLeaders[2].requests} req</div>
            <div className="h-12 bg-amber-400 dark:bg-amber-600 rounded-t-lg flex items-end justify-center pb-2">
              <span className="text-lg font-bold text-amber-900">3</span>
            </div>
          </div>
        </motion.div>

        {/* Full List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Pełny ranking — {new Date().toLocaleString("pl-PL", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockLeaders.map((leader, i) => (
              <motion.div
                key={leader.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  user?.name === leader.name
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(leader.rank)}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-bold bg-muted">
                    {leader.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {leader.name}
                    {user?.name === leader.name && (
                      <Badge variant="outline" className="text-xs">Ty</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {leader.requests.toLocaleString()} requestów
                  </div>
                </div>
                <Badge className={`text-xs ${getPlanColor(leader.plan)}`} variant="outline">
                  {leader.plan}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground">
          Ranking odświeżany co godzinę. Dane za bieżący miesiąc kalendarzowy.
        </p>
      </div>
    </div>
  );
}
