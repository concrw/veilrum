# 배포에 필요한 토큰 및 키 목록

## ✅ 이미 설정된 키 (프로젝트에 포함됨)

### 1. Supabase Anon Key (공개 키)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnend2anlpb3FrbGpibnp1cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTk0NzQsImV4cCI6MjA3MDM5NTQ3NH0.M6wd9MTDvNdz622n4ASYjdwvro3wNY1eDg_YxmjUDLQ
```
- **용도**: 프론트엔드에서 Supabase API 호출
- **위치**: `.env` 파일의 `VITE_SUPABASE_PUBLISHABLE_KEY`
- **상태**: ✅ 설정 완료

### 2. Supabase URL
```
https://ggzwvjyioqkljbnzupaj.supabase.co
```
- **용도**: Supabase API 엔드포인트
- **위치**: `.env` 파일의 `VITE_SUPABASE_URL`
- **상태**: ✅ 설정 완료

### 3. Supabase Project ID
```
ggzwvjyioqkljbnzupaj
```
- **용도**: 프로젝트 식별
- **위치**: `.env` 파일의 `VITE_SUPABASE_PROJECT_ID`
- **상태**: ✅ 설정 완료

---

## ⚠️ 발급 필요한 키 (수동 설정 필요)

### 4. Supabase Access Token (CLI 배포용)
- **발급 위치**: https://supabase.com/dashboard/account/tokens
- **용도**: CLI에서 마이그레이션 및 Edge Functions 배포
- **설정 방법**:
  ```bash
  export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxx"
  npx supabase link --project-ref ggzwvjyioqkljbnzupaj
  ```
- **보안**: 비공개 키, 절대 Git에 커밋하지 말 것

### 5. Supabase Service Role Key (서버용 비밀 키)
- **발급 위치**: https://supabase.com/dashboard/project/ggzwvjyioqkljbnzupaj/settings/api
- **용도**: Edge Functions에서 RLS 우회 작업 (이미 Edge Functions 코드에서 환경변수로 참조 중)
- **설정 위치**: Edge Functions는 자동으로 `SUPABASE_SERVICE_ROLE_KEY` 환경변수 접근 가능
- **보안**: 매우 민감, 절대 프론트엔드에 노출 금지

---

## 🔑 외부 서비스 API 키 (발급 필요)

### 6. OpenAI API Key
- **발급 위치**: https://platform.openai.com/api-keys
- **용도**: AI 분석 기능 (WHY 분석, Ikigai 생성, 페르소나 탐지 등)
- **설정 위치**: Supabase Dashboard → Settings → Edge Functions → Secrets
  ```
  OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
  ```
- **비용**: 사용량 기반 과금 (GPT-4o 사용)
- **예상 비용**: 분석 1회당 약 $0.01-0.05

### 7. Resend API Key (이메일 발송)
- **발급 위치**: https://resend.com/api-keys
- **용도**: 이메일 알림 발송 (환영, 분석 완료, 매칭 요청, 매칭 수락)
- **설정 위치**: Supabase Dashboard → Settings → Edge Functions → Secrets
  ```
  RESEND_API_KEY=re_xxxxxxxxxxxxx
  ```
- **비용**: 월 3,000통 무료, 이후 $1/1,000통
- **필수 설정**: 도메인 인증 필요 (발송자 이메일 설정)

### 8. Stripe Secret Key (결제 처리)
- **발급 위치**: https://dashboard.stripe.com/apikeys
- **용도**: 구독 결제 처리
- **설정 위치**: Supabase Dashboard → Settings → Edge Functions → Secrets
  ```
  STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx (테스트)
  STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx (프로덕션)
  ```
- **보안**: 절대 프론트엔드에 노출 금지
- **수수료**: 거래당 2.9% + ₩30

### 9. Stripe Webhook Secret
- **발급 위치**: Stripe Dashboard → Developers → Webhooks
- **용도**: Stripe 이벤트 보안 검증
- **발급 방법**:
  1. Webhook 엔드포인트 생성:
     ```
     https://ggzwvjyioqkljbnzupaj.supabase.co/functions/v1/stripe-webhook
     ```
  2. 이벤트 선택:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
  3. Signing Secret 복사 (whsec_xxxxx)
- **설정 위치**: Supabase Dashboard → Settings → Edge Functions → Secrets
  ```
  STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
  ```

---

## 🎯 Stripe 추가 설정

### 10. Stripe Price IDs (제품 가격 ID)
- **설정 위치**: Stripe Dashboard → Products
- **필요한 제품**:

#### Pro 플랜
  - 이름: PRIPER Pro
  - 설명: 최대 3개 페르소나 분석, 통합 브랜딩 전략
  - 가격: ₩9,900/월
  - 반복 결제: 매월
  - Price ID 예시: `price_1xxxxxxxxxxxxxx`
  - **코드 수정 위치**: [src/hooks/useSubscription.ts:19](src/hooks/useSubscription.ts#L19)
    ```typescript
    priceId: "price_1xxxxxxxxxxxxxx", // 실제 Price ID로 교체
    ```

#### Elite 플랜
  - 이름: PRIPER Elite
  - 설명: 최대 5개 페르소나, AI 컨설팅, 1:1 세션
  - 가격: ₩29,000/월
  - 반복 결제: 매월
  - Price ID 예시: `price_1xxxxxxxxxxxxxx`
  - **코드 수정 위치**: [src/hooks/useSubscription.ts:32](src/hooks/useSubscription.ts#L32)
    ```typescript
    priceId: "price_1xxxxxxxxxxxxxx", // 실제 Price ID로 교체
    ```

---

## 📝 배포 순서 (권장)

### 1단계: 필수 API 키 발급
1. ✅ Supabase Access Token
2. ✅ OpenAI API Key
3. ⚠️  Resend API Key (선택, 이메일 기능 사용 시)
4. ⚠️  Stripe Keys (선택, 결제 기능 사용 시)

### 2단계: Supabase 설정
```bash
# CLI 로그인
export SUPABASE_ACCESS_TOKEN="sbp_xxxxx"
npx supabase link --project-ref ggzwvjyioqkljbnzupaj

