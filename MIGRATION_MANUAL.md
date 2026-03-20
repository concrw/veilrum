# Supabase 마이그레이션 수동 적용 가이드

## 현재 상황
- CLI로 마이그레이션 적용 시 PostgreSQL 버전 호환성 문제 발생
- 일부 테이블이 이미 존재하여 중복 생성 오류 발생
- **해결 방법**: Supabase Dashboard SQL Editor에서 직접 실행

---

## 📝 마이그레이션 적용 방법

### 1. Supabase Dashboard SQL Editor 접속
https://supabase.com/dashboard/project/ggzwvjyioqkljbnzupaj/sql

### 2. 마이그레이션 파일 순서대로 실행

아래 파일들을 순서대로 복사하여 SQL Editor에 붙여넣고 "Run" 클릭:

#### 기본 테이블 (1-8)
1. `supabase/migrations/20250811040237_074fc33f-2013-42bc-a933-38ff26a8b0bf.sql`
2. `supabase/migrations/20250811040318_9c1c85e5-b638-49d7-9e0b-cd2be23f12d1.sql`
3. `supabase/migrations/20250811070336_48ab6a1d-d40b-498f-bce0-b0db2c5157b0.sql`
4. `supabase/migrations/20250811070600_868bad5f-f789-4ce6-a08a-8e49282bba4d.sql`
5. `supabase/migrations/20250811091018_9e547195-0937-45e1-9225-d53c4de3d0e6.sql`
6. `supabase/migrations/20250811092019_2a7fffe3-9dcd-400b-b6e7-2488647d2a20.sql`
7. `supabase/migrations/20250811094235_f262c2ca-27f5-45de-b4d5-5ffc34c04487.sql`
8. `supabase/migrations/20250812000850_aa7f64b0-8759-4f80-8ac5-efb6c9cc65c1.sql`

#### 고급 기능 (9-13)
9. `supabase/migrations/20251123000000_multi_persona_tables.sql`
10. `supabase/migrations/20251124000000_persona_advanced_features.sql`
11. `supabase/migrations/20251127000000_group_posts_and_activities.sql`
12. `supabase/migrations/20251128000000_notifications_system.sql`
13. `supabase/migrations/20251129000000_chat_system.sql`

#### 성능 및 추가 기능 (14-17)
14. `supabase/migrations/20251202000000_performance_optimization.sql` - **29개 인덱스**
15. `supabase/migrations/20251202010000_analytics_tracking.sql` - 분석 추적
16. `supabase/migrations/20251202020000_stripe_subscriptions.sql` - 결제 시스템
17. `supabase/migrations/20241230_push_subscriptions.sql` - 푸시 알림 (수정됨)

---

## ⚠️ 중복 오류 발생 시

만약 "already exists" 오류가 발생하면:

### 방법 1: 오류 무시하고 계속 진행
- 테이블이 이미 존재하면 스킵됨
- 다음 마이그레이션으로 진행

### 방법 2: 기존 테이블 확인
```sql
-- 존재하는 테이블 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 특정 테이블 삭제 (주의!)
DROP TABLE IF EXISTS table_name CASCADE;
```

### 방법 3: 정책(Policy) 중복 오류
```sql
-- 기존 정책 확인
SELECT policyname FROM pg_policies WHERE tablename = 'your_table_name';

-- 정책 삭제
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

---

## 🔍 마이그레이션 확인

모든 마이그레이션 실행 후 확인:

```sql
-- 1. 테이블 목록 확인
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 3. 인덱스 확인
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. 함수 확인
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
```

---

## 📊 기대되는 테이블 목록 (총 20+개)

### 기본 테이블
- `user_profiles` - 사용자 프로필
- `brainstorm_sessions` - 브레인스토밍 세션
- `brainstorm_answers` - 브레인스토밍 답변
- `why_analyses` - WHY 분석
- `ikigai_analyses` - Ikigai 분석
- `jobs` - 작업 큐

### 페르소나 관련
- `personas` - 페르소나
- `persona_relationships` - 페르소나 관계

### 커뮤니티 관련
- `groups` - 그룹
- `group_members` - 그룹 멤버
- `group_posts` - 그룹 게시글
- `group_activities` - 그룹 활동

### 알림 및 채팅
- `notifications` - 알림
- `chat_rooms` - 채팅방
- `chat_messages` - 채팅 메시지

### 분석 및 결제
- `user_activities` - 사용자 활동
- `conversion_events` - 전환 이벤트
- `ab_experiments` - A/B 테스트
- `ab_assignments` - A/B 할당
- `ab_results` - A/B 결과
- `stripe_customers` - Stripe 고객
- `subscriptions` - 구독
- `payment_history` - 결제 내역
- `push_subscriptions` - 푸시 알림 구독

---

## 🚨 중요 참고사항

### PostgreSQL 버전 확인
```sql
SELECT version();
```

Supabase는 PostgreSQL 15.x를 사용합니다.
- `CREATE POLICY IF NOT EXISTS`는 PostgreSQL 15+에서 지원
- 일부 마이그레이션에서 구문 오류 발생 가능

### 해결책
마이그레이션 파일에서 `IF NOT EXISTS` 구문을 DO 블록으로 감싸기:

```sql
-- 기존
CREATE POLICY IF NOT EXISTS "policy_name" ON table_name ...;

-- 수정
DO $$
BEGIN
  CREATE POLICY "policy_name" ON table_name ...;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
```

---

## ✅ 마이그레이션 완료 체크리스트

- [ ] 1-8번 기본 테이블 생성 완료
- [ ] 9-13번 고급 기능 테이블 생성 완료
- [ ] 14번 성능 인덱스 (29개) 생성 완료
- [ ] 15번 분석 추적 테이블 생성 완료
- [ ] 16번 Stripe 결제 테이블 생성 완료
- [ ] 17번 푸시 알림 테이블 생성 완료
- [ ] 모든 테이블에 RLS 활성화 확인
- [ ] 인덱스 생성 확인
- [ ] SQL 함수 생성 확인

---

## 📞 다음 단계

마이그레이션 완료 후:
1. ✅ Claude API Key 환경변수 설정
2. ✅ Edge Functions 배포
3. ✅ 프론트엔드와 백엔드 연결 테스트

---

## 대안: CLI로 강제 적용 (고급 사용자용)

```bash
# 1. 현재 마이그레이션 상태 확인
export SUPABASE_ACCESS_TOKEN="your_token"
npx supabase migration list

# 2. 특정 마이그레이션만 적용
npx supabase db push --include-seed=false

# 3. 오류 발생 시 마이그레이션 히스토리 수정
npx supabase migration repair --status applied 20251202000000

# 4. 모든 마이그레이션 강제 적용 (위험!)
# 주의: 데이터 손실 가능성 있음
npx supabase db reset --linked
```

---

**권장**: Dashboard SQL Editor 사용이 가장 안전하고 확실합니다.
