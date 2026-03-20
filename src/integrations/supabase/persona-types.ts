// ============================================================================
// MULTI-PERSONA FEATURE TYPES
// TypeScript types for multi-persona functionality
// ============================================================================

export interface PersonaProfile {
  id: string;
  user_id: string;
  persona_name: string;
  persona_archetype: string | null;
  theme_description: string;
  color_hex: string;
  icon_name: string;
  strength_score: number | null;
  rank_order: number | null;
  is_user_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonaJobMapping {
  id: string;
  persona_id: string;
  job_entry_id: string;
  cluster_confidence: number | null;
  embedding_vector: string | null;
  created_at: string;
}

export interface PersonaKeyword {
  id: string;
  persona_id: string;
  keyword: string;
  frequency: number;
  sentiment_score: number | null;
  created_at: string;
}

export interface PersonaPerspective {
  id: string;
  persona_id: string;
  perspective_text: string;
  core_values: string[];
  happy_patterns: string[];
  pain_avoidance: string[];
  origin_moments: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface PersonaRelationship {
  id: string;
  user_id: string;
  persona_a_id: string;
  persona_b_id: string;
  relationship_type: "synergy" | "conflict" | "neutral";
  synergy_description: string | null;
  conflict_description: string | null;
  synergy_score: number | null;
  conflict_score: number | null;
  created_at: string;
}

export interface PersonaIkigai {
  id: string;
  persona_id: string;
  love_elements: string[];
  good_at_elements: string[];
  world_needs_elements: string[];
  paid_for_elements: string[];
  passion: string[];
  mission: string[];
  profession: string[];
  vocation: string[];
  final_ikigai_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonaBrand {
  id: string;
  persona_id: string;
  brand_direction: Record<string, unknown>;
  content_strategy: Record<string, unknown>;
  target_audience: Record<string, unknown>;
  brand_names: string[];
  selected_name: string | null;
  revenue_model: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IntegratedBrandStrategy {
  id: string;
  user_id: string;
  integration_type: "unified" | "hybrid" | "separated";
  unified_brand_name: string | null;
  unified_tagline: string | null;
  positioning_strategy: string | null;
  content_mix_strategy: Record<string, unknown>;
  persona_allocation: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface PersonaGrowthTracking {
  id: string;
  persona_id: string;
  snapshot_date: string;
  activation_percentage: number | null;
  skills_count: number | null;
  content_count: number | null;
  revenue_contribution: number | null;
  satisfaction_score: number | null;
  user_notes: string | null;
  created_at: string;
}

// Extended Profile type with multi-persona fields
export interface ExtendedProfile {
  id: string;
  name: string | null;
  email: string | null;
  has_completed_analysis: boolean;
  avatar_url: string | null;
  has_multiple_personas: boolean;
  active_persona_id: string | null;
  subscription_tier: "free" | "pro" | "elite";
  created_at: string;
  updated_at: string;
}

// Persona with related data
export interface PersonaWithDetails extends PersonaProfile {
  keywords?: PersonaKeyword[];
  perspective?: PersonaPerspective;
  ikigai?: PersonaIkigai;
  brand?: PersonaBrand;
  job_count?: number;
  is_accessible?: boolean; // Based on subscription tier
}

// Persona detection result
export interface PersonaDetectionResult {
  personas: PersonaProfile[];
  relationships?: PersonaRelationship[];
  count: number;
  success: boolean;
}

// Archetype configuration
export interface ArchetypeConfig {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const ARCHETYPE_CONFIGS: Record<string, ArchetypeConfig> = {
  Healer: {
    name: "힐러",
    color: "#10b981",
    icon: "Heart",
    description: "돌봄과 치유를 통해 타인의 행복을 추구",
  },
  Creator: {
    name: "크리에이터",
    color: "#8b5cf6",
    icon: "Palette",
    description: "창의적 표현과 창작을 통해 가치 창출",
  },
  Strategist: {
    name: "전략가",
    color: "#3b82f6",
    icon: "Target",
    description: "전략적 사고와 큰 그림으로 방향 제시",
  },
  Analyst: {
    name: "분석가",
    color: "#06b6d4",
    icon: "BarChart3",
    description: "데이터 기반 분석과 논리적 사고",
  },
  Builder: {
    name: "빌더",
    color: "#f59e0b",
    icon: "Wrench",
    description: "실질적 구축과 문제 해결",
  },
  Teacher: {
    name: "교육자",
    color: "#ec4899",
    icon: "GraduationCap",
    description: "지식 전달과 성장 촉진",
  },
  Explorer: {
    name: "탐험가",
    color: "#14b8a6",
    icon: "Compass",
    description: "새로운 경험과 발견 추구",
  },
  Guardian: {
    name: "수호자",
    color: "#6366f1",
    icon: "Shield",
    description: "보호와 안정성 유지",
  },
};

// Function types
export type DetectPersonasFunction = (userId: string) => Promise<PersonaDetectionResult>;
export type GetAccessiblePersonasFunction = (userId: string) => Promise<PersonaWithDetails[]>;
export type AnalyzePersonaRelationshipsFunction = (userId: string) => Promise<PersonaRelationship[]>;