# 마이그레이션 적용
npx supabase db push

# Edge Functions 배포
npx supabase functions deploy
```

### 3단계: Supabase Secrets 설정
Dashboard → Settings → Edge Functions → Add new secret:
```
OPENAI_API_KEY=sk-proj-xxxxx
RESEND_API_KEY=re_xxxxx          (선택)
STRIPE_SECRET_KEY=sk_xxxxx       (선택)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (선택)
```

### 4단계: Stripe 제품 생성 및 코드 수정
1. Stripe에서 Pro/Elite 제품 생성
2. Price ID 복사
3. `src/hooks/useSubscription.ts` 수정
4. Git 커밋 및 푸시

### 5단계: 프론트엔드 배포
- Vercel/Netlify에서 GitHub 저장소 연결
- 환경 변수 입력 (이미 .env에 있는 값들)
- Deploy 실행

---

## 🔒 보안 주의사항

### ✅ 공개해도 되는 키
- Supabase Anon Key (VITE_SUPABASE_PUBLISHABLE_KEY)
- Supabase URL
- Supabase Project ID

### ❌ 절대 공개하면 안 되는 키
- Supabase Service Role Key
- Supabase Access Token
- OpenAI API Key
- Resend API Key
- Stripe Secret Key
- Stripe Webhook Secret

### 🛡️ 보안 규칙
1. `.env` 파일은 절대 Git에 커밋하지 않기 (이미 .gitignore에 추가됨)
2. 민감한 키는 Supabase Secrets나 Vercel Environment Variables에만 저장
3. 프론트엔드 코드에는 `VITE_` 접두사가 붙은 공개 키만 사용
4. Edge Functions에서만 민감한 키 사용 (서버 사이드)

---

## 📊 비용 예상 (월간)

### 무료 티어로 시작 가능
- **Supabase**: 무료 (500MB DB, 500,000 Edge Function 호출)
- **Vercel**: 무료 (100GB 대역폭, 무제한 배포)
- **OpenAI**: 사용량 기반 (~$5-20/월, 사용자 100명 기준)
- **Resend**: 무료 (3,000통/월)
- **Stripe**: 무료 (거래 시 수수료만)

### 예상 총 비용
- **초기 단계**: $0-10/월
- **성장 단계** (1,000명 사용자): $50-100/월
- **확장 단계** (10,000명 사용자): $200-500/월

---

## ✅ 체크리스트

- [ ] Supabase Access Token 발급
- [ ] OpenAI API Key 발급 및 설정
- [ ] Supabase 마이그레이션 적용 (16개)
- [ ] Edge Functions 배포 (11개)
- [ ] Resend API Key 발급 (이메일 사용 시)
- [ ] Stripe 계정 설정 (결제 사용 시)
- [ ] Stripe 제품/가격 생성
- [ ] Stripe Webhook 설정
- [ ] Price ID 코드 업데이트
- [ ] GitHub 저장소 생성 및 푸시
- [ ] Vercel/Netlify 배포
- [ ] PWA 아이콘 생성 및 업로드
- [ ] 도메인 연결 (선택)
- [ ] 프로덕션 테스트
