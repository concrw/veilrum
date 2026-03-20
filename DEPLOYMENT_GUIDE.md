# PRIPER 배포 가이드

## 📋 배포 체크리스트

### ✅ 완료된 사항
- [x] 모든 기능 개발 완료 (성능 최적화, UI/UX, PWA, 이메일, 결제)
- [x] 프로덕션 빌드 테스트 완료
- [x] Git 저장소 초기화 및 커밋 완료
- [x] 16개 데이터베이스 마이그레이션 파일 준비
- [x] 11개 Edge Functions 준비

### 🔧 필요한 작업

## 1️⃣ Supabase 배포

### 1.1 Supabase CLI 로그인
```bash
# Supabase 액세스 토큰 발급: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your_access_token_here"

# 프로젝트 연결
npx supabase link --project-ref ggzwvjyioqkljbnzupaj
```

### 1.2 데이터베이스 마이그레이션 적용
```bash
# 모든 마이그레이션 적용
npx supabase db push

# 또는 Supabase Dashboard에서 수동 적용:
# https://supabase.com/dashboard/project/ggzwvjyioqkljbnzupaj/sql
```

적용할 마이그레이션 파일 (16개):
1. `20250811040237_074fc33f-2013-42bc-a933-38ff26a8b0bf.sql`
2. `20250811040318_9c1c85e5-b638-49d7-9e0b-cd2be23f12d1.sql`
3. `20250811070336_48ab6a1d-d40b-498f-bce0-b0db2c5157b0.sql`
4. `20250811070600_868bad5f-f789-4ce6-a08a-8e49282bba4d.sql`
5. `20250811091018_9e547195-0937-45e1-9225-d53c4de3d0e6.sql`
6. `20250811092019_2a7fffe3-9dcd-400b-b6e7-2488647d2a20.sql`
7. `20250811094235_f262c2ca-27f5-45de-b4d5-5ffc34c04487.sql`
8. `20250812000850_aa7f64b0-8759-4f80-8ac5-efb6c9cc65c1.sql`
9. `20251123000000_multi_persona_tables.sql`
10. `20251124000000_persona_advanced_features.sql`
11. `20251127000000_group_posts_and_activities.sql`
12. `20251128000000_notifications_system.sql`
13. `20251129000000_chat_system.sql`
14. `20251202000000_performance_optimization.sql` (29개 인덱스)
15. `20251202010000_analytics_tracking.sql` (분석 추적)
16. `20251202020000_stripe_subscriptions.sql` (결제 시스템)

### 1.3 환경 변수 설정 (Supabase Secrets)

Supabase Dashboard → Settings → Edge Functions → Environment Variables에서 설정:

```bash
# OpenAI API (AI 분석 기능)
OPENAI_API_KEY=sk-...

# Resend (이메일 발송)
RESEND_API_KEY=re_...

# Stripe (결제 시스템)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 1.4 Edge Functions 배포

```bash
# 모든 함수 한번에 배포
npx supabase functions deploy --project-ref ggzwvjyioqkljbnzupaj

# 또는 개별 배포
npx supabase functions deploy analyze-perspective
npx supabase functions deploy generate-ikigai
npx supabase functions deploy analyze-persona-relationships
npx supabase functions deploy detect-personas
npx supabase functions deploy analyze-why-patterns
npx supabase functions deploy generate-brand-strategy
npx supabase functions deploy calculate-compatibility
npx supabase functions deploy recommend-content
npx supabase functions deploy send-email
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

배포할 Edge Functions (11개):
- `analyze-perspective` - WHY 관점 분석
- `generate-ikigai` - Ikigai 생성
- `analyze-persona-relationships` - 페르소나 관계 분석
- `detect-personas` - 페르소나 탐지
- `analyze-why-patterns` - WHY 패턴 분석
- `generate-brand-strategy` - 브랜드 전략 생성
- `calculate-compatibility` - 호환성 계산
- `recommend-content` - 콘텐츠 추천
- `send-email` - 이메일 발송 (4개 템플릿)
- `create-checkout-session` - Stripe 체크아웃 생성
- `stripe-webhook` - Stripe 웹훅 처리

### 1.5 Stripe Webhook 설정

1. Stripe Dashboard → Developers → Webhooks 접속
2. 엔드포인트 추가:
   ```
   https://ggzwvjyioqkljbnzupaj.supabase.co/functions/v1/stripe-webhook
   ```
