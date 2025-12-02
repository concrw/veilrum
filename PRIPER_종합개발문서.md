# PRIPER 프로젝트 종합 개발 문서

**Prime Perspective 기반 자기분석·브랜드설계·커뮤니티 매칭 플랫폼**

---

**작성일:** 2025년 11월 23일  
**버전:** 1.0  
**상태:** Lovable.dev → Claude Code 이관

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [서비스 철학: Prime Perspective](#2-서비스-철학-prime-perspective)
3. [Why 컨설팅 방법론](#3-why-컨설팅-방법론)
4. [핵심 기능 상세](#4-핵심-기능-상세)
5. [데이터베이스 구조](#5-데이터베이스-구조-supabase)
6. [기술 스택](#6-기술-스택)
7. [구현 현황](#7-구현-현황)
8. [UI/UX 디자인 철학](#8-uiux-디자인-철학)
9. [멀티 페르소나 기능](#9-멀티-페르소나-기능-multi-persona-feature)
10. [다음 단계 개발 계획](#10-다음-단계-개발-계획)
11. [부록](#11-부록)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 배경

PRIPER는 기존의 1:1 Why 컨설팅 방법론을 디지털 플랫폼으로 전환하여, 개인이 자신의 'Why(존재 이유)'를 발견하고 이를 기반으로 퍼스널 브랜드와 비즈니스를 구축할 수 있도록 돕는 통합 플랫폼입니다.

#### 기존 Why 컨설팅의 문제점
- **1:1 진행으로 인한 높은 비용** - 개인 컨설팅은 시간당 수십만 원 소요
- **시간 소요가 많아 확장성 제한** - 한 사람당 2-3시간 이상 필요
- **접근성이 낮아 대중화 어려움** - 예약 대기, 지역 제약

#### PRIPER의 해결책
- **체계적인 디지털 프로세스로 비용 절감** - 10분의 1 수준 가격
- **AI 기반 분석으로 자동화 및 효율성 증대** - 즉시 결과 확인
- **웹/모바일 접근으로 대중화 실현** - 언제 어디서나 가능
- **커뮤니티 기능으로 지속적 성장 지원** - 비슷한 사람들과 연결

### 1.2 비전과 목표

#### 비전
> "AI 시대, 기술이 평준화되면 남는 것은 '내가 누구인가?'와 '누구와 함께하는가?'입니다. PRIPER는 모든 개인이 자신만의 Prime Perspective를 발견하고 이를 기반으로 의미 있는 삶과 브랜드를 만들어가도록 돕습니다."

#### 목표
- 개인의 **행복·가치·경험**을 체계적으로 분석
- **Prime Perspective** 기반 Ikigai 완성
- **브랜드·콘텐츠·커뮤니티·비즈니스** 전략 제시
- **유사한 가치관**을 가진 사람들과의 연결

---

## 2. 서비스 철학: Prime Perspective

### 2.1 Prime Perspective란?

**Prime Perspective**는 _"나를 나답게 만드는 가장 근원적인 관점"_ 을 의미합니다. 

이는 단순한 장점이나 강점이 아니라, 개인의 **행복·고통 패턴**과 그 뿌리가 되는 **각인 순간**, 그리고 **현재의 가치관**이 통합된 핵심 정체성입니다.

### 2.2 핵심 가치

| 가치 | 설명 |
|------|------|
| **진정성 (Authenticity)** | 표면적 자기소개가 아닌 깊은 자기 이해 |
| **일관성 (Consistency)** | 과거 경험과 현재 가치의 연결 |
| **지속가능성 (Sustainability)** | 행복을 느끼며 오래 할 수 있는 일 발견 |
| **연결성 (Connection)** | 비슷한 관점을 가진 사람들과의 커뮤니티 형성 |

---

## 3. Why 컨설팅 방법론

### 3.1 방법론 개요

PRIPER의 Why 분석은 **10단계 프로세스**로 구성되어 있으며, 각 단계는 다음 단계의 기반이 됩니다. 전체 프로세스는 약 **2-3시간** 소요되며, 사용자의 직관과 기억을 최대한 활용합니다.

### 3.2 10단계 프로세스

#### 0단계: 준비 및 세팅
- **목적 안내**: 행복·고통의 패턴과 뿌리 찾기
- **직관과 기억**을 살려 답하는 것의 중요성 강조
- **도구 준비**: 10분 타이머, 입력 UI, 육하원칙 가이드

#### 1단계: 직업 브레인스토밍 (10분)
- **제한 시간**: 정확히 10분 (초과 금지)
- 알고 있는 **모든 직업명** 입력
- 많이 적을수록 좋음 (평균 50-100개)
- 실시간 카운트 표시
- **목적**: 직관적 반응만 수집

```
💡 예시: 의사, 선생님, 프로그래머, 작가, 유튜버, 요리사, 변호사...
```

#### 2단계: 직업 정의 작성
- 각 직업에 대한 **개인적 정의** 작성
- 사전적 정의가 아닌 **개인 인식·경험** 위주
- **데이터 포인트**: 직업별 개인 정의 텍스트

```
예시:
- 의사: "사람들의 고통을 덜어주는 사람"
- 프로그래머: "코드로 문제를 해결하는 창작자"
```

#### 3단계: 각인 순간 기록
- 해당 직업을 **처음 알게 된 순간** 회상
- **육하원칙**으로 구체적 기록:
  - **언제(When)**: 나이, 시기
  - **어디서(Where)**: 장소, 상황
  - **누구와(Who)**: 함께한 사람
  - **무엇을(What)**: 구체적 사건
  - **왜(Why)**: 왜 기억나는지
  - **어떻게(How)**: 어떤 감정이었는지
- **목적**: 직업에 대한 첫 감정·관점·가치의 기원 찾기

```
예시:
의사 - "초등학교 3학년 때, 할머니가 병원에 입원하셔서 
매일 병문안을 갔다. 담당 의사 선생님이 할머니 손을 꼭 잡으며 
'곧 나아지실 거예요'라고 말씀하시던 모습이 따뜻하게 느껴졌다. 
그때 처음으로 의사라는 직업이 단순히 병을 고치는 게 아니라 
마음까지 위로하는 일이라고 생각했다."
```

#### 4단계: 10년 행복/고통/중립 분류
- **질문**: "이 직업만 10년 동안 한다면?"
- **세 그룹**으로 분류:
  - ✅ **행복할 것 같은 직업**
  - ❌ **고통스러울 것 같은 직업**
  - ⚪ **중립** (어디에도 속하지 않음)
- **UI**: 드래그앤드롭 방식

#### 5단계: 이유 작성
- **행복 그룹**: "왜 행복할 것 같은가?"
- **고통 그룹**: "왜 고통스러울 것 같은가?"
- **중립 그룹**: "왜 양쪽 어디에도 속하지 않는가?"
- 각 직업별 **구체적 감정적 이유** 기술

```
예시:
의사 (행복) - "사람들에게 직접적인 도움을 줄 수 있고, 
감사인사를 받을 때마다 보람을 느낄 것 같다."

프로그래머 (고통) - "혼자 모니터만 보며 일하는 게 답답할 것 같고, 
사람들과의 교류가 적어서 외로울 것 같다."
```

#### 6단계: 직접 경험 여부 및 소감
- **실제 해본 경험** 여부 체크
- 경험한 경우: **당시 느낀 점** 자세히 기록
- **목적**: 상상과 실제의 차이 파악

#### 7단계: 1차 분석 (행복/고통의 공통 분모)
- 행복 그룹 내 **반복 키워드/환경/가치** 추출
- 고통 그룹 내 **반복 회피 요인** 추출
- AI 기반 패턴 분석 (키워드 빈도, 감정 점수)
- **결과물**: 행복·고통의 핵심 조건 리스트

```
행복 패턴 예시:
- "사람들과 교류", "직접적인 도움", "창의적 표현", "자율성"

고통 패턴 예시:
- "반복적 업무", "통제당하는 느낌", "고립", "의미 없는 일"
```

#### 8단계: 2차 분석 (각인 순간의 뿌리 연결)
- 행복·고통 패턴과 **각인 순간 데이터 매칭**
- 특정 가치·관점의 **기원** 파악:
  - 어린 시절 경험
  - 롤모델의 영향
  - 사회적·문화적 영향
- **결과물**: "왜 그런 성향이 형성되었는가" 원인 지도

```
예시 연결:
"사람들과 교류" 선호 → 어린 시절 할머니 병문안 경험
→ 의사 선생님의 따뜻한 태도가 각인
→ 사람을 돕는 일에 대한 긍정적 이미지 형성
```

#### 9단계: 가치관·관점 매핑
- 행복/고통 패턴과 **개인 가치관** 비교:
  - 인생관
  - 연애관
  - 사업관
  - 사회관
- **일관성 vs 모순** 분석
- **결과물**: 일관성·모순 포인트 도출

```
일관성 예시:
가치관: "사람들에게 도움이 되는 삶을 살고 싶다"
행복 패턴: "직접적인 도움을 줄 수 있는 일"
→ ✅ 일관성 높음

모순 예시:
가치관: "자유롭게 여행하며 살고 싶다"
행복 패턴: "안정적이고 규칙적인 일상"
→ ⚠️ 모순 발견 → 재검토 필요
```

#### 10단계: Prime Perspective 도출
- 행복 조건 + 가치관 + 각인 순간의 원인을 **통합**
- AI 기반 요약 및 **선언문 생성**
- 형식: "나는 [이런 이유로] [이런 환경에서] 번영한다"
- **결과물**: 개인 Why 선언문 (Prime Perspective)

```
Prime Perspective 예시:
"나는 어린 시절 할머니를 돌보며 배운 '돌봄의 가치'를 
바탕으로, 사람들과 직접 소통하며 그들의 문제를 해결할 수 
있는 환경에서 가장 행복하고 의미있게 일할 수 있다."
```

---

## 4. 핵심 기능 상세

### 4.1 사용자 온보딩

- **프로필 입력**: 이름, 나이, 지역, 직업 여부
- **브랜드 상태 선택**: 없음 / 준비중 / 운영중
- **서비스 목적 선택**: 자기 분석 / 브랜드 설계 / 커뮤니티 매칭
- 간편 소셜 로그인 지원 (향후)

### 4.2 Why 분석 (상세)

#### 직업 브레인스토밍 UI
- **10분 타이머**: 초 단위 카운트다운
- **실시간 직업 개수** 표시
- **Enter 키**로 빠른 입력
- 자동 저장 기능

#### 정의·각인 순간 입력 UI
- 직업 카드별 **펼침/접힘 아코디언**
- 정의 입력 필드 (단문)
- 각인 순간 입력 필드 (장문, 육하원칙 가이드)
- **진행률 표시** (완료/전체)

#### 행복/고통 분류 UI
- **3컬럼 레이아웃** (행복 / 고통 / 중립)
- 직업 카드 **드래그앤드롭**
- 이동 시 **애니메이션 피드백**
- 각 컬럼별 카운트 표시

#### 이유 작성 UI
- 분류별 직업 목록 표시
- 각 직업별 **이유 입력 텍스트 영역**
- 자동 저장 및 진행률 표시

#### 경험 기록 UI
- 경험 여부 **체크박스**
- 경험 시 자동 확장되는 소감 입력 영역
- 경험 직업에 별도 **뱃지 표시**

#### 분석 결과 화면
- **Prime Perspective 카드** (핵심 선언문)
- 행복 패턴 **키워드 클라우드**
- 고통 패턴 **키워드 클라우드**
- **각인 순간 기원 맵**
- 가치관 일관성 vs 모순 **다이어그램**
- **PDF 다운로드** 기능

### 4.3 Ikigai 설계

Ikigai는 **좋아하는 것**, **잘하는 것**, **사회가 필요로 하는 것**, **보상받을 수 있는 것**의 교집합입니다. PRIPER는 Why 분석 결과를 자동으로 연동하여 사용자가 쉽게 Ikigai를 완성할 수 있도록 돕습니다.

#### 하이브리드 구조
- **AI 생성 탭**: Why 분석 기반 자동 Ikigai
- **직접 설계 탭**: 사용자 주도 5단계 설계

#### 직접 설계 5단계 프로세스

**Step 1: 좋아하는 것 (LOVE)**
- Why 분석의 **행복 패턴 자동 로드**
- 수정 및 추가 입력 가능
- 키워드 형태로 정리

**Step 2: 잘하는 것 (GOOD AT)**
- 스킬 추가 UI (이름 + 숙련도 1-5점)
- **슬라이더**로 숙련도 평가
- **3점 이상** 자동으로 '잘하는 것' 분류
- 스킬 **카드 형태**로 표시
- Supabase에 실시간 저장

```
예시:
[글쓰기 ⭐⭐⭐⭐⭐] [프레젠테이션 ⭐⭐⭐⭐] [코딩 ⭐⭐]
```

**Step 3: 사회가 필요로 하는 것 (WORLD NEEDS)**
- 10가지 **제안 항목** 체크박스:
  - 기후 변화 대응
  - 디지털 격차 해소
  - 멘탈 헬스 케어
  - 고령화 사회 문제
  - 교육 불평등
  - 일자리 창출
  - 지속가능한 소비
  - 커뮤니티 연결
  - 창작자 경제 지원
  - 중소기업 디지털 전환
- **직접 입력** 옵션
- Supabase에 실시간 저장

**Step 4: 보상받을 수 있는 것 (PAID FOR)**
- 8가지 **고객 코호트 제안** (페인 포인트 중심):
  - 바쁜 직장인 (시간 부족, 업무 스트레스)
  - 시니어층 (디지털 적응, 외로움)
  - 창업가 (자금 부족, 네트워킹)
  - 학습자 (체계적 커리큘럼 부족)
  - 크리에이터 (수익화 어려움)
  - 소상공인 (마케팅, 온라인 진출)
  - 새내기 부모 (육아 정보 부족)
  - 취준생 (진로 불확실성)
- **직접 입력** 옵션
- Supabase에 실시간 저장

**Step 5: Ikigai 완성 및 분석**
- 4가지 영역 **교집합 자동 계산**:
  - **Passion** (좋아하는 것 ∩ 잘하는 것)
  - **Mission** (좋아하는 것 ∩ 세상이 필요로 하는 것)
  - **Profession** (잘하는 것 ∩ 보상받을 수 있는 것)
  - **Vocation** (세상이 필요로 하는 것 ∩ 보상받을 수 있는 것)
- **부족한 영역 진단**:
  - 3가지 O, 1가지 X 상태별 개선 제안
- **최종 Ikigai 텍스트** 생성 (AI 기반)
- 시각화 차트 (**벤 다이어그램**)
- **PDF 내보내기** 기능

```
교집합 분석 예시:

✅ Passion: 글쓰기, 콘텐츠 기획
✅ Mission: 교육 불평등 해소
✅ Profession: 온라인 강의, 전자책
⚠️ Vocation: 없음

→ 제안: "교육 불평등을 해소하기 위한 수익 모델을 
          개발해보세요. 예: 저소득층 무료 + 프리미엄 유료"
```

### 4.4 브랜드 설계

Ikigai 결과를 바탕으로 실제 비즈니스 브랜드를 설계합니다. **5단계 프로세스**로 브랜드 방향부터 수익 모델까지 제시합니다.

#### Step 1: 브랜드 방향
- **분야 선택** (AI 제안)
- **포지셔닝** 설정
- **핵심 메시지** 정의

#### Step 2: 콘텐츠 전략
- **주요 주제** (Ikigai 기반 제안)
- **콘텐츠 형식** (블로그, 영상, 팟캐스트 등)
- **배포 채널** (플랫폼별 전략)
- **발행 빈도** 권장

#### Step 3: 타겟 고객
- **연령대** 및 인구통계
- **관심사** 및 가치관
- **페인 포인트** (Ikigai 'PAID FOR' 연동)
- **선호 채널**

#### Step 4: 브랜드명
- 사용자 **선호 키워드** 입력
- **좋아하는 브랜드** 참고
- AI 기반 **네이밍 제안** (10개)
- **의미 해설** 제공
- 도메인 가용성 체크 (향후)

#### Step 5: 수익 모델
- **주요 수익 모델** 제안:
  - 구독 서비스
  - 디지털 제품 판매
  - 컨설팅/코칭
  - 광고/스폰서십
  - 커뮤니티 멤버십
- **가격 포인트** 권장
- **수익화 채널** 전략

### 4.5 커뮤니티 매칭

Prime Perspective 기반으로 비슷한 가치관을 가진 사람들을 연결하고, 그룹 활동을 지원합니다.

#### 추천 매칭
- **싱크로율** 기반 매칭 (0-100점)
- **유사 성향** vs **보완 성향** 분류
- **매칭 이유** 제시 (공통 관심사, 보완 강점)
- **Prime Perspective 정렬도** 표시

```
매칭 예시:

👤 김철수 (싱크로율 87%)
✨ 유사 성향
📌 공통 관심사: 교육, 콘텐츠 제작, 자기계발
💪 Prime Perspective: "창의적 교육 콘텐츠로 학습자 성장 지원"
```

#### 개인 매칭 요청
- **친구/연인 이메일**로 초대
- 분석 완료 시 **싱크로율 자동 계산**
- **상세 분석 리포트**:
  - 싱크로율 (유사도)
  - 보완율 (상호 보완)
  - 강점 영역
  - 성장 영역
- 요청 상태 관리 (대기/수락/거절)

#### 커뮤니티 그룹
- **관심사별 그룹** 생성
- 멤버 **평균 싱크로율** 표시
- **최근 활동 타임라인**
- 그룹 채팅 (향후)
- **이벤트/프로젝트 모집**

### 4.6 마이페이지 & 대시보드

- **프로필 관리** (편집, 사진)
- **Prime Perspective 요약 카드**
- **성장 현황 리포트** (분석 완료율, 브랜드 진행률)
- **메타인지 분석** (자기 인식 vs 실제 데이터)
- **히스토리 관리** (Why 분석, Ikigai 버전별)
- **설정** (알림, 개인정보, 계정)

### 4.7 관리자 기능

- **대시보드** (사용자 통계, 활동 지표)
- **사용자 관리** (활성/비활성, 권한)
- **분석 도구** (전환율, 이탈률, 인기 기능)
- **시스템 설정** (API 키, 알림 템플릿)

---

## 5. 데이터베이스 구조 (Supabase)

### 5.1 핵심 테이블

#### profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT UNIQUE,
  has_completed_analysis BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### brainstorm_sessions (브레인스토밍 세션)
```sql
CREATE TABLE brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
```

#### job_entries (직업 데이터)
```sql
CREATE TABLE job_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  definition TEXT,
  first_memory TEXT,
  category TEXT CHECK (category IN ('happy', 'pain', 'neutral')),
  reason TEXT,
  has_experience BOOLEAN DEFAULT FALSE,
  experience_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_skills (사용자 스킬)
```sql
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level INTEGER CHECK (skill_level BETWEEN 1 AND 5),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_social_needs (사회적 가치)
```sql
CREATE TABLE user_social_needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  need_text TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_revenue_opportunities (수익 기회)
```sql
CREATE TABLE user_revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_text TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ikigai_designs (Ikigai 설계)
```sql
CREATE TABLE ikigai_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  love_elements JSONB,
  good_at_elements JSONB,
  world_needs_elements JSONB,
  paid_for_elements JSONB,
  final_ikigai_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### brand_strategies (브랜드 전략)
```sql
CREATE TABLE brand_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_direction JSONB,
  content_strategy JSONB,
  target_audience JSONB,
  brand_names JSONB,
  selected_name TEXT,
  revenue_model JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### compatibility_matches (매칭 데이터)
```sql
CREATE TABLE compatibility_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_type TEXT CHECK (match_type IN ('similar', 'complementary')),
  compatibility_score FLOAT CHECK (compatibility_score BETWEEN 0 AND 100),
  match_reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### community_groups (커뮤니티 그룹)
```sql
CREATE TABLE community_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### group_members (그룹 멤버)
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

#### personal_match_requests (개인 매칭 요청)
```sql
CREATE TABLE personal_match_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  analysis_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
```

### 5.2 RLS (Row Level Security) 정책

모든 테이블에 사용자별 접근 제한 정책이 적용되어 있습니다. 각 사용자는 **본인의 데이터만** 읽고 쓸 수 있습니다.

```sql
-- 예시: user_skills 테이블 RLS 정책
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON user_skills FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 6. 기술 스택

### 6.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.x | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Vite | 5.x | 빌드 도구 |
| React Router | v6 | 라우팅 |
| TanStack Query | v4 | 서버 상태 관리 |
| Tailwind CSS | v3 | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 |
| Lucide React | - | 아이콘 |
| React Helmet Async | - | 메타태그 |

### 6.2 백엔드

| 기술 | 용도 |
|------|------|
| **Supabase** | BaaS (Backend as a Service) |
| PostgreSQL | 데이터베이스 |
| Supabase Auth | 사용자 인증 |
| Row Level Security | 데이터 보안 |
| Edge Functions | 서버리스 함수 |
| Supabase Storage | 파일 저장 |

### 6.3 AI & 분석

| 기술 | 용도 |
|------|------|
| OpenAI GPT-4 | 텍스트 분석, 패턴 추출 |
| Claude API | 복잡한 분석, 리포트 생성 |
| NLP | 키워드 추출, 감정 분석 |
| Custom Algorithm | 매칭 알고리즘 (유사도 계산) |

### 6.4 개발 도구

| 도구 | 용도 |
|------|------|
| Git | 버전 관리 |
| Lovable.dev | 초기 개발 플랫폼 |
| Claude Code | 이관 후 개발 환경 |
| ESLint + Prettier | 코드 품질 |

---

## 7. 구현 현황

### 7.1 완료 항목 ✅

#### Why 분석 (80% 완료)
- ✅ 10분 타이머 브레인스토밍
- ✅ 직업 정의·각인 순간 입력
- ✅ 드래그앤드롭 분류
- ✅ 이유 작성
- ✅ 경험 여부 체크
- ✅ 데이터베이스 저장
- ⏳ AI 패턴 분석 (진행중)
- ⏳ Prime Perspective 생성 (진행중)

#### Ikigai 설계 (90% 완료)
- ✅ 하이브리드 탭 구조 (AI생성 + 직접설계)
- ✅ 5단계 설계 프로세스
- ✅ Why 분석 데이터 연동
- ✅ 스킬 평가 (슬라이더)
- ✅ 사회적 가치 제안 선택
- ✅ 고객 코호트 제안
- ✅ 교집합 자동 분석
- ✅ Supabase 실시간 저장/로드
- ⏳ 벤 다이어그램 시각화 (진행중)

#### 브랜드 설계 (60% 완료)
- ✅ 5단계 프로세스 UI
- ✅ Ikigai 데이터 연동
- ⏳ AI 브랜드 방향 제안 (진행중)
- ⏳ 콘텐츠 전략 생성 (진행중)
- ⏳ 네이밍 알고리즘 (진행중)
- ❌ 수익 모델 제안 (미구현)

#### 커뮤니티 (70% 완료)
- ✅ 추천 매칭 UI
- ✅ 개인 매칭 요청
- ✅ 그룹 생성 UI
- ⏳ 매칭 알고리즘 (기본 구현)
- ❌ 그룹 채팅 (미구현)
- ❌ 실시간 알림 (미구현)

#### 마이페이지 (50% 완료)
- ✅ 프로필 편집
- ✅ Prime Perspective 카드
- ✅ 성장 리포트
- ⏳ 메타인지 분석 (기본 UI)
- ❌ 히스토리 관리 (미구현)

#### 관리자 (40% 완료)
- ✅ 대시보드 UI
- ✅ 사용자 관리 UI
- ⏳ 분석 도구 (기본 구현)
- ❌ 실제 통계 연동 (미구현)

### 7.2 진행 중 항목 ⏳

- AI 패턴 분석 로직 고도화
- Prime Perspective 자동 생성 알고리즘
- 브랜드 전략 AI 추천 엔진
- 매칭 알고리즘 정교화
- Ikigai 벤 다이어그램 시각화

### 7.3 미구현 항목 ❌

- 그룹 채팅 시스템
- 실시간 알림 (푸시, 이메일)
- 히스토리 버전 관리
- PDF 내보내기
- 소셜 로그인 (Google, Kakao)
- 도메인 가용성 체크
- 관리자 실제 통계 대시보드

---

## 8. UI/UX 디자인 철학

### 8.1 미니멀리즘 원칙

PRIPER의 디자인은 **불필요한 요소를 제거**하고 **핵심에 집중**합니다.

#### 텍스트 크기 표준화
- `text-lg` → `text-sm` (본문)
- `text-sm` → `text-xs` (부가정보)
- 일관된 폰트 크기로 **시각적 계층 단순화**

#### 아이콘 크기 조정
- `w-8 h-8` → `w-6 h-6` (주요 아이콘)
- `w-6 h-6` → `w-5 h-5` (보조 아이콘)
- 적절한 크기로 **여백 확보**

#### 색상 사용
- 조건부 강조색 제거
- 일관된 **뉴트럴 톤** 유지
- 필요시에만 **액센트 컬러** 사용

#### 간격 및 여백
- 카드, 버튼, Badge 크기 **표준화**
- 일관된 **padding/margin** 체계
- 호흡할 수 있는 **공간 확보**

### 8.2 사용자 경험 원칙

#### 진행률 시각화
- 모든 단계별 프로세스에 **진행률 표시**
- 사용자가 **현재 위치**와 **남은 작업** 파악
- 완료 상태를 **시각적으로 피드백**

#### 실시간 피드백
- 자동 저장 시 **토스트 메시지**
- **로딩 상태** 명확히 표시
- 에러 발생 시 **친절한 안내**

#### 직관적 인터랙션
- **드래그앤드롭**으로 직관적 분류
- **슬라이더**로 숙련도 평가
- **체크박스**로 빠른 선택
- **애니메이션**으로 피드백 강화

#### 접근성
- **키보드 내비게이션** 지원
- 충분한 **색상 대비**
- 의미 있는 **라벨 및 설명**
- **반응형 디자인** (모바일 최적화)

---

## 9. 멀티 페르소나 기능 (Multi-Persona Feature)

### 9.1 배경 및 필요성

#### 핵심 인사이트
"하나를 찾지 못해 힘들어하는 사람들은 좋아하는 게 없어서가 아니라, 좋아하는 게 너무 많아서 힘들어한다"

- 기존 시스템: 모든 행복 직업군을 하나의 Prime Perspective로 통합
- 문제점: 사용자 내부에 본질적으로 다른 여러 페르소나가 존재
  - 예: "의사, 간호사, 상담사" → "돕는 나" (케어 페르소나)
  - 예: "작가, 영화감독, 디자이너" → "창작하는 나" (크리에이터 페르소나)
  - 예: "CEO, 컨설턴트, 투자자" → "전략 짜는 나" (스트래티지스트 페르소나)

#### 타겟 시장
- 멀티포텐셜라이트(Multipotentialite): 전체 인구의 20-30%
- MZ세대의 "슬래시(/)" 정체성: 개발자/작가, 의사/유튜버
- 기존 MBTI, 강점 진단 도구의 한계: 단일 유형 강요

### 9.2 프리미엄 비즈니스 모델

#### 무료 vs 프리미엄 차별화

**무료 버전 (Free Tier)**
- 가장 강한 1개 페르소나만 상세 분석 제공
- 나머지 페르소나는 제목만 표시 (Pro 전용)
- 단일 페르소나 기반 Ikigai 설계
- 단일 페르소나 브랜딩 전략

**프리미엄 버전 (Pro/Elite Tier)**
- 모든 페르소나 (최대 3-5개) 상세 분석
- 페르소나별 Prime Perspective 생성
- 페르소나 간 관계 분석 (시너지/충돌)
- 페르소나별 Ikigai 설계
- 통합 브랜딩 전략 (Unified/Hybrid/Separated)
- 페르소나별 성장 추적

#### 가격 정책
- Pro: 월 9,900원 / 연 99,000원 (17% 할인)
- Elite: 월 29,000원 / 연 290,000원 (17% 할인)

#### 전환 트리거 포인트
1. Why 분석 완료 시 (예상 전환율 25%)
   - "3개 페르소나가 발견되었는데, 하나만 보여드릴게요"
2. Ikigai 설계 시 (예상 전환율 30%)
   - "좋아하는 것이 너무 달라서 하나로 정리가 안 돼요"
3. 브랜딩 고민 시 (예상 전환율 35%)
   - "여러 분야를 다루고 싶은데 브랜드가 산만해 보여요"

### 9.3 핵심 기능

#### 페르소나 자동 감지 알고리즘
1. 행복 직업군 데이터 수집
2. OpenAI Embeddings API로 벡터화
3. K-means 클러스터링 (2-5개 그룹)
4. GPT-4로 페르소나 테마 자동 생성
5. 8가지 원형(Archetype) 분류
   - Healer, Creator, Strategist, Analyst, Builder, Teacher, Explorer, Guardian

#### 페르소나별 분석
- **Prime Perspective**: 각 페르소나별 핵심 관점
- **행복/고통 패턴**: 페르소나별 키워드 추출
- **각인 순간**: 페르소나 형성 기원 분석
- **Ikigai**: 페르소나별 독립 Ikigai 생성

#### 페르소나 관계 분석
- **시너지 분석**: "교육 콘텐츠 = 창작 + 돌봄"
- **충돌 분석**: "자유로운 나 vs 안정적인 나"
- **우선순위 제안**: 시기별 페르소나 활성화 전략

#### 통합 브랜딩 전략 3가지
1. **Unified (통합 브랜드)**
   - 1개 브랜드로 모든 페르소나 표현
   - 예: "김철수 - 의사이자 작가이자 강연자"

2. **Hybrid (메인+서브)**
   - 메인: "Dr. 김철수" (의사)
   - 서브: "철수의 글방" (작가)

3. **Separated (분리 브랜드)**
   - 완전히 독립된 여러 브랜드 운영

### 9.4 데이터베이스 구조

#### 새로운 테이블
- `persona_profiles` - 페르소나 기본 정보
- `persona_job_mappings` - 직업-페르소나 매핑
- `persona_keywords` - 페르소나별 키워드
- `persona_perspectives` - 페르소나별 Prime Perspective
- `persona_relationships` - 시너지/충돌 관계
- `persona_ikigai` - 페르소나별 Ikigai
- `persona_brands` - 페르소나별 브랜드 전략
- `integrated_brand_strategy` - 통합 브랜딩 전략
- `persona_growth_tracking` - 페르소나별 성장 추적

#### profiles 테이블 확장
```sql
ALTER TABLE profiles ADD COLUMN has_multiple_personas BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN active_persona_id UUID;
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
```

### 9.5 UI/UX 컴포넌트

#### 글로벌 페르소나 스위처
- 모든 페이지 상단에 페르소나 전환 드롭다운
- 페르소나별 색상/아이콘 구분
- 무료 사용자: 2번째 이상 페르소나에 잠금 표시

#### 페르소나 대시보드 (`/personas`)
- 전체 페르소나 목록 및 상세 정보
- 페르소나별 Prime Perspective 카드
- 페르소나 간 관계 시각화
- 통합 브랜딩 전략 설계 버튼

#### 페르소나 비교 뷰
- 사이드바이사이드 비교 모드
- 시너지/충돌 하이라이트
- 통합 제안 표시

### 9.6 구현 우선순위

#### Phase 1 (완료)
- 데이터베이스 스키마 확장
- 페르소나 감지 알고리즘 (Edge Function)
- TypeScript 타입 정의
- React Hooks (usePersonas)

#### Phase 2 (다음 단계)
- 페르소나 대시보드 UI
- 무료/Pro 분기 UI (Paywall)
- 페르소나 스위처 컴포넌트
- 페르소나 검증 플로우

#### Phase 3 (후속)
- 페르소나별 Ikigai 설계 UI
- 통합 브랜딩 전략 UI
- 페르소나 관계 분석 시각화
- 성장 추적 대시보드

### 9.7 성공 지표 (KPI)

#### 전환 관련
- 무료 → Pro 전환율: 기존 12% → 목표 20-25%
- 페르소나 발견 시 전환율: 25-35%

#### 사용자 경험
- 멀티 페르소나 발견 비율: 60% 이상
- 페르소나 검증 완료율: 80% 이상
- 통합 브랜딩 전략 완성율: 50% 이상

#### 비즈니스 성과
- Pro 구독 수익: 연 2억 8,344만원 (MAU 10,000명 기준)
- LTV 증가: 멀티 페르소나 사용자 1.5배 높음

### 9.7 구현 완료 현황 (2024-11-24 기준)

#### Phase 1: 백엔드 인프라 (완료 ✅)
- **데이터베이스 마이그레이션**
  - `20251123000000_multi_persona_tables.sql`: 9개 테이블 생성
  - `20251124000000_persona_advanced_features.sql`: 고급 기능 테이블 4개 추가
  - RLS 정책 전체 적용
  - 인덱스 최적화 완료

- **Edge Functions**
  - `detect-personas`: AI 기반 페르소나 자동 감지 (K-means + GPT-4)
  - `analyze-persona-relationships`: 페르소나 관계 AI 분석
  - 자동 마일스톤 생성 로직 통합

- **TypeScript 타입 정의**
  - `persona-types.ts`: 모든 페르소나 인터페이스
  - 8개 Archetype 설정 (색상, 아이콘)

#### Phase 2: UI 컴포넌트 (완료 ✅)
- **PersonaPaywall**: 프리미엄 전환 모달 (3가지 컨텍스트)
- **Personas 페이지**: 메인/서브 페르소나 대시보드
- **PersonaSwitcher**: 전역 페르소나 선택기
- **PersonaDetectionTrigger**: Why 분석 후 자동 감지 트리거
- **PersonaVerificationFlow**: 사용자 검증 및 수정 인터페이스

#### Phase 3: 고급 기능 (완료 ✅)
- **PersonaIkigaiCanvas**: 페르소나별 Ikigai 설계
  - URL 파라미터로 특정 페르소나 선택 (`/ikigai?persona=<id>`)
  - 페르소나 컨텍스트 헤더 표시

- **UnifiedBrandingStrategy**: 통합 브랜딩 전략
  - 3가지 전략: Unified, Hybrid, Separated
  - 장단점 및 최적 사용 케이스 제시
  - 전략 노트 기능

- **PersonaRelationshipGraph**: 관계 분석 시각화
  - 시너지/충돌/중립 자동 분류
  - 공통 키워드 표시
  - AI 인사이트 및 실행 제안
  - 자동 분석 + 재분석 버튼

- **PersonaGrowthDashboard**: 성장 추적
  - 페르소나별 강도 변화 추이
  - 마일스톤 관리 (완료/미완료 토글)
  - 성장 지표 시각화

#### Phase 4: 데이터베이스 통합 (완료 ✅)
- **확장 Hooks** (`usePersonas.ts`)
  - 브랜딩 전략: `useBrandingStrategy`, `useSaveBrandingStrategy`
  - 마일스톤: `usePersonaMilestones`, `useToggleMilestone`, `useCreateMilestone`
  - 성장 지표: `useGrowthSummary`, `usePersonaGrowthHistory`, `useRecordGrowthMetric`
  - 관계 분석: `usePersonaRelationships`, `useAnalyzePersonaRelationships`

- **컴포넌트 DB 통합**
  - UnifiedBrandingStrategy: 실시간 저장/로드
  - PersonaGrowthDashboard: 실제 DB 데이터 사용
  - PersonaRelationshipGraph: AI 분석 결과 표시

#### Phase 5: 자동화 및 Realtime (완료 ✅)
- **Supabase Realtime 구독**
  - 마일스톤 변경 실시간 동기화
  - 성장 지표 자동 업데이트
  - 멀티 디바이스/세션 지원

- **자동 마일스톤 생성**
  - 페르소나 감지 시 4개 기본 마일스톤 자동 생성
  - SQL 함수: `create_default_milestones()`

- **자동 관계 분석**
  - 페르소나 2개 이상 시 자동 실행
  - OpenAI GPT-4 통합 (선택적, fallback 있음)

#### 라우팅
- `/personas`: 페르소나 대시보드
- `/personas/relationships`: 관계 분석 페이지 (3개 탭)
- `/ikigai?persona=<id>`: 페르소나별 Ikigai 설계

#### 기술 스택
- **Frontend**: React, TypeScript, TanStack Query, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime)
- **AI**: OpenAI (text-embedding-3-small, GPT-4)
- **알고리즘**: K-means clustering, Silhouette score

#### 보안
- Row Level Security (RLS) 모든 테이블 적용
- Edge Function 사용자 인증 검증
- Subscription tier 기반 접근 제어

---

## 10. 다음 단계 개발 계획

### 10.1 단기 (1-2개월)

#### 1순위: Why 분석 완성
- AI 패턴 분석 로직 구현
- 행복/고통 키워드 자동 추출
- 각인 순간 원인 매핑 알고리즘
- Prime Perspective 자동 생성
- 분석 결과 시각화 (키워드 클라우드, 다이어그램)

#### 2순위: Ikigai 시각화 고도화
- 실제 벤 다이어그램 구현
- 교집합 영역 인터랙티브 표시
- PDF 내보내기 기능
- 히스토리 버전 관리

#### 3순위: 브랜드 설계 AI 연동
- Ikigai → 브랜드 방향 자동 제안
- 콘텐츠 전략 생성 알고리즘
- 타겟 고객 페르소나 생성
- 브랜드명 생성 로직 (선호 키워드 기반)
- 수익 모델 제안 시스템

### 10.2 중기 (3-4개월)

#### 1순위: 커뮤니티 고도화
- 매칭 알고리즘 정교화
  - Prime Perspective 기반 유사도
  - 가치관 정렬도
  - 보완 강점 분석
- 그룹 채팅 시스템 구현
- 실시간 알림 (푸시, 이메일)
- 이벤트/프로젝트 모집 기능

#### 2순위: 마이페이지 완성
- 메타인지 분석 알고리즘
- 성장 추적 대시보드
- 히스토리 타임라인
- 목표 설정 및 트래킹

#### 3순위: 관리자 도구 완성
- 실제 통계 대시보드
- 사용자 행동 분석
- 전환율 추적
- A/B 테스트 도구

### 10.3 장기 (5-6개월)

#### 1순위: 모바일 앱
- React Native 포팅
- iOS/Android 네이티브 기능
- 푸시 알림
- 오프라인 모드

#### 2순위: 고급 AI 기능
- 음성 입력 지원
- AI 챗봇 코칭
- 개인화 추천 엔진
- 감정 분석 고도화

#### 3순위: 비즈니스 모델
- 유료 구독 모델
- 프리미엄 기능 (심화 분석, 1:1 코칭)
- 기업용 솔루션 (HR, 팀 빌딩)
- 파트너십 (커리어 플랫폼, 교육 기관)

---

## 11. 부록

### 11.1 주요 컴포넌트 목록

#### Why 분석 관련
- `Why.tsx` - 메인 페이지
- `WhyAnalysis.tsx` - 분석 결과 페이지
- `Step1BrainstormingSection.tsx` - 브레인스토밍
- `Step2DefinitionSection.tsx` - 정의 작성
- `Step3ClassificationSection.tsx` - 분류
- `Step4ResultsSection.tsx` - 결과

#### Ikigai 관련
- `Ikigai.tsx` - 메인 페이지 (하이브리드 구조)
- `Step2SkillsAssessment.tsx` - 스킬 평가
- `Step3SocialNeeds.tsx` - 사회적 가치

#### 브랜드 설계 관련
- `BrandDesign.tsx` - 메인 페이지
- `BrandAnalysisPanel.tsx` - 분석 패널
- `BrandDirectionStep.tsx` - 브랜드 방향
- `ContentStrategyStep.tsx` - 콘텐츠 전략
- `TargetAudienceStep.tsx` - 타겟 고객
- `BrandNamingStep.tsx` - 브랜드명
- `RevenueModelStep.tsx` - 수익 모델
- `StepNavigation.tsx` - 단계 네비게이션

#### 커뮤니티 관련
- `Community.tsx` - 메인 페이지
- `RecommendedMatches.tsx` - 추천 매칭
- `PersonalMatchRequest.tsx` - 개인 매칭 요청
- `MatchRequestList.tsx` - 요청 목록
- `CommunityGroups.tsx` - 그룹 목록
- `CreateGroupForm.tsx` - 그룹 생성

#### 마이페이지 관련
- `Dashboard.tsx` - 메인 대시보드
- `ProfileEditDialog.tsx` - 프로필 편집
- `GrowthReport.tsx` - 성장 리포트
- `MetacognitionAnalysis.tsx` - 메타인지 분석
- `SettingsDropdown.tsx` - 설정

#### 관리자 관련
- `AdminDashboard.tsx` - 대시보드
- `AdminUsers.tsx` - 사용자 관리
- `AdminAnalytics.tsx` - 분석 도구
- `AdminSettings.tsx` - 시스템 설정

### 11.2 개발 환경 설정

#### 필수 환경 변수 (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key  # 선택
VITE_CLAUDE_API_KEY=your_claude_key  # 선택
```

#### 로컬 개발 실행
```bash
npm install
npm run dev
```

#### 빌드 및 배포
```bash
npm run build
npm run preview
```

### 11.3 프로젝트 이관 체크리스트

- ✅ Lovable.dev에서 코드 추출 완료
- ✅ 프로젝트 파일들을 `/mnt/project`에 복사 완료
- ⏳ Claude Code 환경 설정 진행중
- ✅ 종합 문서 작성 완료
- ❌ Supabase 연결 테스트 필요
- ❌ 로컬 환경 빌드 테스트 필요
- ❌ AI API 키 재설정 필요

### 11.4 주요 참고 자료

#### 프로젝트 파일 위치
- 프로젝트 루트: `/mnt/project/`
- 컴포넌트: 각 `.txt`, `.tsx` 파일들
- 종합 문서: `/mnt/user-data/outputs/PRIPER_종합개발문서.md`

#### 개발 가이드
- Supabase 공식 문서: https://supabase.com/docs
- React 공식 문서: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com

---

## 결론

본 문서는 PRIPER 프로젝트의 전체 구조와 개발 현황을 정리한 종합 문서입니다. 

**PRIPER의 핵심**은 기술이 아니라 **사람**입니다. AI 시대에도 가장 중요한 것은 "내가 누구인가?"와 "누구와 함께하는가?"라는 질문에 대한 답입니다. 

이 플랫폼이 많은 사람들이 자신만의 Prime Perspective를 발견하고, 의미 있는 삶과 브랜드를 만들어가는 데 도움이 되기를 바랍니다.

---

**문서 끝**

*본 문서는 프로젝트 이관 및 지속 개발을 위한 참고 자료로 활용하시기 바랍니다.*
