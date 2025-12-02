import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  PersonaProfile,
  PersonaWithDetails,
  PersonaDetectionResult,
} from "@/integrations/supabase/persona-types";
import { toast } from "sonner";

// ============================================================================
// PERSONA QUERIES
// ============================================================================

/**
 * Hook to get all personas for the current user
 */
export const usePersonas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["personas", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_profiles")
        .select(
          `
          *,
          persona_keywords (keyword, frequency),
          persona_perspectives (*),
          persona_ikigai (*),
          persona_brands (*)
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("rank_order", { ascending: true });

      if (error) throw error;

      return data as PersonaWithDetails[];
    },
    enabled: !!user,
  });
};

/**
 * Hook to get accessible personas based on subscription tier
 */
export const useAccessiblePersonas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["accessible-personas", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("get_accessible_personas", {
        input_user_id: user.id,
      });

      if (error) throw error;

      return data as PersonaWithDetails[];
    },
    enabled: !!user,
  });
};

/**
 * Hook to get a single persona by ID
 */
export const usePersona = (personaId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["persona", personaId],
    queryFn: async () => {
      if (!user || !personaId) throw new Error("Missing required data");

      const { data, error } = await supabase
        .from("persona_profiles")
        .select(
          `
          *,
          persona_keywords (keyword, frequency),
          persona_perspectives (*),
          persona_ikigai (*),
          persona_brands (*)
        `
        )
        .eq("id", personaId)
        .single();

      if (error) throw error;

      return data as PersonaWithDetails;
    },
    enabled: !!user && !!personaId,
  });
};

/**
 * Hook to get the main persona (rank_order = 1)
 */
export const useMainPersona = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["main-persona", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_profiles")
        .select(
          `
          *,
          persona_keywords (keyword, frequency),
          persona_perspectives (*),
          persona_ikigai (*),
          persona_brands (*)
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("rank_order", 1)
        .single();

      if (error) throw error;

      return data as PersonaWithDetails;
    },
    enabled: !!user,
  });
};

/**
 * Hook to check if user has multiple personas
 */
export const useHasMultiplePersonas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["has-multiple-personas", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("has_multiple_personas, subscription_tier")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      return {
        hasMultiple: data.has_multiple_personas,
        subscriptionTier: data.subscription_tier as "free" | "pro" | "elite",
        canAccessAll: data.subscription_tier !== "free",
      };
    },
    enabled: !!user,
  });
};

// ============================================================================
// PERSONA MUTATIONS
// ============================================================================

/**
 * Hook to detect and create personas from Why analysis
 */
export const useDetectPersonas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke(
        "detect-personas",
        {
          body: { userId: user.id },
        }
      );

      if (error) throw error;

      return data as PersonaDetectionResult;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["personas", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["accessible-personas", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["has-multiple-personas", user?.id],
      });

      toast.success(
        `${data.count}개의 페르소나가 발견되었습니다!`,
        {
          description: "각 페르소나를 확인하고 검증해주세요.",
        }
      );
    },
    onError: (error) => {
      console.error("Persona detection error:", error);
      toast.error("페르소나 감지 중 오류가 발생했습니다", {
        description: error.message,
      });
    },
  });
};

/**
 * Hook to update a persona
 */
export const useUpdatePersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personaId,
      updates,
    }: {
      personaId: string;
      updates: Partial<PersonaProfile>;
    }) => {
      const { data, error } = await supabase
        .from("persona_profiles")
        .update(updates)
        .eq("id", personaId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["persona", variables.personaId] });
      queryClient.invalidateQueries({ queryKey: ["personas"] });

      toast.success("페르소나가 업데이트되었습니다");
    },
    onError: (error) => {
      console.error("Persona update error:", error);
      toast.error("페르소나 업데이트 중 오류가 발생했습니다");
    },
  });
};

/**
 * Hook to verify a persona (user confirmation)
 */
