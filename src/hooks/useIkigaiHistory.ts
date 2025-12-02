/**
 * Hooks for Ikigai history and version management
 * Manages both AI-generated (ikigai_assessments) and user-designed (ikigai_designs) versions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

// ============================================================================
// TYPES
// ============================================================================

export interface IkigaiAssessment {
  id: string;
  user_id: string;
  love_elements: string[];
  good_at_elements: string[];
  world_needs_elements: string[];
  paid_for_elements: string[];
  ikigai_intersections: any;
  final_ikigai: string | null;
  created_at: string;
}

export interface IkigaiDesign {
  id: string;
  user_id: string;
  love_elements: string[];
  good_at_elements: string[];
  world_needs_elements: string[];
  paid_for_elements: string[];
  final_ikigai_text: string | null;
  created_at: string;
  updated_at: string;
}

export type IkigaiHistoryItem = {
  id: string;
  type: "assessment" | "design";
  created_at: string;
  updated_at?: string;
  data: IkigaiAssessment | IkigaiDesign;
};

// ============================================================================
// AI-GENERATED ASSESSMENTS HISTORY
// ============================================================================

/**
 * Get all AI-generated ikigai assessments for current user (history)
 */
export const useIkigaiAssessmentsHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ikigai-assessments-history", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ikigai_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as IkigaiAssessment[];
    },
    enabled: !!user,
  });
};

/**
 * Get specific ikigai assessment by ID
 */
export const useIkigaiAssessment = (assessmentId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ikigai-assessment", assessmentId],
    queryFn: async () => {
      if (!user || !assessmentId) throw new Error("Missing parameters");

      const { data, error } = await supabase
        .from("ikigai_assessments")
        .select("*")
        .eq("id", assessmentId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return data as IkigaiAssessment;
    },
    enabled: !!user && !!assessmentId,
  });
};

/**
 * Delete ikigai assessment
 */
export const useDeleteIkigaiAssessment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await supabase
        .from("ikigai_assessments")
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ikigai-assessments-history", user?.id],
      });

      toast({
        title: "삭제 완료",
        description: "Ikigai 버전이 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("Delete ikigai assessment error:", error);
      toast({
        title: "삭제 실패",
        description: "Ikigai 버전 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });
};

// ============================================================================
// USER-DESIGNED IKIGAI HISTORY
// ============================================================================

/**
 * Get all user-designed ikigai for current user (history)
 */
export const useIkigaiDesignsHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ikigai-designs-history", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ikigai_designs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as IkigaiDesign[];
    },
    enabled: !!user,
  });
};

/**
 * Get specific ikigai design by ID
 */
export const useIkigaiDesign = (designId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ikigai-design", designId],
    queryFn: async () => {
      if (!user || !designId) throw new Error("Missing parameters");

      const { data, error } = await supabase
        .from("ikigai_designs")
        .select("*")
        .eq("id", designId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return data as IkigaiDesign;
    },
    enabled: !!user && !!designId,
  });
};

/**
 * Save new version of user-designed ikigai (creates new record for history)
 */
export const useSaveIkigaiDesignVersion = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (design: {
      love_elements: string[];
      good_at_elements: string[];
      world_needs_elements: string[];
      paid_for_elements: string[];
      final_ikigai_text?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ikigai_designs")
        .insert({
          user_id: user.id,
          ...design,
        })
        .select()
        .single();

      if (error) throw error;

      return data as IkigaiDesign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ikigai-designs-history", user?.id],
      });

      toast({
        title: "저장 완료",
        description: "새로운 Ikigai 버전이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("Save ikigai design version error:", error);
      toast({
        title: "저장 실패",
        description: "Ikigai 버전 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Delete ikigai design
 */
export const useDeleteIkigaiDesign = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (designId: string) => {
      const { error } = await supabase
        .from("ikigai_designs")
        .delete()
        .eq("id", designId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ikigai-designs-history", user?.id],
      });

      toast({
        title: "삭제 완료",
        description: "Ikigai 버전이 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("Delete ikigai design error:", error);
      toast({
        title: "삭제 실패",
        description: "Ikigai 버전 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });
};

// ============================================================================
// COMBINED HISTORY
// ============================================================================

/**
 * Get combined history of both AI assessments and user designs
 */
export const useCombinedIkigaiHistory = () => {
  const assessmentsQuery = useIkigaiAssessmentsHistory();
  const designsQuery = useIkigaiDesignsHistory();

  const combinedHistory: IkigaiHistoryItem[] = [];

  if (assessmentsQuery.data) {
    assessmentsQuery.data.forEach((assessment) => {
      combinedHistory.push({
        id: assessment.id,
        type: "assessment",
        created_at: assessment.created_at,
        data: assessment,
      });
    });
  }

  if (designsQuery.data) {
    designsQuery.data.forEach((design) => {
      combinedHistory.push({
        id: design.id,
        type: "design",
        created_at: design.created_at,
        updated_at: design.updated_at,
        data: design,
      });
    });
  }

  // Sort by created_at descending
  combinedHistory.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    data: combinedHistory,
    isLoading: assessmentsQuery.isLoading || designsQuery.isLoading,
    error: assessmentsQuery.error || designsQuery.error,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compare two ikigai versions
 */
export function compareIkigaiVersions(
  v1: IkigaiAssessment | IkigaiDesign,
  v2: IkigaiAssessment | IkigaiDesign
) {
  const changes = {
    love: {
      added: v2.love_elements.filter((item) => !v1.love_elements.includes(item)),
      removed: v1.love_elements.filter((item) => !v2.love_elements.includes(item)),
    },
    goodAt: {
      added: v2.good_at_elements.filter(
        (item) => !v1.good_at_elements.includes(item)
      ),
      removed: v1.good_at_elements.filter(
        (item) => !v2.good_at_elements.includes(item)
      ),
    },
    worldNeeds: {
      added: v2.world_needs_elements.filter(
        (item) => !v1.world_needs_elements.includes(item)
      ),
      removed: v1.world_needs_elements.filter(
        (item) => !v2.world_needs_elements.includes(item)
      ),
    },
    paidFor: {
      added: v2.paid_for_elements.filter(
        (item) => !v1.paid_for_elements.includes(item)
      ),
      removed: v1.paid_for_elements.filter(
        (item) => !v2.paid_for_elements.includes(item)
      ),
    },
  };

  return changes;
}

/**
 * Calculate completeness score for an ikigai version
 */
export function calculateCompletenessScore(
  ikigai: IkigaiAssessment | IkigaiDesign
): number {
  const sections = [
    ikigai.love_elements,
    ikigai.good_at_elements,
    ikigai.world_needs_elements,
    ikigai.paid_for_elements,
  ];

  const filledSections = sections.filter((s) => s.length > 0).length;
  return (filledSections / 4) * 100;
}
