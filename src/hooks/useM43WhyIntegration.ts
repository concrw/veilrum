// M43 × WhyFlow 연동 hook
// Why 분석 결과를 7 프레임워크 × 231 도메인에 매핑

import { useState, useCallback } from 'react';
import { veilrumDb, supabase } from '@/integrations/supabase/client';

// ── 타입 ──────────────────────────────────────────────────────────
export interface M43Framework {
  id: string;
  code: string;
  name: string;
  name_ko: string;
  description: string | null;
  core_question: string | null;
}

export interface M43Domain {
  id: string;
  code: string;
  name: string;
  division_id: string;
  division_code?: string;
}

export interface M43DomainMatch {
  domain: M43Domain;
  score: number;          // 0~1
  matchedKeywords: string[];
  frameworkCodes: string[];
}

export interface M43FrameworkTag {
  framework: M43Framework;
  relevance: number;      // 0~1
  reasoning: string;
}

export interface WhyM43Analysis {
  domainMatches: M43DomainMatch[];
  frameworkTags: M43FrameworkTag[];
  imprintConnections: ImprintConnection[];
  valueMap: ValueMapEntry[];
}

export interface ImprintConnection {
  jobName: string;
  domainCode: string;
  domainName: string;
  frameworkCode: string;
  frameworkName: string;
  connection: string;    // AI가 생성한 연결 설명
}

export interface ValueMapEntry {
  frameworkCode: string;
  frameworkNameKo: string;
  domains: { code: string; name: string; score: number }[];
  userPattern: string;   // 해당 프레임워크에서 발견된 유저 패턴 요약
}

