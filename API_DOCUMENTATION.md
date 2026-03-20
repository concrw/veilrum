# PRIPER Multi-Persona API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints, Edge Functions, and database procedures used in the PRIPER multi-persona feature system.

**Last Updated**: 2025-11-24

---

## Table of Contents

1. [Edge Functions](#edge-functions)
   - [detect-personas](#1-detect-personas)
   - [analyze-persona-relationships](#2-analyze-persona-relationships)
2. [Database RPC Functions](#database-rpc-functions)
3. [Direct Database Access Patterns](#direct-database-access-patterns)
4. [Authentication & Authorization](#authentication--authorization)
5. [Error Codes & Handling](#error-codes--handling)
6. [Rate Limits & Quotas](#rate-limits--quotas)
7. [Examples & Usage](#examples--usage)

---

## Edge Functions

### 1. detect-personas

**Endpoint**: `POST /functions/v1/detect-personas`

**Purpose**: Analyzes user's happy jobs to detect 2-5 distinct personas using K-means clustering and AI theme generation.

#### Request

**Headers**:
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "userId": "uuid",           // Optional: Admin override for testing
  "minClusters": 2,           // Optional: Minimum personas (default: 2)
  "maxClusters": 5,           // Optional: Maximum personas (default: 5)
  "forceRegenerate": false    // Optional: Delete existing personas (default: false)
}
```

**Parameter Details**:
- `userId`: Only usable by admin users. If provided, analyzes personas for specified user instead of authenticated user.
- `minClusters`: Must be >= 2. Lower bound for K-means clustering.
- `maxClusters`: Must be <= 5 and >= minClusters. Upper bound for clustering.
- `forceRegenerate`: If true, deletes all existing personas before generating new ones.

#### Response

**Success (200)**:
```json
{
  "success": true,
  "personasCount": 3,
  "personas": [
    {
      "id": "uuid",
      "persona_name": "창의적 문제해결자",
      "persona_archetype": "Creator",
      "theme_description": "디자인과 개발을 융합한 창의적 솔루션 제공",
      "color_hex": "#FF6B6B",
      "strength_score": 85.5,
      "rank_order": 1,
      "keywords": [
        { "keyword": "UI/UX", "frequency": 12 },
        { "keyword": "프론트엔드", "frequency": 10 }
      ]
    }
  ]
}
```

**Error Responses**:

| Status | Error Code | Description |
|--------|-----------|-------------|
| 400 | `MISSING_REQUIRED_FIELDS` | Request body missing required fields |
| 400 | `INSUFFICIENT_DATA` | User has fewer than 3 happy jobs |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 403 | `FORBIDDEN` | Non-admin attempting to use userId override |
| 500 | `OPENAI_API_ERROR` | OpenAI API request failed |
| 500 | `DATABASE_ERROR` | Database operation failed |

#### Process Flow

1. **Validation**: Check authentication and parameters
2. **Data Retrieval**: Fetch user's happy jobs from database
3. **Vectorization**: Convert job descriptions to embeddings using OpenAI text-embedding-3-small
4. **Clustering**: Apply K-means with optimal cluster count (2-5)
5. **Theme Generation**: Use GPT-4 to generate persona themes and archetypes
6. **Storage**: Insert personas and keywords into database
7. **Milestone Creation**: Auto-generate 4 default milestones per persona
8. **Response**: Return created personas

#### Rate Limits

- **OpenAI Embeddings**: ~500 requests per user session (batched)
- **OpenAI GPT-4**: 1 request per persona (2-5 per detection)
- **Function Timeout**: 120 seconds
- **Recommended Frequency**: Once per significant change to happy jobs list

#### Dependencies

- OpenAI API key (environment variable: `OPENAI_API_KEY`)
- Supabase service role key
- Database tables: `happy_jobs`, `persona_profiles`, `persona_keywords`, `persona_milestones`

---

### 2. analyze-persona-relationships

**Endpoint**: `POST /functions/v1/analyze-persona-relationships`

**Purpose**: Analyzes relationships between all persona pairs using AI to determine synergy, conflict, or neutral interactions.

#### Request

**Headers**:
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "userId": "uuid"  // Optional: Admin override
}
```

#### Response

**Success (200)**:
```json
{
  "success": true,
  "relationshipsCount": 3,
  "relationships": [
    {
      "id": "uuid",
      "persona1_id": "uuid",
      "persona2_id": "uuid",
      "relationship_type": "synergy",
      "strength": 0.85,
      "description": "이 두 페르소나는 창의성과 분석력을 결합하여 강력한 시너지를 만듭니다.",
      "ai_insights": {
        "complementary_skills": ["디자인", "데이터 분석"],
        "potential_conflicts": [],
        "collaboration_opportunities": ["데이터 시각화 프로젝트"]
      }
    }
  ]
}
```

**Relationship Types**:
- `synergy`: Personas complement each other (strength: 0.6-1.0)
- `neutral`: Personas coexist without strong interaction (strength: 0.3-0.6)
- `conflict`: Personas have competing goals or values (strength: 0.0-0.3)

**Error Responses**:

| Status | Error Code | Description |
|--------|-----------|-------------|
| 400 | `INSUFFICIENT_PERSONAS` | User has fewer than 2 personas |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 500 | `OPENAI_API_ERROR` | AI analysis failed |
| 500 | `DATABASE_ERROR` | Database operation failed |

#### Process Flow

1. **Validation**: Check authentication and persona count
2. **Persona Retrieval**: Fetch all active personas for user
3. **Pair Analysis**: For each unique pair (n*(n-1)/2 combinations):
   - Extract keywords and themes
   - Send to GPT-4 for relationship analysis
   - Fallback to heuristic analysis if AI fails
4. **Storage**: Delete old relationships, insert new ones
5. **Response**: Return analyzed relationships

#### AI Analysis Prompt

```
Analyze the relationship between two personas:

Persona 1: {name}
- Archetype: {archetype}
- Theme: {description}
- Keywords: {keywords}

Persona 2: {name}
- Archetype: {archetype}
- Theme: {description}
- Keywords: {keywords}

Provide:
1. Relationship type (synergy/neutral/conflict)
2. Strength score (0.0-1.0)
3. Description (Korean, 50-100 characters)
4. AI insights (JSON)
```

#### Rate Limits

- **Function Calls**: 1 per 30 seconds per user (recommended)
- **OpenAI GPT-4**: n*(n-1)/2 requests (3 personas = 3 requests, 5 personas = 10 requests)
- **Function Timeout**: 120 seconds

---

## Database RPC Functions

### 1. create_default_milestones

**Purpose**: Creates 4 default milestones for a newly created persona.

**Signature**:
```sql
create_default_milestones(
  input_user_id uuid,
  input_persona_id uuid,
  input_persona_name text
) RETURNS void
```

**Parameters**:
- `input_user_id`: User ID (for RLS policy)
- `input_persona_id`: Persona ID to create milestones for
- `input_persona_name`: Persona name for milestone titles

**Created Milestones**:

| Sort Order | Title Template | Description | Type | Target Date |
|------------|---------------|-------------|------|-------------|
| 1 | `{name} Ikigai 완성` | 이 페르소나의 4가지 Ikigai 영역을 모두 채우세요 | ikigai | +7 days |
| 2 | `브랜드 정체성 정의` | 이 페르소나의 브랜드 컬러, 폰트, 톤앤매너 결정 | branding | +14 days |
| 3 | `첫 콘텐츠 발행` | 이 페르소나로 첫 블로그 글, 영상, 또는 프로젝트 공유 | content | +30 days |
| 4 | `커뮤니티 참여` | 관련 커뮤니티에서 활동하고 네트워크 구축 | community | +60 days |

**Usage Example**:
```typescript
const { error } = await supabase.rpc("create_default_milestones", {
  input_user_id: user.id,
  input_persona_id: newPersona.id,
  input_persona_name: "창의적 문제해결자"
});
```

**Security**: Function uses `SECURITY DEFINER` to bypass RLS for inserting milestones.

---

### 2. get_persona_growth_summary

**Purpose**: Retrieves growth summary for all personas, comparing current strength with previous measurement.

**Signature**:
```sql
get_persona_growth_summary(
  input_user_id uuid
) RETURNS TABLE (
  persona_id uuid,
  current_strength numeric,
  previous_strength numeric,
  change numeric,
  last_measured_at timestamptz
)
```

**Return Columns**:
- `persona_id`: Persona UUID
- `current_strength`: Current strength score (0-100)
- `previous_strength`: Previous strength score from last measurement
- `change`: Percentage point change (current - previous)
- `last_measured_at`: Timestamp of most recent measurement

**Usage Example**:
```typescript
const { data, error } = await supabase.rpc("get_persona_growth_summary", {
  input_user_id: user.id
});

// Result:
// [
//   {
//     persona_id: "uuid",
//     current_strength: 85.5,
//     previous_strength: 78.2,
//     change: 7.3,
//     last_measured_at: "2025-11-20T..."
//   }
// ]
```

**Calculation Logic**:
- Fetches two most recent growth metrics per persona
- Compares latest vs second-latest
- Falls back to persona.strength_score if no metrics exist

---

## Direct Database Access Patterns

### Personas

**Table**: `persona_profiles`

**Select All Personas**:
```typescript
const { data, error } = await supabase
  .from("persona_profiles")
  .select(`
    *,
    persona_keywords(keyword, frequency)
  `)
  .eq("user_id", user.id)
  .eq("is_active", true)
  .order("rank_order", { ascending: true });
```

**Update Persona Strength**:
```typescript
const { error } = await supabase
  .from("persona_profiles")
  .update({ strength_score: newScore })
  .eq("id", personaId);
```

---

### Branding Strategies

**Table**: `persona_branding_strategies`

**Get Current Strategy**:
```typescript
const { data, error } = await supabase
  .from("persona_branding_strategies")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Save/Update Strategy** (Upsert):
```typescript
const { data, error } = await supabase
  .from("persona_branding_strategies")
  .upsert({
    user_id: user.id,
    strategy_type: "hybrid",
    custom_notes: "Optional notes..."
  }, {
    onConflict: "user_id"
  })
  .select()
  .single();
```

---

### Milestones

**Table**: `persona_milestones`

**Get Milestones for Persona**:
```typescript
const { data, error } = await supabase
  .from("persona_milestones")
  .select("*")
  .eq("user_id", user.id)
  .eq("persona_id", personaId)
  .order("sort_order", { ascending: true });
```

**Toggle Milestone Completion**:
```typescript
const { data, error } = await supabase
  .from("persona_milestones")
  .update({
    is_completed: !currentState,
    completed_at: !currentState ? new Date().toISOString() : null
  })
  .eq("id", milestoneId)
  .select()
  .single();
```

**Create Custom Milestone**:
```typescript
const { data, error } = await supabase
  .from("persona_milestones")
  .insert({
    user_id: user.id,
    persona_id: personaId,
    title: "My Custom Goal",
    description: "Optional description",
    milestone_type: "custom",
    target_date: targetDate,
    sort_order: 99
  })
  .select()
  .single();
```

---

### Growth Metrics

**Table**: `persona_growth_metrics`

**Record Growth Measurement**:
```typescript
const { data, error } = await supabase
  .from("persona_growth_metrics")
  .insert({
    user_id: user.id,
    persona_id: personaId,
    strength_value: 85.5,
    metric_source: "ikigai_completion"
  })
  .select()
  .single();
```

**Get Growth History**:
```typescript
const { data, error } = await supabase
  .from("persona_growth_metrics")
  .select("*")
  .eq("persona_id", personaId)
  .order("measured_at", { ascending: false })
  .limit(10);
```

---

### Relationships

**Table**: `persona_relationships`

**Get All Relationships**:
```typescript
const { data, error } = await supabase
  .from("persona_relationships")
  .select(`
    *,
    persona1:persona_profiles!persona1_id(id, persona_name, color_hex, persona_archetype),
    persona2:persona_profiles!persona2_id(id, persona_name, color_hex, persona_archetype)
  `)
  .eq("user_id", user.id)
  .order("strength", { ascending: false });
```

---

## Authentication & Authorization

### JWT Token Requirements

All API requests require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Includes**:
- `sub`: User ID (UUID)
- `role`: User role (authenticated/admin)
- `exp`: Expiration timestamp

### Row Level Security (RLS)

All tables enforce RLS policies:

**Standard User Policy**:
```sql
CREATE POLICY "Users can access own data"
ON public.persona_profiles
FOR ALL
USING (auth.uid() = user_id);
```

**Admin Override**:
Admin users (identified by `auth.jwt() ->> 'role' = 'admin'`) can access data for any user when using the `userId` parameter in Edge Functions.

### Permission Matrix

| Resource | Read | Create | Update | Delete | Admin Override |
|----------|------|--------|--------|--------|----------------|
| Personas | Own | Own | Own | Own | ✓ |
| Keywords | Own | Own | - | Own | ✓ |
| Milestones | Own | Own | Own | Own | ✓ |
| Strategies | Own | Own | Own | Own | ✓ |
| Relationships | Own | System | System | System | ✓ |
| Growth Metrics | Own | Own | - | - | ✓ |

---

## Error Codes & Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "additional context"
    }
  }
}
```

### Error Code Reference

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token | Ensure user is authenticated and token is not expired |
| `FORBIDDEN` | 403 | Insufficient permissions | User lacks required permissions for operation |
| `INSUFFICIENT_DATA` | 400 | Not enough data to perform operation | User needs to add more happy jobs (minimum 3) |
| `INSUFFICIENT_PERSONAS` | 400 | Operation requires multiple personas | Create at least 2 personas first |
| `MISSING_REQUIRED_FIELDS` | 400 | Request body missing required fields | Check API documentation for required parameters |
| `INVALID_PARAMETERS` | 400 | Parameter validation failed | Review parameter constraints |
| `OPENAI_API_ERROR` | 500 | OpenAI API request failed | Temporary issue, retry after delay |
| `DATABASE_ERROR` | 500 | Database operation failed | Contact support if persists |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Contact support with request ID |

### Client-Side Error Handling Example

```typescript
try {
  const response = await fetch("/functions/v1/detect-personas", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ minClusters: 2, maxClusters: 5 })
  });

  const data = await response.json();

  if (!response.ok) {
    switch (data.error.code) {
      case "INSUFFICIENT_DATA":
        toast.error("최소 3개 이상의 행복한 직업을 추가해주세요");
        break;
      case "OPENAI_API_ERROR":
        toast.error("AI 분석 실패. 잠시 후 다시 시도해주세요");
        break;
      default:
        toast.error("오류가 발생했습니다: " + data.error.message);
    }
    return;
  }

  // Success handling
  console.log(`${data.personasCount}개의 페르소나가 생성되었습니다`);
} catch (error) {
  // Network error
  toast.error("네트워크 오류가 발생했습니다");
}
```

---

## Rate Limits & Quotas

### Edge Function Limits

| Function | Concurrency | Timeout | Recommended Frequency |
|----------|-------------|---------|----------------------|
| detect-personas | 1 per user | 120s | Once per major change |
| analyze-persona-relationships | 1 per user | 120s | Once per 30 seconds |

### OpenAI API Limits

**Text Embeddings** (text-embedding-3-small):
- Rate: 3,000 requests/minute (shared across all users)
- Cost: $0.00002 per 1K tokens
- Average usage: ~100 tokens per happy job

**Chat Completions** (GPT-4):
- Rate: 500 requests/minute (shared across all users)
- Cost: $0.03 per 1K input tokens, $0.06 per 1K output tokens
- Average usage per persona: ~300 input tokens, ~150 output tokens

### Database Quotas

**Supabase Free Tier**:
- Database size: 500 MB
- Realtime connections: 200 concurrent
- Edge Function invocations: 500K per month
- Storage: 1 GB

**Estimated Usage per User**:
- Personas: ~10 KB per user (5 personas)
- Milestones: ~5 KB per user (20 milestones)
- Growth metrics: ~1 KB per measurement
- Relationships: ~5 KB per user (10 relationships)

**Capacity Estimate**: Free tier supports ~20,000 active users with moderate usage.

---

## Examples & Usage

### Example 1: Complete Persona Detection Flow

```typescript
import { supabase } from "@/integrations/supabase/client";

async function detectAndDisplayPersonas() {
  try {
    // 1. Check if user has enough happy jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("happy_jobs")
      .select("id")
      .eq("user_id", user.id);

    if (jobs.length < 3) {
      toast.error("최소 3개의 행복한 직업을 추가해주세요");
      return;
    }

    // 2. Trigger persona detection
    toast.info("AI가 페르소나를 분석하고 있습니다...");

    const { data, error } = await supabase.functions.invoke("detect-personas", {
      body: { minClusters: 2, maxClusters: 5 }
    });

    if (error) throw error;

    // 3. Display results
    toast.success(`${data.personasCount}개의 페르소나가 발견되었습니다!`);

    // 4. Navigate to personas page
    navigate("/personas");

  } catch (error) {
    console.error("Persona detection error:", error);
    toast.error("페르소나 분석 중 오류가 발생했습니다");
  }
}
```

### Example 2: Relationship Analysis with Loading State

```typescript
import { usePersonaRelationships, useAnalyzePersonaRelationships } from "@/hooks/usePersonas";

function RelationshipAnalysisButton() {
  const { data: relationships } = usePersonaRelationships();
  const { mutate: analyze, isPending } = useAnalyzePersonaRelationships();

  const handleAnalyze = () => {
    analyze(undefined, {
      onSuccess: (data) => {
        toast.success(`${data.relationshipsCount}개의 관계가 분석되었습니다`);
      },
      onError: (error) => {
        toast.error("관계 분석 실패: " + error.message);
      }
    });
  };

  return (
    <Button onClick={handleAnalyze} disabled={isPending}>
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          분석 중...
        </>
      ) : (
        "페르소나 관계 분석"
      )}
    </Button>
  );
}
```

### Example 3: Realtime Milestone Updates

```typescript
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function useRealtimeMilestones(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("milestone-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "persona_milestones",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log("Milestone changed:", payload);

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({
            queryKey: ["persona-milestones"]
          });

          // Optional: Show toast for completed milestones
          if (payload.eventType === "UPDATE" && payload.new.is_completed) {
            toast.success(`마일스톤 완료: ${payload.new.title}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
```

### Example 4: Growth Tracking with Chart

```typescript
import { useGrowthSummary } from "@/hooks/usePersonas";
import { Line } from "react-chartjs-2";

function GrowthChart({ personaId }: { personaId: string }) {
  const { data: summary } = useGrowthSummary();
  const personaGrowth = summary?.find(s => s.persona_id === personaId);

  if (!personaGrowth) return <p>데이터 없음</p>;

  const chartData = {
    labels: ["이전", "현재"],
    datasets: [{
      label: "강도",
      data: [personaGrowth.previous_strength, personaGrowth.current_strength],
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1
    }]
  };

  return (
    <div>
      <h3>성장 추이</h3>
      <Line data={chartData} />
      <p>변화: {personaGrowth.change > 0 ? "+" : ""}{personaGrowth.change.toFixed(1)}%</p>
    </div>
  );
}
```

---

## Appendix: Database Schema Reference

### persona_profiles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Persona unique identifier |
| user_id | uuid | FK, NOT NULL | Owner user ID |
| persona_name | text | NOT NULL | Persona name |
| persona_archetype | text | - | One of 8 archetypes |
| theme_description | text | - | AI-generated theme |
| color_hex | text | NOT NULL | Brand color |
| strength_score | numeric | DEFAULT 0 | Strength (0-100) |
| rank_order | integer | DEFAULT 0 | Display order |
| is_active | boolean | DEFAULT true | Active status |

### persona_milestones

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Milestone ID |
| user_id | uuid | FK, NOT NULL | Owner user ID |
| persona_id | uuid | FK, NOT NULL | Associated persona |
| title | text | NOT NULL | Milestone title |
| description | text | - | Optional description |
| is_completed | boolean | DEFAULT false | Completion status |
| completed_at | timestamptz | - | Completion timestamp |
| target_date | timestamptz | - | Target completion date |
| milestone_type | text | CHECK | ikigai/branding/content/community/custom |
| sort_order | integer | DEFAULT 0 | Display order |

### persona_relationships

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Relationship ID |
| user_id | uuid | FK, NOT NULL | Owner user ID |
| persona1_id | uuid | FK, NOT NULL | First persona (lower UUID) |
| persona2_id | uuid | FK, NOT NULL | Second persona (higher UUID) |
| relationship_type | text | CHECK | synergy/neutral/conflict |
| strength | numeric | CHECK 0-1 | Relationship strength |
| description | text | - | Korean description |
| ai_insights | jsonb | - | AI analysis data |

### persona_branding_strategies

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Strategy ID |
| user_id | uuid | FK, NOT NULL, UNIQUE | Owner user ID |
| strategy_type | text | CHECK, NOT NULL | unified/hybrid/separated |
| custom_notes | text | - | User's notes |

### persona_growth_metrics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Metric ID |
| user_id | uuid | FK, NOT NULL | Owner user ID |
| persona_id | uuid | FK, NOT NULL | Associated persona |
| strength_value | numeric | CHECK 0-100 | Measured strength |
| measured_at | timestamptz | DEFAULT now() | Measurement time |
| metric_source | text | - | Source of measurement |

---

## Support & Contact

For questions or issues with these APIs:
- GitHub Issues: https://github.com/your-repo/priper/issues
- Email: support@priper.io
- Documentation: https://docs.priper.io

**Version**: 1.0.0
**Last Updated**: 2025-11-24
