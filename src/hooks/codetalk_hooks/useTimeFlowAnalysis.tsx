import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeFlowData {
  hour: string;
  submissions: number;
}

export interface SubmissionPattern {
  totalSubmissions: number;
  peakHour: string;
  peakCount: number;
  quietHour: string;
  quietCount: number;
  averagePerHour: number;
}

export const useTimeFlowAnalysis = () => {
  return useQuery({
    queryKey: ['timeFlowAnalysis'],
    queryFn: async (): Promise<TimeFlowData[]> => {
      try {
        const { data: stories, error } = await supabase
          .from('stories')
          .select('created_at')
          .not('created_at', 'is', null);

        if (error) {
          console.error('Error fetching stories for time flow analysis:', error);
          throw error;
        }

        if (!stories || stories.length === 0) {
          // 빈 데이터인 경우 24시간 0으로 초기화
          return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}시`,
            submissions: 0
          }));
        }

        // 시간대별 제출 수 계산 (한국 시간 기준)
        const hourCounts = Array(24).fill(0);

        stories.forEach(story => {
          // UTC 시간을 한국 시간(UTC+9)으로 변환
          const utcDate = new Date(story.created_at);
          const koreaTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
          const hour = koreaTime.getHours();
          hourCounts[hour]++;
        });

        // 결과 배열 생성
        const timeFlowData: TimeFlowData[] = hourCounts.map((count, hour) => ({
          hour: `${hour}시`,
          submissions: count
        }));

        return timeFlowData;
      } catch (error) {
        console.error('Error in time flow analysis:', error);
        // 에러 발생시 빈 데이터 반환
        return Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}시`,
          submissions: 0
        }));
      }
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

export const useSubmissionPattern = (timeFlowData?: TimeFlowData[]) => {
  return useQuery({
    queryKey: ['submissionPattern', timeFlowData],
    queryFn: async (): Promise<SubmissionPattern> => {
      if (!timeFlowData || timeFlowData.length === 0) {
        return {
          totalSubmissions: 0,
          peakHour: '0시',
          peakCount: 0,
          quietHour: '0시',
          quietCount: 0,
          averagePerHour: 0
        };
      }

      const totalSubmissions = timeFlowData.reduce((sum, item) => sum + item.submissions, 0);
      const averagePerHour = Math.round(totalSubmissions / 24);

      // 가장 활발한 시간과 가장 조용한 시간 찾기
      let peakHour = timeFlowData[0];
      let quietHour = timeFlowData[0];

      timeFlowData.forEach(item => {
        if (item.submissions > peakHour.submissions) {
          peakHour = item;
        }
        if (item.submissions < quietHour.submissions) {
          quietHour = item;
        }
      });

      return {
        totalSubmissions,
        peakHour: peakHour.hour,
        peakCount: peakHour.submissions,
        quietHour: quietHour.hour,
        quietCount: quietHour.submissions,
        averagePerHour
      };
    },
    enabled: !!timeFlowData,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useWeeklyTrend = () => {
  return useQuery({
    queryKey: ['weeklyTrend'],
    queryFn: async () => {
      try {
        const { data: stories, error } = await supabase
          .from('stories')
          .select('created_at')
          .not('created_at', 'is', null)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (error) {
          console.error('Error fetching weekly trend data:', error);
          throw error;
        }

        if (!stories || stories.length === 0) {
          return [];
        }

        // 지난 7일간 일별 제출 수 계산
        const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
        const dayCounts = Array(7).fill(0);

        stories.forEach(story => {
          const utcDate = new Date(story.created_at);
          const koreaTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
          const dayOfWeek = koreaTime.getDay(); // 0=일요일, 6=토요일
          dayCounts[dayOfWeek]++;
        });

        return dayCounts.map((count, index) => ({
          day: `${dayLabels[index]}요일`,
          submissions: count
        }));
      } catch (error) {
        console.error('Error in weekly trend analysis:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 60 * 60 * 1000, // 1시간
  });
};