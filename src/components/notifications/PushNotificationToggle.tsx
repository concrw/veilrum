import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/utils/registerSW";

interface PushNotificationToggleProps {
  variant?: "button" | "switch";
  showLabel?: boolean;
  className?: string;
}

export const PushNotificationToggle = ({
  variant = "button",
  showLabel = true,
  className = "",
}: PushNotificationToggleProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      // Check if push notifications are supported
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);

      // Check current subscription status
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isSupported) {
      toast({
        title: "지원되지 않음",
        description: "이 브라우저는 푸시 알림을 지원하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        await unsubscribeFromPushNotifications(supabase);
        setIsSubscribed(false);
        toast({
          title: "알림 해제됨",
          description: "푸시 알림 구독이 해제되었습니다.",
        });
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          toast({
            title: "권한 필요",
            description: "알림을 받으려면 브라우저에서 알림 권한을 허용해주세요.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const registration = await registerServiceWorker();
        if (!registration) {
          throw new Error("Service Worker 등록 실패");
        }

        const subscription = await subscribeToPushNotifications(registration, supabase);

        if (subscription) {
          setIsSubscribed(true);
          toast({
            title: "알림 설정 완료",
            description: "이제 중요한 알림을 받을 수 있습니다.",
          });
        } else {
          throw new Error("구독 실패");
        }
      }
    } catch (error) {
      console.error("Push notification toggle error:", error);
      toast({
        title: "오류 발생",
        description: "알림 설정 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported && !isLoading) {
    return null;
  }

  if (variant === "switch") {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {showLabel && (
          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm">푸시 알림</span>
          </div>
        )}
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={`gap-2 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="text-xs">
          {isLoading
            ? "처리 중..."
            : isSubscribed
            ? "알림 켜짐"
            : "알림 받기"}
        </span>
      )}
    </Button>
  );
};
