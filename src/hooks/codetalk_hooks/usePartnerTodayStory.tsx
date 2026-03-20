import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { UNLOCK_HOUR } from "@/lib/constants";

export const usePartnerTodayStory = (partnerId: string) => {
  const query = useQuery({
    queryKey: ["partner-today-story", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;

      // 오후 6시를 기점으로 하는 세션 계산 (한국 시간 기준)
      const now = new Date();
      const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9 (KST)
      const currentHour = kstNow.getHours();

      let sessionStart: Date;
      if (currentHour >= UNLOCK_HOUR) {
        // 오후 6시 이후면 오늘 오후 6시부터 (KST)
        const kstToday = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), UNLOCK_HOUR, 0, 0);
        sessionStart = new Date(kstToday.getTime() - (9 * 60 * 60 * 1000)); // KST를 UTC로 변환
      } else {
        // 오후 6시 이전이면 어제 오후 6시부터 (KST)
        const kstYesterday = new Date(kstNow);
        kstYesterday.setDate(kstYesterday.getDate() - 1);
        const kstYesterdaySession = new Date(kstYesterday.getFullYear(), kstYesterday.getMonth(), kstYesterday.getDate(), UNLOCK_HOUR, 0, 0);
        sessionStart = new Date(kstYesterdaySession.getTime() - (9 * 60 * 60 * 1000)); // KST를 UTC로 변환
      }
      
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", partnerId)
        .gte("created_at", sessionStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    },
    enabled: !!partnerId,
  });

  // 실시간 업데이트 설정
  useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `user_id=eq.${partnerId}`
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [partnerId, query]);

  return query;
};