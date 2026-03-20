import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type ActivityType =
  | "login"
  | "logout"
  | "page_view"
  | "why_analysis_start"
  | "why_analysis_complete"
  | "ikigai_start"
  | "ikigai_complete"
  | "brand_start"
  | "brand_complete"
  | "persona_detected"
  | "match_request"
  | "message_sent"
  | "group_joined";

type ConversionEvent =
  | "signup"
  | "onboarding_complete"
  | "why_complete"
  | "ikigai_complete"
  | "brand_complete"
  | "first_match"
  | "upgrade_clicked"
  | "subscribed";

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      trackActivity("page_view", { page_path: location.pathname });
    }
  }, [location.pathname, user?.id]);
}

export async function trackActivity(
  activityType: ActivityType,
  activityData: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("user_activities").insert({
      user_id: user.id,
      activity_type: activityType,
      activity_data: activityData,
      page_path: window.location.pathname,
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
  }
}

export async function trackConversion(
  eventName: ConversionEvent,
  eventData: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("conversion_events").insert({
      user_id: user.id,
      event_name: eventName,
      event_data: eventData,
    });
  } catch (error) {
    console.error("Failed to track conversion:", error);
  }
}

export function useAnalytics() {
  return {
    trackActivity,
    trackConversion,
  };
}
