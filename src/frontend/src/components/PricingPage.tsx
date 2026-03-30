import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSetUserPlan } from "../hooks/useQueries";

export const PLAN_LIMITS = {
  free: { dailyLimit: 3, maxBatch: 1, batchEnabled: false },
  starter: { dailyLimit: 25, maxBatch: 1, batchEnabled: false },
  pro: { dailyLimit: 100, maxBatch: 5, batchEnabled: true },
  elite: { dailyLimit: 300, maxBatch: 10, batchEnabled: true },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

interface PricingPageProps {
  sessionToken: string | null;
  currentPlan: string;
  onPlanChange: (plan: string) => void;
}

const PLAN_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

const PLANS = [
  {
    key: "free" as PlanKey,
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "/month",
    description: "Get started with AI prompt generation",
    badge: null,
    speed: "Slower response speed",
    features: [
      "3 requests per day",
      "Access to all scene types",
      "Copy & export prompts",
      "Prompt history",
    ],
    missingFeatures: ["Batch generation", "Priority processing"],
  },
  {
    key: "starter" as PlanKey,
    name: "Starter",
    price: 7,
    priceLabel: "$7",
    period: "/month",
    description: "Perfect for regular creators",
    badge: null,
    speed: "Normal response speed",
    features: [
      "25 requests per day",
      "Access to all scene types",
      "Copy & export prompts",
      "Prompt history",
    ],
    missingFeatures: ["Batch generation"],
  },
  {
    key: "pro" as PlanKey,
    name: "Pro",
    price: 17,
    priceLabel: "$17",
    period: "/month",
    description: "For professional content creators",
    badge: "Most Popular",
    speed: "Faster response speed",
    features: [
      "100 requests per day",
      "Batch generation (up to 5 prompts)",
      "Access to all scene types",
      "Copy & export prompts",
      "Prompt history",
      "Priority processing",
    ],
    missingFeatures: [],
  },
  {
    key: "elite" as PlanKey,
    name: "Elite",
    price: 37,
    priceLabel: "$37",
    period: "/month",
    description: "Maximum power for teams and studios",
    badge: null,
    speed: "Priority response speed",
    features: [
      "300 requests per day",
      "Batch generation (up to 10 prompts)",
      "Access to all scene types",
      "Copy & export prompts",
      "Prompt history",
      "Priority processing",
      "Highest daily limit",
    ],
    missingFeatures: [],
  },
];

export default function PricingPage({
  sessionToken,
  currentPlan,
  onPlanChange,
}: PricingPageProps) {
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const setUserPlan = useSetUserPlan(sessionToken);

  const handlePlanChange = async (planKey: string, planName: string) => {
    if (planKey === currentPlan) return;
    setPendingPlan(planKey);
    try {
      await setUserPlan.mutateAsync(planKey);
      onPlanChange(planKey);
      toast.success(`Plan updated to ${planName}!`);
    } catch {
      toast.error("Failed to update plan. Please try again.");
    } finally {
      setPendingPlan(null);
    }
  };

  const currentOrder = PLAN_ORDER[currentPlan] ?? 0;

  return (
    <div data-ocid="pricing.page">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground">
            Choose Your Plan
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Scale your creative workflow with the right plan for you
        </p>
      </div>

      {/* Plan grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const isPro = plan.key === "pro";
          const planOrder = PLAN_ORDER[plan.key] ?? 0;
          const isUpgrade = planOrder > currentOrder;
          const isPending = pendingPlan === plan.key && setUserPlan.isPending;
          const anyPending = setUserPlan.isPending;

          return (
            <div
              key={plan.key}
              data-ocid={`pricing.${plan.key}.card`}
              className={`relative flex flex-col rounded-2xl border transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/15"
                  : isPro
                    ? "border-primary/50 bg-card shadow-lg shadow-primary/10"
                    : "border-border/60 bg-card"
              }`}
            >
              {/* Most Popular badge */}
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md shadow-primary/30">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Plan name + current badge */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {plan.key === "elite" && (
                      <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <h2
                      className={`text-lg font-extrabold tracking-tight ${
                        isCurrent ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {plan.name}
                    </h2>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/40 ml-2 flex-shrink-0">
                      Current Plan
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-3 mb-2">
                  <span className="text-4xl font-black text-foreground tabular-nums">
                    {plan.priceLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-1">
                  {plan.description}
                </p>

                {/* Speed badge */}
                <div className="inline-flex items-center gap-1 mb-5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      plan.key === "elite"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : plan.key === "pro"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : plan.key === "starter"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-muted/60 text-muted-foreground border-border/40"
                    }`}
                  >
                    {plan.speed}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-border/40 mb-5" />

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                  {plan.missingFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm opacity-40"
                    >
                      <div className="w-4 h-4 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-px bg-muted-foreground rounded-full" />
                      </div>
                      <span className="text-muted-foreground line-through">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrent ? (
                  <div
                    data-ocid={`pricing.${plan.key}.current_plan`}
                    className="w-full h-10 flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary text-sm font-semibold"
                  >
                    ✓ Current Plan
                  </div>
                ) : (
                  <Button
                    data-ocid={`pricing.${plan.key}.button`}
                    onClick={() => handlePlanChange(plan.key, plan.name)}
                    disabled={anyPending}
                    variant={isUpgrade ? "default" : "outline"}
                    className={`w-full font-semibold transition-all ${
                      isUpgrade
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </span>
                    ) : isUpgrade ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Upgrade to {plan.name}
                      </span>
                    ) : (
                      `Downgrade to ${plan.name}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stripe preparation note */}
      <div className="mt-8 p-4 rounded-xl border border-border/40 bg-muted/10 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] text-amber-400 font-bold">!</span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">
            Payment coming soon.
          </span>{" "}
          Paid plans are currently free during our beta. Stripe payment
          integration will be enabled soon — plan upgrades are instant.
        </p>
      </div>
    </div>
  );
}
