import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface JobEntry {
  id: string;
  job_name: string;
  category: "happy" | "pain" | "neutral" | null;
  reason: string | null;
  definition: string | null;
  first_memory: string | null;
  created_at?: string;
}

type Category = "happy" | "pain" | "neutral";

const categoryLabels: Record<Category, string> = {
  happy: "HAPPINESS",
  pain: "SUFFERING",
  neutral: "NEUTRAL",
};

const Results = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPerspective, setAiPerspective] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // 최신 completed 세션 찾기
      const { data: session, error: sErr } = await supabase
        .from("brainstorm_sessions")
        .select("id, ended_at")
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .maybeSingle();

      if (sErr || !session) {
        setLoading(false);
        toast({ title: "세션 없음", description: "완료된 브레인스토밍 세션이 없습니다.", variant: "destructive" });
        return;
      }

      // 해당 세션의 분류 완료된 직업 로드
      const { data, error } = await supabase
        .from("job_entries")
        .select("id, job_name, category, reason, definition, first_memory, created_at")
        .eq("session_id", session.id)
        .not("category", "is", null)
        .order("created_at", { ascending: true });

      if (error) {
        setLoading(false);
        toast({ title: "로드 실패", description: "결과 데이터를 불러오지 못했습니다.", variant: "destructive" });
        return;
      }

      setJobs(data || []);
      setLoading(false);
    };

    load();
  }, []);

  const total = jobs.length;
  const byCategory = useMemo(() => ({
    happy: jobs.filter(j => j.category === "happy"),
    pain: jobs.filter(j => j.category === "pain"),
    neutral: jobs.filter(j => j.category === "neutral"),
  }), [jobs]);

  const counts = {
    happy: byCategory.happy.length,
    pain: byCategory.pain.length,
    neutral: byCategory.neutral.length,
  };

  const dominant: Category | "tie" | null = useMemo(() => {
    if (total === 0) return null;
    const max = Math.max(counts.happy, counts.pain, counts.neutral);
    const winners: Category[] = (Object.keys(counts) as Category[]).filter(c => counts[c] === max);
    if (winners.length > 1) return "tie";
    return winners[0];
  }, [counts.happy, counts.pain, counts.neutral, total]);

  const perspective = useMemo(() => {
    if (!dominant) return { title: "데이터 없음", desc: "분류된 직업이 없습니다. 먼저 분류를 완료해주세요." };
    if (dominant === "tie") return { title: "균형형 Prime Perspective", desc: "행복/고통/중립의 균형 잡힌 관점. 다양한 가능성을 탐색하고 객관적으로 판단하는 성향입니다." };
    if (dominant === "happy") return { title: "행복 중심 Prime Perspective", desc: "기쁨과 동기를 주는 일을 우선시합니다. 에너지와 몰입을 만들어내는 환경에서 강점을 발휘합니다." };
    if (dominant === "pain") return { title: "문제 해결 중심 Prime Perspective", desc: "불편과 비효율을 포착하고 개선합니다. 고통을 줄이는 데서 의미와 동기를 찾습니다." };
    return { title: "균형·분석 중심 Prime Perspective", desc: "사실 기반으로 판단하며 안정과 지속 가능성을 중시합니다. 감정에 치우치지 않고 본질을 봅니다." };
  }, [dominant]);

  const percent = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  // --- 고급 분석 로직 ---
  const STOPWORDS = useMemo(() => new Set([
    // Korean stopwords (partial)
    "의","가","이","을","를","은","는","에","에서","와","과","그리고","또한","하지만","또","등","때","수","것","들","더","그","다","로","으로","하다","했다","되다","있다","없다",
    // English stopwords (partial)
    "the","a","an","and","or","but","of","in","on","for","to","with","by","at","from","as","is","are","was","were","be","been","it","that","this","these","those","i","you","we","they"
  ]), []);

  const normalize = (s?: string) => (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokenize = (text: string) => text
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));

  const allTokens = useMemo(() => {
    const chunks = jobs.flatMap(j => [j.job_name, j.definition, j.first_memory, j.reason]);
    const joined = normalize(chunks.filter(Boolean).join(" "));
    return tokenize(joined);
  }, [jobs]);

  const topKeywords = useMemo(() => {
    const freq = new Map<string, number>();
    for (const t of allTokens) freq.set(t, (freq.get(t) || 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }, [allTokens]);

  const POSITIVE_WORDS = useMemo(() => new Set([
    // Korean
    "행복","즐거움","기쁨","의미","성장","몰입","흥미","재미","보람","안정","자유","도전","성취","배움","협업","공감","감사","즐겁다","좋다",
    // English
    "happy","joy","meaningful","growth","flow","interest","fun","rewarding","stable","freedom","challenge","achievement","learn","collaboration","empathy","great","good","love"
  ]), []);
  const NEGATIVE_WORDS = useMemo(() => new Set([
    // Korean
    "고통","힘듦","스트레스","불안","지루","반복","혼란","갈등","위험","불확실","야근","피로","소모","압박","부담","짜증","싫다",
    // English
    "pain","suffering","hard","stress","anxious","boring","repetitive","conflict","risk","uncertainty","overtime","fatigue","burnout","pressure","hate","bad"
  ]), []);

  const emotion = useMemo(() => {
    let pos = 0, neg = 0;
    for (const t of allTokens) {
      if (POSITIVE_WORDS.has(t)) pos++;
      if (NEGATIVE_WORDS.has(t)) neg++;
    }
    const categoryBoost = 2 * counts.happy - 2 * counts.pain;
    const raw = (pos - neg) + categoryBoost; // 텍스트 감정 + 카테고리 가중
    const score = Math.max(0, Math.min(100, Math.round(50 + raw * 5))); // 0~100 정규화
    const label = score > 60 ? "긍정적" : score < 40 ? "부정적" : "중립";
    return { pos, neg, raw, score, label };
  }, [allTokens, counts.happy, counts.pain, POSITIVE_WORDS, NEGATIVE_WORDS]);

  const THEMES: Record<string, string[]> = useMemo(() => ({
    "사람/관계": ["사람","팀","고객","협업","소통","커뮤니케이션","공감","상담","서비스"],
    "데이터/분석": ["데이터","분석","지표","통계","리서치","실험","모델","sql","리포트"],
    "창의/디자인": ["디자인","브랜딩","콘텐츠","글쓰기","창의","아이디어","ui","ux","시각"],
    "기술/개발": ["개발","코드","프로그래밍","엔지니어","소프트웨어","시스템","자동화","ai","인공지능"],
    "운영/프로세스": ["운영","프로세스","효율","개선","관리","문서화","품질","매뉴얼"],
    "교육/지식": ["교육","멘토","코칭","학습","강의","연구","지식","교사"],
    "비즈니스/전략": ["전략","기획","마케팅","시장","수익","판매","제품","로드맵"],
    "헬스/웰빙": ["헬스","의료","건강","심리","치료","간호","운동"],
    "안정/규정": ["안정","보안","리스크","규정","법","정책","감사"],
  }), []);

  const themeScores = useMemo(() => {
    const tokenSet = new Set(allTokens);
    const scores = Object.entries(THEMES).map(([name, kws]) => ({
      name,
      score: kws.reduce((acc, kw) => acc + (tokenSet.has(kw) ? 1 : 0), 0),
    }));
    return scores.sort((a, b) => b.score - a.score);
  }, [allTokens, THEMES]);

  const topThemes = useMemo(() => themeScores.filter(t => t.score > 0).slice(0, 5), [themeScores]);
  const primaryTheme = topThemes[0]?.name || null;

  const insights = useMemo(() => {
    const list: string[] = [];
    if (dominant === "happy") list.push("즐거움과 동기를 제공하는 업무 환경에서 성과가 높습니다.");
    if (dominant === "pain") list.push("문제점을 발견하고 개선하는 역할에서 강점을 보입니다.");
    if (dominant === "neutral") list.push("객관적·안정적 판단을 중시하는 경향이 있습니다.");
    if (dominant === "tie") list.push("균형 잡힌 시각으로 다양한 가능성을 탐색합니다.");

    list.push(`현재 전반적 감정 상태는 ${emotion.label}입니다 (점수 ${emotion.score}/100).`);

    if (primaryTheme) list.push(`주요 작업 테마는 '${primaryTheme}'에 가깝습니다.`);

    if (topKeywords.length > 0) {
      const kw = topKeywords.slice(0, 3).map(k => k.word).join(", ");
      list.push(`빈도가 높은 키워드: ${kw}`);
    }

    const themeToEnv: Record<string, string> = {
      "사람/관계": "고객 접점, 팀 협업 중심 조직",
      "데이터/분석": "지표 기반 의사결정, 실험 문화",
      "창의/디자인": "실험적·창의적 자유를 보장하는 환경",
      "기술/개발": "문제 해결 자율성, 기술 성장 기회",
      "운영/프로세스": "프로세스 개선과 표준화가 가능한 조직",
      "교육/지식": "지식 공유·멘토링 문화",
      "비즈니스/전략": "시장 탐색과 가설 검증 중심 팀",
      "헬스/웰빙": "사람 중심 케어와 윤리 기준이 명확한 곳",
      "안정/규정": "리스크 관리와 규정 준수가 중요한 조직",
    };
    if (primaryTheme && themeToEnv[primaryTheme]) list.push(`추천 환경: ${themeToEnv[primaryTheme]}`);

    return list.slice(0, 5);
  }, [dominant, emotion.label, emotion.score, primaryTheme, topKeywords]);

  const keyReasons = useMemo(() => {
    const reasons = jobs.map(j => j.reason?.trim()).filter((r): r is string => !!r);
    return reasons.slice(0, 5);
  }, [jobs]);

  useEffect(() => {
    if (jobs.length === 0) return;
    const run = async () => {
      setAiError(null);
      setAiLoading(true);
      try {
        const happyJobs = jobs.filter(j => j.category === 'happy').map(j => ({ name: j.job_name, reason: j.reason || undefined }));
        const painJobs = jobs.filter(j => j.category === 'pain').map(j => ({ name: j.job_name, reason: j.reason || undefined }));
        const firstMemories = jobs.map(j => j.first_memory).filter((m): m is string => !!m);

        if (happyJobs.length === 0 && painJobs.length === 0 && firstMemories.length === 0) {
          setAiPerspective('분석 가능한 데이터가 충분하지 않습니다.');
          return;
        }

        const { data, error } = await supabase.functions.invoke('analyze-perspective', {
          body: { happyJobs, painJobs, firstMemories },
        });
        if (error) throw error;
        setAiPerspective(data?.primePerspective || data?.prime_perspective || null);
      } catch (e: unknown) {
        console.error('AI 분석 실패', e);
        setAiError('AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.');
        toast({ title: 'AI 분석 실패', description: '잠시 후 다시 시도해주세요.', variant: 'destructive' });
      } finally {
        setAiLoading(false);
      }
    };

    run();
  }, [jobs]);

  return (
    <>
      <Helmet>
        <title>Prime Perspective 결과 | V-File</title>
        <meta name="description" content="당신의 분류 데이터를 분석해 Prime Perspective를 도출한 결과 페이지" />
        <link rel="canonical" href={`${window.location.origin}/results`} />
      </Helmet>
      <main className="min-h-screen bg-background text-foreground py-6">
        
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">분석 중...</div>
          ) : total === 0 ? (
            <div className="py-20 text-center space-y-4">
              <p className="text-sm text-muted-foreground">분류된 데이터가 없습니다. 먼저 직업을 분류해주세요.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate("/classify")}>분류하러 가기</Button>
                <Button variant="secondary" onClick={() => navigate("/brainstorm")}>브레인스토밍</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <header className="flex items-center justify-between">
                <h1 className="text-xl font-medium">Prime Perspective 결과</h1>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">총 {total}개 직업 분류</div>
                  <Button size="sm" onClick={() => navigate('/ikigai')}>IKIGAI 완성하기</Button>
                </div>
              </header>

              <Card className="bg-card/60">
                <CardHeader>
                  <CardTitle>{perspective.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{perspective.desc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["happy", "pain", "neutral"] as Category[]).map((c) => (
                      <div key={c} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{categoryLabels[c]}</span>
                          <span className="text-muted-foreground">{counts[c]} / {total} ({percent(counts[c])}%)</span>
                        </div>
                        <Progress value={percent(counts[c])} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60">
                <CardHeader>
                  <CardTitle>AI Prime Perspective</CardTitle>
                </CardHeader>
                <CardContent>
                  {aiLoading ? (
                    <p className="text-sm text-muted-foreground">AI 분석 중...</p>
                  ) : aiError ? (
                    <p className="text-sm text-destructive">{aiError}</p>
                  ) : aiPerspective ? (
                    <p className="text-sm whitespace-pre-wrap">{aiPerspective}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">AI 분석을 준비 중...</p>
                  )}
                </CardContent>
              </Card>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["happy", "pain", "neutral"] as Category[]).map((c) => (
                  <Card key={c} className="bg-card/60">
                    <CardHeader>
                      <CardTitle>{categoryLabels[c]} ({counts[c]})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48 pr-3">
                        <ul className="space-y-2">
                          {byCategory[c].map((j) => (
                            <li key={j.id} className="border border-border rounded-md p-2 bg-background/50">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-medium">{j.job_name}</span>
                                {j.reason && <Badge variant="secondary" className="whitespace-nowrap">이유</Badge>}
                              </div>
                              {j.reason && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.reason}</p>
                              )}
                            </li>
                          ))}
                          {byCategory[c].length === 0 && (
                            <li className="text-sm text-muted-foreground">없음</li>
                          )}
                        </ul>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>키워드 빈도</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topKeywords.length === 0 ? (
                      <p className="text-sm text-muted-foreground">키워드가 충분하지 않습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {topKeywords.map((k) => (
                          <Badge key={k.word} variant="secondary">{k.word} ({k.count})</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>감정 점수</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">전반적 감정 상태</span>
                      <span className="font-medium">{emotion.label} • {emotion.score}/100</span>
                    </div>
                    <Progress value={emotion.score} />
                    <p className="mt-2 text-xs text-muted-foreground">긍정 단서 {emotion.pos} · 부정 단서 {emotion.neg}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>패턴 인사이트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topThemes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">뚜렷한 테마가 감지되지 않았습니다.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {topThemes.map(t => (
                          <Badge key={t.name} variant="outline">{t.name} ({t.score})</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>개인화 인사이트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {insights.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {keyReasons.length > 0 && (
                  <Card className="bg-card/60 md:col-span-2">
                    <CardHeader>
                      <CardTitle>핵심 단서</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {keyReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </section>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate('/brand-design')}>브랜드 설계 시작</Button>
                <Button variant="secondary" onClick={() => navigate("/classify")}>분류 수정</Button>
                <Button onClick={() => navigate("/")}>홈으로</Button>
              </div>
            </div>
          )}
        
      </main>
    </>
  );
};

export default Results;
