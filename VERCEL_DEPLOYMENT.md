# Vercel 배포 가이드 (divemind 팀)

## 📋 현재 상태
- ✅ Git 커밋 완료 (245465d)
- ✅ Vercel 계정: vercel.com/divemind
- ✅ Vercel 팀 ID: team_t5PHIKtzQZyZgTd7w9t6AILa
- ⏳ GitHub 저장소: 생성 필요

---

## 🚀 배포 단계

### 1단계: GitHub 저장소 생성

#### 방법 A: GitHub 웹사이트에서 생성 (권장)
1. https://github.com/new 접속
2. 저장소 설정:
   - Repository name: `PRIPER` (또는 원하는 이름)
   - Description: `Prime Perspective 기반 자기분석 플랫폼`
   - Visibility: `Private` (권장)
   - ⚠️ **중요**: "Initialize this repository" 체크박스 모두 해제
     - ❌ Add a README file (체크 해제)
     - ❌ Add .gitignore (체크 해제)
     - ❌ Choose a license (체크 해제)
3. "Create repository" 클릭
4. 생성된 저장소 URL 복사 (예: `https://github.com/divemind/PRIPER.git`)

#### 방법 B: GitHub CLI로 생성 (선택)
```bash
# GitHub CLI 설치 확인
gh --version

# 로그인 (필요시)
gh auth login

# 저장소 생성 (비공개)
gh repo create PRIPER --private --source=. --remote=origin --push
```

### 2단계: Git Remote 연결 및 푸시

#### GitHub 웹사이트에서 생성한 경우:
```bash
# Remote 추가 (저장소 URL은 1단계에서 복사한 URL 사용)
git remote add origin https://github.com/YOUR_USERNAME/PRIPER.git

# 푸시
git push -u origin main
```

#### GitHub CLI로 생성한 경우:
- 자동으로 푸시되므로 추가 작업 불필요

### 3단계: Vercel 프로젝트 생성

#### 방법 A: Vercel 대시보드 (권장)
1. https://vercel.com/divemind 접속
2. "Add New..." → "Project" 클릭
3. "Import Git Repository" 섹션에서 GitHub 연결
   - "Connect Git Provider" 클릭 (처음이면)
   - GitHub 계정 인증
4. PRIPER 저장소 찾기 → "Import" 클릭
5. 프로젝트 설정:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

6. **환경 변수 추가** (Environment Variables 섹션):
   ```
   VITE_SUPABASE_URL=https://ggzwvjyioqkljbnzupaj.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnend2anlpb3FrbGpibnp1cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTk0NzQsImV4cCI6MjA3MDM5NTQ3NH0.M6wd9MTDvNdz622n4ASYjdwvro3wNY1eDg_YxmjUDLQ
   VITE_SUPABASE_PROJECT_ID=ggzwvjyioqkljbnzupaj
   ```

   ⚠️ 각 환경변수를 Production, Preview, Development 모두 체크

7. "Deploy" 클릭

#### 방법 B: Vercel CLI (선택)
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod

# 팀 지정하여 배포
vercel --prod --scope=team_t5PHIKtzQZyZgTd7w9t6AILa

# 환경변수는 대화형으로 입력하거나, vercel.json 사용
```

---

## 📁 vercel.json 설정 (선택사항)

프로젝트 루트에 `vercel.json` 파일을 생성하여 더 세밀한 설정 가능:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

---

## 🎯 배포 후 확인사항

### 자동으로 생성되는 URL
- Production: `https://priper-xxx.vercel.app`
- Preview: 각 PR마다 고유 URL 생성

### 확인할 것들
1. **빌드 성공 여부**
   - Vercel 대시보드에서 "Deployments" 탭 확인
   - 초록색 체크마크 확인

2. **사이트 접속**
   - Production URL 접속
   - 로그인/회원가입 테스트
   - WHY 분석 페이지 접속 테스트

3. **PWA 기능**
   - 모바일에서 "홈 화면에 추가" 가능한지 확인
   - 개발자 도구 → Application → Service Workers 확인

4. **환경 변수 확인**
   - 브라우저 콘솔에서 Supabase 연결 오류 없는지 확인
   - Network 탭에서 API 요청 확인

---

## 🔧 트러블슈팅

### 빌드 실패
```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 환경 변수 오류
- Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
- 변수명 오타 확인 (VITE_ 접두사 필수)
- 모든 환경(Production, Preview, Development) 체크 확인

### SPA 라우팅 오류 (404)
- vercel.json의 rewrites 설정 확인
- 또는 Vercel 대시보드에서 자동 SPA fallback 활성화

### Service Worker 오류
- HTTPS 환경에서만 작동 (Vercel은 자동 HTTPS)
- `/sw.js` 경로가 올바른지 확인
- 헤더 설정 확인 (vercel.json)

---

## 🌐 커스텀 도메인 연결 (선택)

### Vercel에서 도메인 추가
1. Vercel 프로젝트 → Settings → Domains
2. 도메인 입력 (예: priper.com)
3. DNS 레코드 설정:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. SSL 인증서 자동 발급 (Let's Encrypt)

---

## 📊 예상 배포 시간

- GitHub 저장소 생성: 2분
- Git 푸시: 1분
- Vercel 연결 및 설정: 3분
- 첫 배포 (빌드): 2-3분
- **총 소요 시간**: 8-10분

---

## ✅ 배포 완료 체크리스트

- [ ] GitHub 저장소 생성
- [ ] Git remote 연결
- [ ] Git push 완료
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (3개)
- [ ] 첫 배포 성공
- [ ] Production URL 접속 확인
- [ ] 로그인 기능 테스트
- [ ] PWA 설치 테스트
- [ ] 모바일 반응형 확인

---

## 🔄 이후 업데이트 방법

```bash
# 코드 수정 후
git add .
git commit -m "fix: 버그 수정"
git push

# Vercel이 자동으로 감지하여 재배포 (30초~1분 소요)
```

---

## 📞 다음 단계: Supabase 설정

프론트엔드 배포 후 진행할 작업:
1. ✅ Supabase Access Token 발급
2. ✅ Supabase 마이그레이션 적용 (16개)
3. ✅ Edge Functions 배포 (11개)
4. ✅ API Keys 설정 (OpenAI, Resend, Stripe)

자세한 내용은 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 참조
