import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, ArrowLeft, Zap, Crown, Building2,
  Calculator, TrendingUp, Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const PLAN_ICONS = [Zap, Star, Crown, Building2];

const FEATURE_MATRIX = [
  { label: "AI Chat (GPT-4o)", free: true, pro: true, business: true },
  { label: "Image Generation (DALL-E 3)", free: false, pro: true, business: true },
  { label: "Document Analysis", free: false, pro: true, business: true },
  { label: "Code Assistant", free: true, pro: true, business: true },
  { label: "Conversation History", free: true, pro: true, business: true },
  { label: "API Access", free: false, pro: false, business: true },
  { label: "Priority Support", free: false, pro: true, business: true },
  { label: "Custom Wrappers", free: false, pro: false, business: true },
  { label: "Analytics Dashboard", free: false, pro: true, business: true },
  { label: "Team Members", free: false, pro: false, business: true },
  { label: "SLA Guarantee", free: false, pro: false, business: true },
  { label: "White-label Option", free: false, pro: false, business: true },
];

export default function PricingComparison() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [requestsPerMonth, setRequestsPerMonth] = useState([500]);

  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const { data: myPlan } = trpc.plans.myPlan.useQuery(undefined, { enabled: !!user });

  const activePlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter((p) => p.isActive).sort((a, b) => parseFloat(a.priceMonthly) - parseFloat(b.priceMonthly));
  }, [plans]);

  // ROI Calculator
  const roiData = useMemo(() => {
    const reqs = requestsPerMonth[0];
    return activePlans.map((plan) => {
      const monthlyPrice = parseFloat(plan.priceMonthly);
      const limit = plan.monthlyRequestLimit ?? Infinity;
      const costPerRequest = limit === Infinity ? 0 : monthlyPrice / limit;
      const totalCost = Math.min(reqs, limit) * costPerRequest;
      const savings = reqs > 0 ? ((monthlyPrice / reqs) * 100).toFixed(1) : "0";
      return { plan, monthlyPrice, costPerRequest, totalCost, savings };
    });
  }, [activePlans, requestsPerMonth]);

  const currentPlanId = myPlan?.userPlan?.planId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as unknown as string)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="font-semibold">Plans & Pricing</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Simple Pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose the right plan for you
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All plans include access to our AI tools. Upgrade anytime to unlock more features and higher limits.
          </p>
        </div>

        {/* Plans grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {activePlans.map((plan, idx) => {
              const Icon = PLAN_ICONS[idx] ?? Zap;
              const isPopular = idx === 1;
              const isCurrent = plan.id === currentPlanId;
              const price = parseFloat(plan.priceMonthly);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg shadow-primary/10 scale-105" : ""} ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="outline" className="bg-background text-xs">Current Plan</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isPopular ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description || "Perfect for getting started"}</CardDescription>
                    <div className="mt-3">
                      <span className="text-4xl font-bold">${price === 0 ? "0" : price.toFixed(0)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {plan.monthlyRequestLimit && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.monthlyRequestLimit.toLocaleString()} requests/month
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                      {FEATURE_MATRIX.slice(0, 6).map((f) => {
                        const included = idx === 0 ? f.free : idx === 1 ? f.pro : f.business;
                        return (
                          <div key={f.label} className="flex items-center gap-2 text-sm">
                            {included ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                            )}
                            <span className={included ? "" : "text-muted-foreground/50"}>{f.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-auto pt-4">
                      {isCurrent ? (
                        <Button className="w-full" variant="outline" disabled>
                          Current Plan
                        </Button>
                      ) : price === 0 ? (
                        <Button className="w-full" variant="outline" asChild>
                          <a href={getLoginUrl()}>Get Started Free</a>
                        </Button>
                      ) : (
                        <Button
                          className={`w-full ${isPopular ? "" : ""}`}
                          variant={isPopular ? "default" : "outline"}
                          onClick={() => navigate("/dashboard/billing")}
                        >
                          {user ? "Upgrade Now" : "Get Started"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Feature comparison table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Full Feature Comparison</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium">Feature</th>
                  {activePlans.map((plan) => (
                    <th key={plan.id} className="text-center p-4 font-medium">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((f, i) => (
                  <tr key={f.label} className={`border-b ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="p-4 text-muted-foreground">{f.label}</td>
                    {activePlans.map((plan, idx) => {
                      const included = idx === 0 ? f.free : idx === 1 ? f.pro : f.business;
                      return (
                        <td key={plan.id} className="p-4 text-center">
                          {included ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Calculator */}
        <Card className="mb-12">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>ROI Calculator</CardTitle>
            </div>
            <CardDescription>
              Estimate your cost per request based on your usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Requests per month</label>
                <span className="text-2xl font-bold text-primary">{requestsPerMonth[0].toLocaleString()}</span>
              </div>
              <Slider
                value={requestsPerMonth}
                onValueChange={setRequestsPerMonth}
                min={10}
                max={10000}
                step={10}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>10,000</span>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-3 gap-4">
              {roiData.map(({ plan, monthlyPrice, costPerRequest }) => (
                <div key={plan.id} className="p-4 rounded-lg border bg-muted/20 space-y-2">
                  <div className="font-semibold">{plan.name}</div>
                  <div className="text-2xl font-bold text-primary">
                    ${monthlyPrice === 0 ? "0" : monthlyPrice.toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {costPerRequest > 0
                        ? `$${(costPerRequest * 1000).toFixed(4)}/1k requests`
                        : "Unlimited requests"}
                    </div>
                    {plan.monthlyRequestLimit && requestsPerMonth[0] > plan.monthlyRequestLimit && (
                      <div className="text-orange-500">
                        ⚠ Exceeds {plan.monthlyRequestLimit.toLocaleString()} req limit
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Questions?</h2>
          <p className="text-muted-foreground mb-4">Check our FAQ or contact support</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/faq")}>View FAQ</Button>
            <Button onClick={() => navigate("/dashboard/billing")}>
              {user ? "Manage Billing" : "Get Started"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