export const useVerifyPersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personaId: string) => {
      const { data, error } = await supabase
        .from("persona_profiles")
        .update({ is_user_verified: true })
        .eq("id", personaId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      toast.success("페르소나를 확인했습니다");
    },
    onError: (error) => {
      console.error("Persona verification error:", error);
      toast.error("페르소나 확인 중 오류가 발생했습니다");
    },
  });
};

/**
 * Hook to deactivate (soft delete) a persona
 */
export const useDeactivatePersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personaId: string) => {
      const { data, error } = await supabase
        .from("persona_profiles")
        .update({ is_active: false })
        .eq("id", personaId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      toast.success("페르소나를 비활성화했습니다");
    },
    onError: (error) => {
      console.error("Persona deactivation error:", error);
      toast.error("페르소나 비활성화 중 오류가 발생했습니다");
    },
  });
};

/**
 * Hook to set active persona for the user
 */
export const useSetActivePersona = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personaId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({ active_persona_id: personaId })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("활성 페르소나가 변경되었습니다");
    },
    onError: (error) => {
      console.error("Set active persona error:", error);
      toast.error("활성 페르소나 변경 중 오류가 발생했습니다");
    },
  });
};

// ============================================================================
// PERSONA RELATIONSHIPS
// ============================================================================

/**
 * Hook to get persona relationships (synergies and conflicts)
 */
export const usePersonaRelationships = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["persona-relationships", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_relationships")
        .select("*")
        .eq("user_id", user.id)
        .order("strength_score", { ascending: false });

      if (error) throw error;

      return data;
    },
    enabled: !!user,
  });
};

/**
 * Hook to analyze and store persona relationships
 */
export const useAnalyzePersonaRelationships = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke(
        "analyze-persona-relationships",
        {
          body: { userId: user.id },
        }
      );

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persona-relationships", user?.id] });
      toast.success("페르소나 관계 분석이 완료되었습니다");
    },
    onError: (error) => {
      console.error("Relationship analysis error:", error);
      toast.error("관계 분석 중 오류가 발생했습니다");
    },
  });
};

// ============================================================================
// PERSONA IKIGAI
// ============================================================================

/**
 * Hook to get Ikigai for a specific persona
 */
export const usePersonaIkigai = (personaId: string | null) => {
  return useQuery({
    queryKey: ["persona-ikigai", personaId],
    queryFn: async () => {
      if (!personaId) throw new Error("Persona ID required");

      const { data, error } = await supabase
        .from("persona_ikigai")
        .select("*")
        .eq("persona_id", personaId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

      return data;
    },
    enabled: !!personaId,
  });
};

/**
 * Hook to upsert (create or update) persona Ikigai
 */
export const useUpsertPersonaIkigai = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personaId,
      ikigaiData,
    }: {
      personaId: string;
      ikigaiData: {
        love_elements?: string[];
        good_at_elements?: string[];
        world_needs_elements?: string[];
        paid_for_elements?: string[];
        final_ikigai_text?: string;
      };
    }) => {
      const { data, error } = await supabase
        .from("persona_ikigai")
        .upsert(
          {
            persona_id: personaId,
            ...ikigaiData,
          },
          { onConflict: "persona_id" }
        )
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["persona-ikigai", variables.personaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["persona", variables.personaId],
      });

      toast.success("Ikigai가 저장되었습니다");
    },
    onError: (error) => {
      console.error("Ikigai upsert error:", error);
      toast.error("Ikigai 저장 중 오류가 발생했습니다");
    },
  });
};

// ============================================================================
// BRANDING STRATEGIES
// ============================================================================

/**
 * Hook to get the user's branding strategy
 */
export const useBrandingStrategy = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["branding-strategy", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_branding_strategies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
    enabled: !!user,
  });
};

/**
 * Hook to save or update branding strategy
 */
export const useSaveBrandingStrategy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      strategyType,
      customNotes,
    }: {
      strategyType: "unified" | "hybrid" | "separated";
      customNotes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_branding_strategies")
        .upsert(
          {
            user_id: user.id,
            strategy_type: strategyType,
            custom_notes: customNotes,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding-strategy", user?.id] });
      toast.success("브랜딩 전략이 저장되었습니다");
    },
    onError: (error) => {
      console.error("Branding strategy save error:", error);
      toast.error("브랜딩 전략 저장 중 오류가 발생했습니다");
    },
  });
};

