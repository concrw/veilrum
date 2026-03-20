# 빠른 배포 가이드

## 현재 상태
- ✅ GitHub 저장소 생성됨: https://github.com/concrw/PRIPER
- ✅ Git 커밋 완료 (2개 커밋)
- ⚠️ Git 푸시 문제 발생 (인증 이슈)
- ✅ Vercel 계정: vercel.com/divemind

---

## 🚀 빠른 배포 (웹 브라우저 사용)

### 1️⃣ GitHub에 코드 업로드 (수동)

인증 문제로 CLI 푸시가 안 되므로, 웹 UI로 업로드합니다:

**방법 A: GitHub Desktop 사용 (권장)**
1. GitHub Desktop 다운로드: https://desktop.github.com/
2. File → Add Local Repository → `/Users/brandactivist/Desktop/PRIPER` 선택
3. Repository → Repository Settings → concrw/PRIPER 연결
4. "Publish branch" 클릭

**방법 B: ZIP 파일 업로드**
1. https://github.com/concrw/PRIPER 접속
2. "uploading an existing file" 링크 클릭
3. 프로젝트 파일들을 드래그 앤 드롭

**방법 C: SSH 키 설정 후 푸시 (기술적)**
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub Settings → SSH Keys에 추가
# https://github.com/settings/keys

# SSH로 푸시
git remote set-url origin git@github.com:concrw/PRIPER.git
git push -u origin main
```

**방법 D: Personal Access Token 사용**
```bash
# GitHub Settings → Developer settings → Personal access tokens → Generate new token
# https://github.com/settings/tokens/new
# Scopes: repo (전체) 선택

# 토큰으로 푸시
git remote set-url origin https://YOUR_TOKEN@github.com/concrw/PRIPER.git
git push -u origin main
```

---

### 2️⃣ Vercel 배포 (5분)

#### 단계별 진행:

1. **Vercel 접속**
   - https://vercel.com/divemind 접속
   - "Add New..." → "Project" 클릭

2. **GitHub 연동**
   - "Import Git Repository" 선택
   - "Connect GitHub Account" (처음이면)
   - concrw/PRIPER 저장소 찾기
   - "Import" 클릭

3. **프로젝트 설정**
   ```
   Project Name: PRIPER (또는 원하는 이름)
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **환경 변수 추가**

   "Environment Variables" 섹션에서 아래 3개 변수 추가:

   **변수 1:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://ggzwvjyioqkljbnzupaj.supabase.co
   ```

   **변수 2:**
   ```
   Name: VITE_SUPABASE_PUBLISHABLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnend2anlpb3FrbGpibnp1cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTk0NzQsImV4cCI6MjA3MDM5NTQ3NH0.M6wd9MTDvNdz622n4ASYjdwvro3wNY1eDg_YxmjUDLQ
   ```

   **변수 3:**
   ```
   Name: VITE_SUPABASE_PROJECT_ID
   Value: ggzwvjyioqkljbnzupaj
   ```

   ⚠️ 각 변수마다 **Production**, **Preview**, **Development** 모두 체크!

5. **배포 시작**
   - "Deploy" 버튼 클릭
   - 2-3분 대기 (빌드 진행)
   - 성공하면 배포 URL 생성됨

6. **배포 URL 확인**
   - `https://priper-xxxx.vercel.app` 형식으로 생성
   - 사이트 접속하여 정상 작동 확인

---

### 3️⃣ Supabase 설정 (20분)

GitHub 푸시 완료 후 Supabase 백엔드 설정이 필요합니다.

#### 필수 준비물:
1. **Supabase Access Token**
   - https://supabase.com/dashboard/account/tokens
   - "Generate new token" 클릭
   - Name: `PRIPER_DEPLOYMENT`
   - 토큰 복사 (한 번만 보임!)

2. **OpenAI API Key**
   - https://platform.openai.com/api-keys
   - "Create new secret key" 클릭
   - Name: `PRIPER`
   - 키 복사

#### Supabase 배포 명령어:

```bash
# 1. Supabase CLI 로그인
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
npx supabase link --project-ref ggzwvjyioqkljbnzupaj

# 2. 데이터베이스 마이그레이션 적용 (16개)
npx supabase db push

# 3. Edge Functions 환경 변수 설정
# Supabase Dashboard 접속:
# https://supabase.com/dashboard/project/ggzwvjyioqkljbnzupaj/settings/functions
# "Add new secret" 클릭하여 추가:

OPENAI_API_KEY=sk-proj-your_key_here

# (선택) 이메일 기능 사용 시:
RESEND_API_KEY=re_your_key_here

# (선택) 결제 기능 사용 시:
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# 4. Edge Functions 배포 (11개)
npx supabase functions deploy
```

---

## ✅ 배포 완료 체크리스트

### 프론트엔드 (Vercel)
- [ ] GitHub에 코드 업로드 완료
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 3개 추가
- [ ] 배포 성공 (초록색 체크)
- [ ] 배포 URL 접속 확인
- [ ] 로그인 페이지 정상 작동

### 백엔드 (Supabase)
- [ ] Access Token 발급
- [ ] Supabase 프로젝트 연결
- [ ] 16개 마이그레이션 적용
- [ ] OpenAI API Key 설정
- [ ] 11개 Edge Functions 배포
- [ ] WHY 분석 기능 테스트

---

## 🔍 트러블슈팅

### GitHub 푸시 실패
**현상**: `Repository not found` 오류
**해결**:
1. GitHub Desktop 사용 (가장 쉬움)
2. SSH 키 설정
3. Personal Access Token 생성

### Vercel 빌드 실패
**현상**: `Build failed` 오류
**해결**:
1. 로컬에서 `npm run build` 테스트
2. `node_modules` 삭제 후 재설치
3. 환경 변수 확인 (VITE_ 접두사)

### Supabase 연결 실패
**현상**: `Failed to connect to Supabase`
**해결**:
1. `.env` 파일의 Supabase URL 확인
2. RLS (Row Level Security) 정책 확인
3. Supabase 프로젝트 상태 확인

---

## 📊 다음 단계 (배포 후)

### 1. PWA 아이콘 생성
```bash
# public/ 폴더에 아이콘 추가
# - icon-192x192.png
# - icon-512x512.png
# - apple-touch-icon.png
```

### 2. Stripe 설정 (결제 기능 사용 시)
- Stripe 제품 생성 (Pro ₩9,900, Elite ₩29,000)
- Price ID를 `src/hooks/useSubscription.ts`에 업데이트
- Webhook 엔드포인트 설정

### 3. 도메인 연결 (선택)
- Vercel에서 커스텀 도메인 추가
- DNS 레코드 설정
- SSL 인증서 자동 발급

### 4. 모니터링 설정
- Vercel Analytics 활성화
- Supabase Logs 확인
- 사용자 피드백 수집

---

## 📞 도움이 필요하면

- **GitHub 이슈**: 저장소 접근 문제
- **Vercel 문서**: https://vercel.com/docs
- **Supabase 문서**: https://supabase.com/docs

---

**현재 위치**: `/Users/brandactivist/Desktop/PRIPER`
**GitHub**: https://github.com/concrw/PRIPER
**Vercel**: https://vercel.com/divemind
**Supabase**: https://supabase.com/dashboard/project/ggzwvjyioqkljbnzupaj