3. 이벤트 선택:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Webhook Secret을 복사하여 Supabase Environment Variables에 설정

### 1.6 Stripe 제품 및 가격 설정

Stripe Dashboard → Products에서 생성:

**Pro 플랜**
- 이름: PRIPER Pro
- 가격: ₩9,900/월
- Price ID를 복사하여 [useSubscription.ts:19](src/hooks/useSubscription.ts#L19)에 업데이트

**Elite 플랜**
- 이름: PRIPER Elite
- 가격: ₩29,000/월
- Price ID를 복사하여 [useSubscription.ts:32](src/hooks/useSubscription.ts#L32)에 업데이트

## 2️⃣ 프론트엔드 배포 (Vercel/Netlify)

### 2.1 Git Repository 생성

```bash
# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/PRIPER.git
git push -u origin main
```

### 2.2 Vercel 배포 (권장)

1. [Vercel 대시보드](https://vercel.com/new) 접속
2. GitHub 저장소 연결
3. 프로젝트 설정:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 환경 변수 추가:
   ```
   VITE_SUPABASE_URL=https://ggzwvjyioqkljbnzupaj.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnend2anlpb3FrbGpibnp1cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTk0NzQsImV4cCI6MjA3MDM5NTQ3NH0.M6wd9MTDvNdz622n4ASYjdwvro3wNY1eDg_YxmjUDLQ
   VITE_SUPABASE_PROJECT_ID=ggzwvjyioqkljbnzupaj
   ```
5. Deploy 클릭

### 2.3 Netlify 배포 (대안)

1. [Netlify 대시보드](https://app.netlify.com/start) 접속
2. GitHub 저장소 연결
3. Build 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment Variables 추가 (Vercel과 동일)
5. Deploy site 클릭

## 3️⃣ PWA 아이콘 생성

PWA가 제대로 작동하려면 아이콘 파일이 필요합니다:

```bash
# public/ 폴더에 아이콘 추가 필요
# - icon-192x192.png (192x192)
# - icon-512x512.png (512x512)
# - apple-touch-icon.png (180x180)
```

온라인 도구 사용:
- [PWA Asset Generator](https://tools.crawlink.com/tools/pwa-asset-generator/)
- [Favicon Generator](https://realfavicongenerator.net/)

## 4️⃣ 배포 후 확인 사항

### 4.1 기능 테스트
- [ ] 회원가입/로그인
- [ ] WHY 분석 실행
- [ ] Ikigai 설계
- [ ] 페르소나 생성 및 관리
- [ ] 커뮤니티 매칭
- [ ] 채팅 기능
- [ ] 알림 수신
- [ ] 구독 결제 (Stripe)
- [ ] 이메일 수신
- [ ] PWA 설치 (모바일)

### 4.2 성능 확인
```bash
# Lighthouse 점수 확인
npx lighthouse https://your-domain.vercel.app --view
```

목표:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+
- PWA: 체크리스트 통과

### 4.3 데이터베이스 모니터링

Supabase Dashboard → Database → Query Performance에서:
- 느린 쿼리 확인
- 인덱스 사용률 확인
- 연결 풀 상태 확인

## 5️⃣ 도메인 설정 (선택)

### Vercel 도메인 연결
1. Vercel 프로젝트 → Settings → Domains
2. 도메인 추가 및 DNS 레코드 설정

### Supabase 커스텀 도메인
1. Supabase Dashboard → Settings → Custom Domains
2. 서브도메인 설정 (예: api.yourdomain.com)

## 📚 추가 리소스

- [Supabase CLI 문서](https://supabase.com/docs/guides/cli)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Stripe 웹훅 가이드](https://stripe.com/docs/webhooks)
- [PWA 체크리스트](https://web.dev/pwa-checklist/)

## 🆘 트러블슈팅

### Edge Function 배포 실패
```bash
# 로그 확인
npx supabase functions logs <function-name>

# 다시 배포
npx supabase functions deploy <function-name> --no-verify-jwt
```

### 마이그레이션 충돌
```bash
# 현재 적용된 마이그레이션 확인
npx supabase db remote show

# 특정 마이그레이션만 적용
npx supabase db push --include-seed=false
```

### 빌드 실패
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어 후 빌드
npm run build -- --force
```

---

**현재 프로젝트 상태**: 100% 완성, Git 커밋 완료, 배포 준비 완료

**예상 배포 시간**:
- Supabase 설정: 20-30분
- 프론트엔드 배포: 5-10분
- 총 30-40분 소요