// ============================================================================
// MILESTONES
// ============================================================================

/**
 * Hook to get milestones for a persona
 */
export const usePersonaMilestones = (personaId: string | null) => {
  return useQuery({
    queryKey: ["persona-milestones", personaId],
    queryFn: async () => {
      if (!personaId) throw new Error("Persona ID required");

      const { data, error } = await supabase
        .from("persona_milestones")
        .select("*")
        .eq("persona_id", personaId)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      return data;
    },
    enabled: !!personaId,
  });
};

/**
 * Hook to get all milestones for current user
 */
export const useAllMilestones = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-milestones", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_milestones")
        .select("*, persona:persona_profiles(persona_name, color_hex)")
        .eq("user_id", user.id)
        .order("target_date", { ascending: true });

      if (error) throw error;

      return data;
    },
    enabled: !!user,
  });
};

/**
 * Hook to toggle milestone completion
 */
export const useToggleMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      isCompleted,
    }: {
      milestoneId: string;
      isCompleted: boolean;
    }) => {
      const { data, error } = await supabase
        .from("persona_milestones")
        .update({ is_completed: isCompleted })
        .eq("id", milestoneId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["persona-milestones", data.persona_id] });
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      toast.success(data.is_completed ? "마일스톤 완료!" : "마일스톤 미완료로 변경");
    },
    onError: (error) => {
      console.error("Milestone toggle error:", error);
      toast.error("마일스톤 업데이트 중 오류가 발생했습니다");
    },
  });
};

/**
 * Hook to create a new milestone
 */
export const useCreateMilestone = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personaId,
      title,
      description,
      milestoneType,
      targetDate,
    }: {
      personaId: string;
      title: string;
      description?: string;
      milestoneType?: string;
      targetDate?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_milestones")
        .insert({
          user_id: user.id,
          persona_id: personaId,
          title,
          description,
          milestone_type: milestoneType,
          target_date: targetDate,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["persona-milestones", data.persona_id] });
      queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
      toast.success("마일스톤이 생성되었습니다");
    },
    onError: (error) => {
      console.error("Milestone creation error:", error);
      toast.error("마일스톤 생성 중 오류가 발생했습니다");
    },
  });
};

// ============================================================================
// GROWTH METRICS
// ============================================================================

/**
 * Hook to get growth summary for all personas
 */
export const useGrowthSummary = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["growth-summary", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("get_persona_growth_summary", {
        input_user_id: user.id,
      });

      if (error) throw error;

      return data;
    },
    enabled: !!user,
  });
};

/**
 * Hook to get growth metrics history for a persona
 */
export const usePersonaGrowthHistory = (personaId: string | null) => {
  return useQuery({
    queryKey: ["persona-growth-history", personaId],
    queryFn: async () => {
      if (!personaId) throw new Error("Persona ID required");

      const { data, error } = await supabase
        .from("persona_growth_metrics")
        .select("*")
        .eq("persona_id", personaId)
        .order("measurement_date", { ascending: true });

      if (error) throw error;

      return data;
    },
    enabled: !!personaId,
  });
};

/**
 * Hook to record a new growth metric
 */
export const useRecordGrowthMetric = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      personaId,
      strengthScore,
      notes,
    }: {
      personaId: string;
      strengthScore: number;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("persona_growth_metrics")
        .insert({
          user_id: user.id,
          persona_id: personaId,
          strength_score: strengthScore,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["persona-growth-history", data.persona_id] });
      queryClient.invalidateQueries({ queryKey: ["growth-summary"] });
      toast.success("성장 지표가 기록되었습니다");
    },
    onError: (error) => {
      console.error("Growth metric recording error:", error);
      toast.error("성장 지표 기록 중 오류가 발생했습니다");
    },
  });
};