// ── Hook ─────────────────────────────────────────────────────────
export function useM43WhyIntegration() {
  const [frameworks, setFrameworks] = useState<M43Framework[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WhyM43Analysis | null>(null);

  // 7 프레임워크 로드
  const loadFrameworks = useCallback(async () => {
    const { data } = await veilrumDb
      .from('m43_frameworks')
      .select('id, code, name, name_ko, description, core_question')
      .order('code');
    if (data) setFrameworks(data as M43Framework[]);
    return (data ?? []) as M43Framework[];
  }, []);

  // 직업 목록 + 이유/기억을 기반으로 M43 도메인 매칭
  const matchDomains = useCallback(async (
    jobs: { job_name: string; definition: string | null; first_memory: string | null; category: string | null; reason: string | null }[]
  ): Promise<M43DomainMatch[]> => {
    // 유저 텍스트에서 키워드 추출
    const allTexts = jobs
      .map(j => [j.definition, j.first_memory, j.reason].filter(Boolean).join(' '))
      .join(' ');
    const tokens = allTexts
      .toLowerCase()
      .split(/[\s,.\-;:!?()'"]+/)
      .filter(t => t.length > 1);

    // m43_domain_questions에서 키워드 매칭
    const { data: questions } = await veilrumDb
      .from('m43_domain_questions')
      .select(`
        id, question, keywords, category,
        m43_domains(id, name, code, division_id, m43_divisions(code))
      `)
      .limit(500);

    if (!questions || questions.length === 0) return [];

    // 도메인별 점수 집계
    const domainScores: Record<string, { domain: M43Domain; score: number; keywords: Set<string>; frameworks: Set<string> }> = {};

    interface M43QuestionRow {
      id: string;
      question: string | null;
      keywords: string[] | null;
      category: string | null;
      m43_domains: { id: string; name: string; code: string; division_id: string; m43_divisions: { code: string } } | null;
    }
    for (const q of questions as M43QuestionRow[]) {
      const qKeywords = (q.keywords ?? []).map((k: string) => k.toLowerCase());
      const domain = q.m43_domains;
      if (!domain) continue;

      let matchCount = 0;
      const matchedKws = new Set<string>();
      for (const token of tokens) {
        for (const kw of qKeywords) {
          if (kw.includes(token) || token.includes(kw)) {
            matchCount++;
            matchedKws.add(kw);
          }
        }
      }

      if (matchCount > 0) {
        const domId = domain.id;
        if (!domainScores[domId]) {
          domainScores[domId] = {
            domain: {
              id: domain.id,
              code: domain.code,
              name: domain.name,
              division_id: domain.division_id,
              division_code: domain.m43_divisions?.code ?? '',
            },
            score: 0,
            keywords: new Set(),
            frameworks: new Set(),
          };
        }
        domainScores[domId].score += matchCount;
        matchedKws.forEach(k => domainScores[domId].keywords.add(k));
        if (q.category) domainScores[domId].frameworks.add(q.category);
      }
    }

    // 정규화 및 정렬
    const entries = Object.values(domainScores);
    const maxScore = Math.max(...entries.map(e => e.score), 1);

    return entries
      .map(e => ({
        domain: e.domain,
        score: Math.min(1, e.score / maxScore),
        matchedKeywords: Array.from(e.keywords).slice(0, 5),
        frameworkCodes: Array.from(e.frameworks),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // 상위 15개
  }, []);

  // 7 프레임워크별 유저 패턴 태깅
  const tagFrameworks = useCallback(async (
    jobs: { job_name: string; category: string | null; reason: string | null }[],
    fws: M43Framework[],
    domainMatches: M43DomainMatch[],
  ): Promise<M43FrameworkTag[]> => {
    const happyReasons = jobs.filter(j => j.category === 'happy').map(j => j.reason).filter(Boolean).join('. ');
    const painReasons = jobs.filter(j => j.category === 'pain').map(j => j.reason).filter(Boolean).join('. ');

    // 프레임워크별 키워드 매칭 (클라이언트 측 1차 분류)
    const fwKeywordMap: Record<string, string[]> = {
      MSK: ['가면', '페르소나', '역할', '겉', '속', '감추다', '보여주다', '인상', '이미지', '체면', '허세'],
      'V/H': ['빌런', '히어로', '가해', '피해', '선', '악', '구원', '폭력', '방어', '공격'],
      CHG: ['변화', '성장', '준비', '두려움', '수용', '저항', '전환', '새로운', '도전'],
      HAB: ['계층', '환경', '배경', '교육', '가정', '사회적', '문화', '습관', '관습'],
      SEX: ['성적', '친밀', '욕망', '매력', '신체', '감각', '쾌락', '금기'],
      'M/S': ['돈', '경제', '소비', '투자', '성공', '물질', '자산', '재정'],
      DIV: ['이별', '이혼', '헤어짐', '분리', '상실', '끝', '결별', '단절'],
    };

    const combinedText = `${happyReasons} ${painReasons}`.toLowerCase();

    return fws.map(fw => {
      const keywords = fwKeywordMap[fw.code] ?? [];
      const matchCount = keywords.filter(k => combinedText.includes(k)).length;
      const domainRelevance = domainMatches.filter(d => d.frameworkCodes.includes(fw.code)).length;
      const relevance = Math.min(1, (matchCount / Math.max(keywords.length, 1)) * 0.6 + (domainRelevance / Math.max(domainMatches.length, 1)) * 0.4);

      let reasoning = '';
      if (relevance > 0.5) {
        reasoning = `${fw.name_ko} 영역에서 강한 패턴이 감지되었습니다.`;
      } else if (relevance > 0.2) {
        reasoning = `${fw.name_ko} 영역에서 부분적 연관성이 발견되었습니다.`;
      } else {
        reasoning = `${fw.name_ko} 영역과의 직접 연관은 약하지만 잠재적 연결이 있습니다.`;
      }

      return { framework: fw, relevance, reasoning };
    }).sort((a, b) => b.relevance - a.relevance);
  }, []);

  // 각인 순간 ↔ 도메인/프레임워크 연결 생성
  const buildImprintConnections = useCallback((
    jobs: { job_name: string; first_memory: string | null; category: string | null }[],
    domainMatches: M43DomainMatch[],
    fwTags: M43FrameworkTag[],
  ): ImprintConnection[] => {
    const connections: ImprintConnection[] = [];
    const topDomains = domainMatches.slice(0, 5);
    const topFrameworks = fwTags.filter(f => f.relevance > 0.2).slice(0, 3);

    for (const job of jobs.filter(j => j.first_memory && j.category !== 'neutral')) {
      const memText = (job.first_memory ?? '').toLowerCase();

      for (const dm of topDomains) {
        const hasKeywordMatch = dm.matchedKeywords.some(k => memText.includes(k.toLowerCase()));
        if (hasKeywordMatch && topFrameworks.length > 0) {
          const fw = topFrameworks[0];
          connections.push({
            jobName: job.job_name,
            domainCode: dm.domain.code,
            domainName: dm.domain.name,
            frameworkCode: fw.framework.code,
            frameworkName: fw.framework.name_ko,
            connection: `"${job.job_name}" 각인 순간이 ${dm.domain.name} 도메인의 ${fw.framework.name_ko} 패턴과 연결됩니다.`,
          });
        }
      }
    }

    return connections.slice(0, 10);
  }, []);

  // 가치관 매핑: 프레임워크별 도메인 그룹핑
  const buildValueMap = useCallback((
    fwTags: M43FrameworkTag[],
    domainMatches: M43DomainMatch[],
    happyReasons: string,
    painReasons: string,
  ): ValueMapEntry[] => {
    return fwTags
      .filter(ft => ft.relevance > 0.1)
      .map(ft => {
        const relatedDomains = domainMatches
          .filter(dm => dm.frameworkCodes.includes(ft.framework.code) || dm.score > 0.5)
          .slice(0, 5)
          .map(dm => ({ code: dm.domain.code, name: dm.domain.name, score: dm.score }));

        let userPattern = '';
        if (ft.relevance > 0.5) {
          userPattern = `행복/고통 패턴에서 ${ft.framework.name_ko} 관련 주제가 반복적으로 등장합니다.`;
        } else {
          userPattern = `${ft.framework.name_ko} 관련 간접적 연관성이 발견되었습니다.`;
        }

        return {
          frameworkCode: ft.framework.code,
          frameworkNameKo: ft.framework.name_ko,
          domains: relatedDomains,
          userPattern,
        };
      });
  }, []);

  // 전체 분석 실행 (Step 7 진입 시 호출)
  const runM43Analysis = useCallback(async (
    sessionId: string,
    userId: string,
    jobs: {
      job_name: string;
      definition: string | null;
      first_memory: string | null;
      category: string | null;
      reason: string | null;
      has_experience: boolean;
      experience_note: string | null;
    }[],
  ): Promise<WhyM43Analysis> => {
    setLoading(true);
    try {
      // 1. 프레임워크 로드
      const fws = await loadFrameworks();

      // 2. 도메인 매칭
      const domainMatches = await matchDomains(jobs);

      // 3. 프레임워크 태깅
      const fwTags = await tagFrameworks(jobs, fws, domainMatches);

      // 4. 각인 연결
      const imprintConnections = buildImprintConnections(jobs, domainMatches, fwTags);

      // 5. 가치관 매핑
      const happyReasons = jobs.filter(j => j.category === 'happy').map(j => j.reason).filter(Boolean).join('. ');
      const painReasons = jobs.filter(j => j.category === 'pain').map(j => j.reason).filter(Boolean).join('. ');
      const valueMap = buildValueMap(fwTags, domainMatches, happyReasons, painReasons);

      const result: WhyM43Analysis = { domainMatches, frameworkTags: fwTags, imprintConnections, valueMap };
      setAnalysis(result);

      // DB 저장: why_sessions에 M43 분석 결과 반영
      await veilrumDb
        .from('why_sessions')
        .update({
          m43_domain_matches: domainMatches.map(d => ({ code: d.domain.code, name: d.domain.name, score: d.score })),
          m43_framework_tags: fwTags.map(f => ({ code: f.framework.code, name: f.framework.name_ko, relevance: f.relevance })),
          m43_imprint_connections: imprintConnections,
          m43_value_map: valueMap,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // m43_domain_answers에 유저 Why 데이터 저장 (각 매칭 도메인별)
      for (const dm of domainMatches.slice(0, 5)) {
        await veilrumDb.from('m43_domain_answers').insert({
          user_id: userId,
          domain_id: dm.domain.id,
          session_id: sessionId,
          source: 'why_flow',
          answer: JSON.stringify({
            matched_keywords: dm.matchedKeywords,
            framework_codes: dm.frameworkCodes,
            score: dm.score,
            jobs: jobs.filter(j => j.category !== 'neutral').map(j => j.job_name),
          }),
        }).then(() => {}).catch(() => {}); // 이미 존재하면 무시
      }

      return result;
    } finally {
      setLoading(false);
    }
  }, [loadFrameworks, matchDomains, tagFrameworks, buildImprintConnections, buildValueMap]);

  // Edge Function을 통한 AI 분석 (선택적, 실패 시 로컬 분석으로 폴백)
  const runAIAnalysis = useCallback(async (
    sessionId: string,
    userId: string,
    jobs: {
      job_name: string;
      definition: string | null;
      first_memory: string | null;
      category: string | null;
      reason: string | null;
      has_experience: boolean;
      experience_note: string | null;
    }[],
  ): Promise<WhyM43Analysis> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-why-patterns', {
        body: {
          session_id: sessionId,
          jobs: jobs.map(j => ({
            job_name: j.job_name,
            definition: j.definition,
            first_memory: j.first_memory,
            category: j.category,
            reason: j.reason,
            has_experience: j.has_experience,
            experience_note: j.experience_note,
          })),
          include_m43: true,
        },
      });

      if (!error && data?.m43_analysis) {
        setAnalysis(data.m43_analysis);
        return data.m43_analysis;
      }
    } catch (e) {
      console.warn('[useM43WhyIntegration] AI analysis failed, falling back to local:', e);
    }

    // 폴백: 로컬 분석
    return runM43Analysis(sessionId, userId, jobs);
  }, [runM43Analysis]);

  return {
    frameworks,
    loading,
    analysis,
    loadFrameworks,
    runM43Analysis,
    runAIAnalysis,
    setAnalysis,
  };
}
