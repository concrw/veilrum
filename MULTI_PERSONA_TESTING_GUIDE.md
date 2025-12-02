# 멀티 페르소나 기능 테스팅 가이드

## 목차
1. [사전 준비](#사전-준비)
2. [Phase 1: 페르소나 감지 테스트](#phase-1-페르소나-감지-테스트)
3. [Phase 2: UI 컴포넌트 테스트](#phase-2-ui-컴포넌트-테스트)
4. [Phase 3: 고급 기능 테스트](#phase-3-고급-기능-테스트)
5. [Phase 4: 데이터베이스 통합 테스트](#phase-4-데이터베이스-통합-테스트)
6. [Phase 5: 자동화 및 Realtime 테스트](#phase-5-자동화-및-realtime-테스트)
7. [통합 시나리오 테스트](#통합-시나리오-테스트)
8. [성능 테스트](#성능-테스트)
9. [보안 테스트](#보안-테스트)

---

## 사전 준비

### 환경 설정
```bash
# 환경 변수 확인
OPENAI_API_KEY=sk-...  # Edge Functions에서 AI 분석 사용
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

### 데이터베이스 마이그레이션 실행
```bash
# Supabase CLI로 마이그레이션 적용
supabase db push

# 또는 Supabase Dashboard에서 SQL 실행
# 1. supabase/migrations/20251123000000_multi_persona_tables.sql
# 2. supabase/migrations/20251124000000_persona_advanced_features.sql
```

### 테스트 사용자 생성
```sql
-- 테스트용 사용자 3명 생성
-- User 1: 단일 페르소나 (무료 티어)
-- User 2: 2개 페르소나 (Pro 티어)
-- User 3: 3개 이상 페르소나 (Elite 티어)
```

---

## Phase 1: 페르소나 감지 테스트

### 1.1 Why 분석 완료 후 자동 감지

**테스트 케이스**: 행복 직업군 입력 후 페르소나 자동 감지

**단계**:
1. 새 사용자로 로그인
2. Why 분석 시작 (`/why`)
3. 10개 이상의 행복 직업군 입력 (다양한 카테고리)
   - 예: 의사, 간호사, 상담사 (케어)
   - 예: 작가, 디자이너, 영화감독 (창작)
   - 예: CEO, 컨설턴트, 투자자 (전략)
4. 세션 완료
5. `PersonaDetectionTrigger` 자동 실행 확인

**예상 결과**:
- ✅ AI 분석 모달 표시 ("페르소나 분석 중...")
- ✅ 2-5개 페르소나 감지 완료
- ✅ 각 페르소나별 이름, 테마, 키워드, Archetype 생성
- ✅ 자동으로 4개 마일스톤 생성 (각 페르소나)

**확인 방법**:
```sql
-- 생성된 페르소나 확인
SELECT * FROM persona_profiles WHERE user_id = '<test_user_id>';

-- 자동 생성된 마일스톤 확인
SELECT * FROM persona_milestones WHERE user_id = '<test_user_id>';
```

### 1.2 Edge Function 직접 호출 테스트

**단계**:
```bash
# Supabase CLI로 Edge Function 테스트
supabase functions invoke detect-personas \
  --data '{"userId": "<test_user_id>"}' \
  --header "Authorization: Bearer <auth_token>"
```

**예상 결과**:
```json
{
  "success": true,
  "personas": [
    {
      "id": "uuid",
      "persona_name": "돕는 나",
      "persona_archetype": "Healer",
      "theme_description": "...",
      "strength_score": 85.5,
      "rank_order": 1
    }
  ],
  "count": 3
}
```

### 1.3 클러스터링 품질 검증

**확인 사항**:
- ✅ Silhouette score > 0.3 (모든 클러스터)
- ✅ 페르소나별 강도 차이가 명확 (15% 이상)
- ✅ 클러스터 간 overlap 최소화
- ✅ 의미 있는 테마 생성 (GPT-4)

---

## Phase 2: UI 컴포넌트 테스트

### 2.1 PersonaPaywall 테스트

**테스트 케이스 1**: Discovery 컨텍스트
- **단계**: Why 분석 완료 → 3개 페르소나 감지 → Paywall 표시
- **예상**: 메인 페르소나 1개 표시, 나머지 2개는 잠금 아이콘

**테스트 케이스 2**: Ikigai 컨텍스트
- **단계**: 서브 페르소나 Ikigai 시도 → Paywall 표시
- **예상**: "이 페르소나의 Ikigai를 보려면 Pro로 업그레이드" 메시지

**테스트 케이스 3**: Branding 컨텍스트
- **단계**: 통합 브랜딩 전략 페이지 접근 → Paywall 표시
- **예상**: "모든 페르소나를 활용한 브랜딩 전략" 설명

### 2.2 Personas 대시보드 테스트

**단계**:
1. `/personas` 접근
2. 메인 페르소나 카드 확인
   - ✅ Archetype 아이콘 및 색상
   - ✅ 강도 점수
   - ✅ 테마 설명
   - ✅ 키워드 (최대 5개)
3. 서브 페르소나 카드 확인
   - 무료: ✅ 잠금 아이콘, "Pro로 업그레이드" 메시지
   - Pro: ✅ 클릭 가능, 상세 정보 표시

### 2.3 PersonaSwitcher 테스트

**단계**:
1. 전역 네비게이션에서 페르소나 선택기 확인
2. 드롭다운 열기
3. 페르소나 전환 시도
   - 무료: ✅ 서브 페르소나 비활성화 (Lock 아이콘)
   - Pro: ✅ 모든 페르소나 선택 가능
4. 페르소나 변경 시 `active_persona_id` 업데이트 확인

**확인 SQL**:
```sql
SELECT active_persona_id FROM profiles WHERE id = '<user_id>';
```

### 2.4 PersonaVerificationFlow 테스트

**테스트 케이스 1**: 정확해요
- **단계**: 페르소나 감지 → 검증 모달 → "정확해요" 클릭
- **예상**: `is_user_verified = true` 업데이트

**테스트 케이스 2**: 수정할래요
- **단계**: 페르소나 감지 → 검증 모달 → "수정할래요" 클릭
- **예상**: 편집 폼 표시 → 이름/설명 수정 → 저장 → `is_user_verified = true`

---

## Phase 3: 고급 기능 테스트

### 3.1 PersonaIkigaiCanvas 테스트

**단계**:
1. `/ikigai?persona=<persona_id>` 접근
2. 페르소나 컨텍스트 헤더 표시 확인
   - ✅ 페르소나 이름, 아이콘, 색상
   - ✅ Archetype, 강도, 키워드
3. Ikigai 4단계 진행
   - ✅ 좋아하는 것 (Why 분석 연동)
   - ✅ 잘하는 것 (스킬 평가)
   - ✅ 세상이 필요한 것
   - ✅ 돈 벌 수 있는 것
4. Ikigai 저장 확인

**확인 SQL**:
```sql
SELECT * FROM persona_ikigai WHERE persona_id = '<persona_id>';
```

### 3.2 UnifiedBrandingStrategy 테스트

**단계**:
1. `/personas/relationships` 접근 → "브랜딩 전략" 탭
2. 페르소나 개요 확인 (메인 + 서브)
3. 3가지 전략 중 선택
   - ✅ Unified: 통합 브랜드
   - ✅ Hybrid: 메인+서브
   - ✅ Separated: 분리 브랜드
4. 각 전략의 장단점, 적합 케이스 확인
5. 전략 노트 작성
6. "전략 저장하기" 클릭

**확인 SQL**:
```sql
SELECT * FROM persona_branding_strategies WHERE user_id = '<user_id>';
```

### 3.3 PersonaRelationshipGraph 테스트

**테스트 케이스 1**: 자동 분석
- **단계**: 페르소나 2개 이상 → `/personas/relationships` 접근
- **예상**: 자동으로 AI 분석 실행 → 관계 카드 표시

**테스트 케이스 2**: 재분석
- **단계**: "재분석" 버튼 클릭
- **예상**: Edge Function 호출 → 최신 관계 데이터 업데이트

**확인 항목**:
- ✅ 시너지 관계 (초록색)
- ✅ 충돌 관계 (주황색)
- ✅ 중립 관계 (파란색)
- ✅ 공통 키워드 표시
- ✅ AI 인사이트 (OpenAI API 키 있을 때)
- ✅ 실행 제안

### 3.4 PersonaGrowthDashboard 테스트

**단계**:
1. `/personas/relationships` → "성장 추적" 탭
2. 페르소나별 성장 카드 확인
   - ✅ 현재 강도
   - ✅ 이전 강도
   - ✅ 변화량 (+/- %)
3. 페르소나 선택 → 마일스톤 탭
4. 마일스톤 클릭하여 완료/미완료 토글
5. 성장 추이 탭 확인
   - ✅ 현재 vs 이전 비교
   - ✅ 변화량 그래프

**확인 SQL**:
```sql
-- 마일스톤 상태 확인
SELECT * FROM persona_milestones WHERE persona_id = '<persona_id>';

-- 성장 요약 확인
SELECT * FROM get_persona_growth_summary('<user_id>');
```

---

## Phase 4: 데이터베이스 통합 테스트

### 4.1 Hooks 테스트

**usePersonas()**:
```typescript
// 모든 페르소나 조회
const { data: personas } = usePersonas();
console.log(personas); // PersonaWithDetails[]
```

**useBrandingStrategy()**:
```typescript
// 브랜딩 전략 조회
const { data: strategy } = useBrandingStrategy();
console.log(strategy); // { strategy_type, custom_notes, ... }
```

**usePersonaMilestones()**:
```typescript
// 페르소나별 마일스톤 조회
const { data: milestones } = usePersonaMilestones(personaId);
console.log(milestones); // Milestone[]
```

**useGrowthSummary()**:
```typescript
// 성장 요약 조회
const { data: summary } = useGrowthSummary();
console.log(summary); // GrowthSummary[]
```

### 4.2 RLS 정책 테스트

**테스트 방법**:
```sql
-- User A로 데이터 삽입
INSERT INTO persona_profiles (user_id, persona_name, ...)
VALUES ('<user_a_id>', 'Test Persona', ...);

-- User B로 조회 시도 (실패해야 함)
-- RLS 정책으로 인해 빈 결과 반환
SELECT * FROM persona_profiles WHERE user_id = '<user_a_id>';
-- Expected: 0 rows
```

**확인 테이블**:
- ✅ `persona_profiles`
- ✅ `persona_milestones`
- ✅ `persona_growth_metrics`
- ✅ `persona_relationships`
- ✅ `persona_branding_strategies`

---

## Phase 5: 자동화 및 Realtime 테스트

### 5.1 자동 마일스톤 생성 테스트

**단계**:
1. 새 사용자로 Why 분석 완료
2. 페르소나 감지 실행
3. `persona_milestones` 테이블 확인

**예상**:
```sql
-- 각 페르소나당 4개 마일스톤 생성
-- 총 마일스톤 수 = 페르소나 수 × 4
SELECT COUNT(*) FROM persona_milestones WHERE user_id = '<user_id>';
-- Expected: 12 (페르소나 3개 × 4)
```

### 5.2 Realtime 구독 테스트

**테스트 케이스 1**: 마일스톤 실시간 동기화
- **단계**:
  1. 브라우저 탭 2개 열기 (같은 사용자)
  2. 탭 1: PersonaGrowthDashboard 열기
  3. 탭 2: 마일스톤 완료 처리
  4. 탭 1에서 자동 업데이트 확인

- **예상**: 탭 1에서 즉시 마일스톤 상태 변경 표시

**테스트 케이스 2**: 성장 지표 실시간 업데이트
- **단계**:
  1. 브라우저 탭 2개 열기
  2. 탭 1: 성장 대시보드
  3. 탭 2: SQL로 `persona_growth_metrics` INSERT
  4. 탭 1에서 자동 업데이트 확인

```sql
-- 탭 2에서 실행
INSERT INTO persona_growth_metrics (user_id, persona_id, strength_score)
VALUES ('<user_id>', '<persona_id>', 90.0);
```

- **예상**: 탭 1에서 성장 지표 즉시 업데이트

### 5.3 자동 관계 분석 테스트

**단계**:
1. 페르소나 2개 생성
2. `/personas/relationships` 접근
3. 자동으로 `analyze-persona-relationships` Edge Function 호출 확인
4. 관계 카드 표시 확인

**확인 SQL**:
```sql
SELECT * FROM persona_relationships WHERE user_id = '<user_id>';
-- Expected: 1 row (페르소나 2개 → 1개 관계)
```

---

## 통합 시나리오 테스트

### 시나리오 1: 신규 사용자 전체 플로우

**단계**:
1. 회원가입 및 로그인
2. Why 분석 시작 (`/why`)
3. 10개 행복 직업군 입력 (다양한 카테고리)
4. 세션 완료
5. **자동**: 페르소나 감지 모달 표시
6. **자동**: 3개 페르소나 생성
7. **자동**: 각 페르소나에 4개 마일스톤 생성
8. 페르소나 검증 모달 → "정확해요" 클릭
9. `/personas` 대시보드 이동
10. 메인 페르소나만 상세 표시, 나머지 잠금
11. 서브 페르소나 클릭 → Paywall 모달
12. (Pro 구독 시뮬레이션: `subscription_tier = 'pro'`)
13. 서브 페르소나 접근 가능
14. `/ikigai?persona=<persona_id>` → 페르소나별 Ikigai 설계
15. `/personas/relationships` → 관계 분석 자동 실행
16. 브랜딩 전략 선택 및 저장
17. 마일스톤 완료 처리
18. 성장 추이 확인

**예상 소요 시간**: 10-15분

### 시나리오 2: 멀티 디바이스 동기화

**단계**:
1. 디바이스 A: 마일스톤 완료 처리
2. 디바이스 B: PersonaGrowthDashboard 열기
3. **예상**: 디바이스 B에서 즉시 완료 상태 표시 (Realtime)

### 시나리오 3: Pro → Elite 업그레이드

**단계**:
1. Pro 사용자 (페르소나 2개 접근 가능)
2. Elite로 업그레이드 (`subscription_tier = 'elite'`)
3. 모든 페르소나 (3-5개) 접근 확인
4. 고급 기능 (관계 분석, 통합 브랜딩) 사용 확인

---

## 성능 테스트

### 페르소나 감지 성능

**목표**: 10개 직업군 → 3개 페르소나 감지 < 30초

**측정 방법**:
```typescript
const start = Date.now();
await detectPersonas();
const duration = Date.now() - start;
console.log(`Persona detection: ${duration}ms`);
```

**병목 지점**:
- OpenAI Embeddings API 호출: ~10초
- K-means 클러스터링: ~1초
- GPT-4 테마 생성: ~10초

### 관계 분석 성능

**목표**: 3개 페르소나 관계 분석 < 20초

**측정 방법**:
```typescript
const start = Date.now();
await analyzePersonaRelationships();
const duration = Date.now() - start;
console.log(`Relationship analysis: ${duration}ms`);
```

### Realtime 지연 시간

**목표**: 마일스톤 변경 → UI 업데이트 < 1초

**측정 방법**:
```typescript
const start = Date.now();
toggleMilestone(id, true);
// Realtime event 수신 시간 측정
```

---

## 보안 테스트

### RLS 우회 시도

**테스트**:
```sql
-- User A의 데이터를 User B가 직접 조회 시도
SET request.jwt.claim.sub = '<user_b_id>';
SELECT * FROM persona_profiles WHERE user_id = '<user_a_id>';
-- Expected: 0 rows (RLS 차단)
```

### Edge Function 인증 테스트

**테스트**:
```bash
# Authorization 헤더 없이 호출
curl -X POST https://...supabase.co/functions/v1/detect-personas \
  -d '{"userId": "test"}' \
  -H "Content-Type: application/json"
# Expected: 401 Unauthorized
```

### SQL Injection 테스트

**테스트**:
```typescript
// Malicious input
const personaId = "'; DROP TABLE persona_profiles; --";
await usePersonaMilestones(personaId);
// Expected: Parameterized query로 안전하게 처리
```

---

## 체크리스트

### 기능 테스트
- [ ] 페르소나 자동 감지 (10개 직업군 → 2-5개 페르소나)
- [ ] 자동 마일스톤 생성 (각 페르소나 4개)
- [ ] 페르소나 검증 플로우 (정확해요/수정할래요)
- [ ] Paywall 동작 (무료 vs Pro)
- [ ] 페르소나별 Ikigai 설계
- [ ] 통합 브랜딩 전략 (3가지 선택)
- [ ] 관계 분석 (자동 + 재분석)
- [ ] 성장 대시보드 (마일스톤 + 추이)
- [ ] Realtime 동기화 (마일스톤, 성장 지표)

### 데이터베이스 테스트
- [ ] 모든 테이블 생성 확인
- [ ] RLS 정책 적용 확인
- [ ] 인덱스 생성 확인
- [ ] SQL 함수 동작 확인

### 보안 테스트
- [ ] RLS 우회 불가 확인
- [ ] Edge Function 인증 확인
- [ ] Subscription tier 접근 제어 확인

### 성능 테스트
- [ ] 페르소나 감지 < 30초
- [ ] 관계 분석 < 20초
- [ ] Realtime 업데이트 < 1초

---

## 버그 리포트 템플릿

```markdown
### 버그 설명
[버그에 대한 간단한 설명]

### 재현 단계
1. [첫 번째 단계]
2. [두 번째 단계]
3. ...

### 예상 동작
[예상했던 동작]

### 실제 동작
[실제로 발생한 동작]

### 환경
- 브라우저:
- OS:
- User ID:
- Persona ID:

### 스크린샷/로그
[관련 스크린샷 또는 콘솔 로그]
```

---

## 테스트 완료 기준

✅ 모든 기능 테스트 통과
✅ RLS 정책 검증 완료
✅ 성능 목표 달성
✅ 보안 테스트 통과
✅ 크로스 브라우저 테스트 완료 (Chrome, Safari, Firefox)
✅ 모바일 반응형 테스트 완료

**테스트 승인**: [담당자 이름]
**테스트 일자**: 2024-11-24
