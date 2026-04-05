/**
 * Hooks for Why Analysis functionality
 * - Analyze happy/pain job patterns
 * - Extract keywords and root causes
 * - Generate Prime Perspective
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

// ============================================================================
// TYPES
// ============================================================================

export interface JobEntry {
  id: string;
  user_id: string;
  session_id?: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
  category: "happy" | "pain" | "neutral";
  reason: string | null;
  has_experience: boolean;
  experience_note: string | null;
  created_at: string;
}

export interface PatternAnalysis {
  keyword: string;
  frequency: number;
  jobs: string[];
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  prime_perspective: string;
  happy_keywords: string[];
  pain_keywords: string[];
  analysis_data: {
    total_jobs: number;
    happy_count: number;
    pain_count: number;
    neutral_count: number;
    experience_ratio: number;
    happy_patterns: PatternAnalysis[];
    pain_patterns: PatternAnalysis[];
    root_causes: {
      happy_root: string;
      pain_root: string;
      consistency_score: number;
    };
  };
  created_at: string;
}

// ============================================================================
// JOB ENTRIES
// ============================================================================

/**
 * Hook to get all job entries for current user
 */
export const useJobEntries = (sessionId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-entries", user?.id, sessionId],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("job_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as JobEntry[];
    },
    enabled: !!user,
  });
};

/**
 * Hook to get job entries by category
 */
export const useJobEntriesByCategory = (
  category: "happy" | "pain" | "neutral"
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-entries-by-category", user?.id, category],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", category)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as JobEntry[];
    },
    enabled: !!user,
  });
};

/**
 * Hook to get job entry statistics
 */
export const useJobEntryStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-entry-stats", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("job_entries")
        .select("category, has_experience")
        .eq("user_id", user.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        happy: data.filter((j) => j.category === "happy").length,
        pain: data.filter((j) => j.category === "pain").length,
        neutral: data.filter((j) => j.category === "neutral").length,
        with_experience: data.filter((j) => j.has_experience).length,
      };

      return stats;
    },
    enabled: !!user,
  });
};

// ============================================================================
// ANALYSIS RESULTS
// ============================================================================

/**
 * Hook to get latest analysis result
 */
export const useLatestAnalysis = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["latest-analysis", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("analysis_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as AnalysisResult | null;
    },
    enabled: !!user,
  });
};

/**
 * Hook to get all analysis results (history)
 */
export const useAnalysisHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analysis-history", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("analysis_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as AnalysisResult[];
    },
    enabled: !!user,
  });
};

/**
 * Hook to trigger Why pattern analysis
 */
export const useAnalyzeWhyPatterns = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId?: string } = {}) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke(
        "analyze-why-patterns",
        {
          body: { userId: user.id, sessionId },
        }
      );

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["latest-analysis", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["analysis-history", user?.id] });

      toast({
        title: "분석 완료!",
        description: "Why 패턴 분석이 완료되었습니다.",
      });
    },
    onError: (error: unknown) => {
      console.error("Why analysis error:", error);
      toast({
        title: "분석 실패",
        description: error instanceof Error ? error.message : "Why 패턴 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to delete analysis result
 */
export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from("analysis_results")
        .delete()
        .eq("id", analysisId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-analysis", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["analysis-history", user?.id] });

      toast({
        title: "삭제 완료",
        description: "분석 결과가 삭제되었습니다.",
      });
    },
    onError: (error: unknown) => {
      console.error("Delete analysis error:", error);
      toast({
        title: "삭제 실패",
        description: "분석 결과 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get top N keywords from pattern analysis
 */
export function getTopKeywords(
  patterns: PatternAnalysis[],
  limit: number = 5
): string[] {
  return patterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit)
    .map((p) => p.keyword);
}

/**
 * Calculate consistency score as percentage
 */
export function getConsistencyPercentage(score: number): number {
  return Math.round(score * 100);
}

/**
 * Check if user has enough data for meaningful analysis
 */
export function hasEnoughDataForAnalysis(stats: {
  total: number;
  happy: number;
  pain: number;
}): boolean {
  return stats.total >= 10 && stats.happy >= 3 && stats.pain >= 3;
}

/**
 * Get analysis quality indicator
 */
export function getAnalysisQuality(analysisData: AnalysisResult["analysis_data"]): {
  quality: "excellent" | "good" | "fair" | "poor";
  message: string;
} {
  const { total_jobs, experience_ratio, root_causes } = analysisData;

  if (
    total_jobs >= 50 &&
    experience_ratio >= 0.3 &&
    root_causes.consistency_score >= 0.7
  ) {
    return {
      quality: "excellent",
      message: "매우 신뢰도 높은 분석 결과입니다",
    };
  }

  if (
    total_jobs >= 30 &&
    experience_ratio >= 0.2 &&
    root_causes.consistency_score >= 0.5
  ) {
    return {
      quality: "good",
      message: "신뢰할 수 있는 분석 결과입니다",
    };
  }

  if (total_jobs >= 15 && root_causes.consistency_score >= 0.3) {
    return {
      quality: "fair",
      message: "참고할 만한 분석 결과입니다",
    };
  }

  return {
    quality: "poor",
    message: "더 많은 데이터가 필요합니다",
  };
}
