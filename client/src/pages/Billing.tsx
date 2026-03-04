import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Crown, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Billing() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: myPlan } = trpc.plans.myPlan.useQuery();

  const currentPlanSlug = myPlan?.plan?.slug ?? "free";

  const handleUpgrade = (planSlug: string) => {
    if (planSlug === "free") return;
    toast.info("Stripe integration coming soon! Contact admin to upgrade your plan.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <h1 className="font-semibold">Plans & Billing</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Current plan */}
        {myPlan && (
          <Card className="mb-10 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">Current Plan: {myPlan.plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {myPlan.plan.monthlyRequestLimit
                    ? `${myPlan.plan.monthlyRequestLimit} requests/month`
                    : "Unlimited requests"}
                  {myPlan.userPlan.currentPeriodEnd && ` · Renews ${new Date(myPlan.userPlan.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              </div>
              <Badge className="ml-auto" variant="secondary">{myPlan.userPlan.status}</Badge>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
          <p className="text-muted-foreground">Upgrade anytime to unlock more AI power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(plans ?? []).map((plan, i) => {
            const isCurrent = plan.slug === currentPlanSlug;
            const isPopular = plan.slug === "pro";
            return (
              <Card key={plan.id} className={`relative ${isPopular ? "border-primary shadow-lg" : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}>
                {isPopular && !isCurrent && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                {isCurrent && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">Current Plan</Badge>}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.slug === "business" && <Zap className="h-4 w-4 text-primary" />}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.priceMonthly}</span>
                    <span className="text-muted-foreground">/month</span>
                    {plan.priceYearly && parseFloat(plan.priceYearly) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">or ${plan.priceYearly}/year (save {Math.round((1 - parseFloat(plan.priceYearly) / (parseFloat(plan.priceMonthly) * 12)) * 100)}%)</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{plan.monthlyRequestLimit ? `${plan.monthlyRequestLimit} requests/month` : "Unlimited requests"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{plan.monthlyTokenLimit ? `${(plan.monthlyTokenLimit / 1000000).toFixed(1)}M tokens/month` : "Unlimited tokens"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>All {plan.slug === "free" ? "basic" : "premium"} AI tools</span>
                  </div>
                  {plan.slug !== "free" && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                  )}
                  <Button
                    className="w-full mt-4"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan.slug)}
                  >
                    {isCurrent ? "Current Plan" : plan.slug === "free" ? "Downgrade" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Need a custom plan? <a href="mailto:admin@wrapperhub.com" className="text-primary hover:underline">Contact us</a>
        </p>
      </main>
    </div>
  );
}
