import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "1개 페르소나 분석",
      "기본 Ikigai 설계",
      "기본 브랜드 전략",
      "커뮤니티 매칭",
    ],
  },
  pro: {
    name: "Pro",
    price: 9900,
    priceId: "price_pro_monthly", // Replace with actual Stripe price ID
    features: [
      "최대 3개 페르소나 분석",
      "페르소나별 Ikigai 설계",
      "통합 브랜딩 전략",
      "페르소나 관계 분석",
      "성장 추적 대시보드",
      "우선 매칭",
    ],
  },
  elite: {
    name: "Elite",
    price: 29000,
    priceId: "price_elite_monthly", // Replace with actual Stripe price ID
    features: [
      "Pro의 모든 기능",
      "최대 5개 페르소나 분석",
      "AI 컨설팅 우선 지원",
      "개인 성장 코칭",
      "비공개 커뮤니티 접근",
      "월간 1:1 세션",
    ],
  },
};

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createCheckoutSession = useMutation({
    mutationFn: async ({ tier }: { tier: "pro" | "elite" }) => {
      const priceId = SUBSCRIPTION_TIERS[tier].priceId;

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: { priceId, tier },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!subscription?.stripe_subscription_id) {
        throw new Error("No active subscription");
      }

      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId: subscription.stripe_subscription_id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const hasFeature = (feature: string): boolean => {
    if (!subscription || subscription.status !== "active") {
      return SUBSCRIPTION_TIERS.free.features.includes(feature);
    }

    const tier = subscription.tier as keyof typeof SUBSCRIPTION_TIERS;
    return SUBSCRIPTION_TIERS[tier]?.features.includes(feature) || false;
  };

  const hasAccessToMultiplePersonas = (): boolean => {
    if (!subscription || subscription.status !== "active") {
      return false;
    }

    return subscription.tier === "pro" || subscription.tier === "elite";
  };

  const canAccessPersona = (personaCount: number): boolean => {
    if (!subscription || subscription.status !== "active") {
      return personaCount <= 1;
    }

    if (subscription.tier === "pro") {
      return personaCount <= 3;
    }

    if (subscription.tier === "elite") {
      return personaCount <= 5;
    }

    return false;
  };

  return {
    subscription,
    isLoading,
    createCheckoutSession: createCheckoutSession.mutate,
    isCreatingSession: createCheckoutSession.isPending,
    cancelSubscription: cancelSubscription.mutate,
    isCanceling: cancelSubscription.isPending,
    hasFeature,
    hasAccessToMultiplePersonas,
    canAccessPersona,
  };
}
