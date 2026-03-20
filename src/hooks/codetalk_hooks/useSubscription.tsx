import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { PortOneClient, generatePaymentId } from "@/integrations/portone/client";
import { SUBSCRIPTION_PLANS, type SubscriptionData } from "@/integrations/portone/types";

// PortOne configuration - these should be set in environment variables
const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || '';
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY || '';

export const useSubscription = () => {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({ subscribed: false });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!session?.access_token) {
      setSubscription({ subscribed: false });
      setLoading(false);
      return;
    }

    try {
      // Supabase 데이터베이스에서 구독 정보 확인 (PortOne 결제 정보 포함)
      const { data: cachedData, error: cacheError } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end, payment_gateway')
        .eq('user_id', session.user?.id);

      const cachedRecord = cachedData?.[0];

      if (!cacheError && cachedRecord) {
        setSubscription({
          subscribed: cachedRecord.subscribed,
          subscription_tier: cachedRecord.subscription_tier,
          subscription_end: cachedRecord.subscription_end,
          payment_gateway: cachedRecord.payment_gateway,
        });
        setLoading(false);
        return;
      }

      // 구독 정보가 없으면 비구독 상태로 설정
      setSubscription({ subscribed: false });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (
    subscriptionType: 'basic' | 'premium' = 'premium',
    billingInterval: 'month' | 'year' = 'month'
  ) => {
    if (!session?.access_token || !session.user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
      toast.error("결제 설정이 완료되지 않았습니다");
      console.error("PortOne credentials not configured");
      return;
    }

    try {
      const planKey = `${subscriptionType}_${billingInterval}ly`;
      const plan = SUBSCRIPTION_PLANS[planKey];

      if (!plan) {
        throw new Error("Invalid subscription plan");
      }

      const portoneClient = new PortOneClient(PORTONE_STORE_ID, PORTONE_CHANNEL_KEY);
      const paymentId = generatePaymentId(session.user.id, planKey);

      const response = await portoneClient.requestPayment({
        paymentId,
        orderName: plan.name,
        totalAmount: plan.amount,
        currency: plan.currency,
        customer: {
          customerId: session.user.id,
          email: session.user.email || '',
          fullName: session.user.email?.split('@')[0],
        },
        redirectUrl: `${window.location.origin}/connect?success=true`,
        noticeUrls: [`${window.location.origin}/api/portone-webhook`],
      });

      // Payment successful - webhook will handle subscription activation
      if (response.code === '0' || response.txId) {
        toast.success("결제가 완료되었습니다");
        await checkSubscription(); // Refresh subscription status
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || "결제 페이지 생성에 실패했습니다");
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error("로그인이 필요합니다");
      return;
    }

    // PortOne doesn't have a built-in customer portal
    // Users can manage subscriptions through admin panel or customer support
    toast.info("구독 관리는 관리자에게 문의해주세요");
  };

  useEffect(() => {
    checkSubscription();
  }, [session?.access_token]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};