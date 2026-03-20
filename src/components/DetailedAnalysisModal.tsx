import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Job {
  id: string;
  job_name: string;
  category: "happy" | "pain" | "neutral" | null;
  reason?: string | null;
  definition?: string | null;
  first_memory?: string | null;
}

interface DetailedAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
}

type Category = "happy" | "pain" | "neutral";

const categoryLabels: Record<Category, string> = {
  happy: "HAPPINESS",
  pain: "SUFFERING", 
  neutral: "NEUTRAL",
};

const categoryColors: Record<Category, string> = {
  happy: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  pain: "bg-red-500/20 text-red-700 dark:text-red-300",
  neutral: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
};

export function DetailedAnalysisModal({ open, onOpenChange, jobs }: DetailedAnalysisModalProps) {
  const categorizedJobs = useMemo(() => jobs.filter(j => j.category !== null), [jobs]);
  const total = categorizedJobs.length;

  const byCategory = useMemo(() => ({
    happy: categorizedJobs.filter(j => j.category === "happy"),
    pain: categorizedJobs.filter(j => j.category === "pain"),
    neutral: categorizedJobs.filter(j => j.category === "neutral"),
  }), [categorizedJobs]);

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
    if (!dominant) return { title: "데이터 없음", desc: "분류된 직업이 없습니다." };
    if (dominant === "tie") return { title: "균형형 Prime Perspective", desc: "행복/고통/중립의 균형 잡힌 관점을 가지고 있습니다. 다양한 가능성을 탐색하고 객관적으로 판단하는 성향입니다." };
    if (dominant === "happy") return { title: "행복 중심 Prime Perspective", desc: "기쁨과 동기를 주는 일을 우선시합니다. 에너지와 몰입을 만들어내는 환경에서 강점을 발휘합니다." };
    if (dominant === "pain") return { title: "문제 해결 중심 Prime Perspective", desc: "불편과 비효율을 포착하고 개선합니다. 고통을 줄이는 데서 의미와 동기를 찾습니다." };
    return { title: "균형·분석 중심 Prime Perspective", desc: "사실 기반으로 판단하며 안정과 지속 가능성을 중시합니다. 감정에 치우치지 않고 본질을 봅니다." };
  }, [dominant]);

  const percent = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  // 키워드 분석
  const STOPWORDS = useMemo(() => new Set([
    "의","가","이","을","를","은","는","에","에서","와","과","그리고","또한","하지만","또","등","때","수","것","들","더","그","다","로","으로","하다","했다","되다","있다","없다",
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
    const chunks = categorizedJobs.flatMap(j => [j.job_name, j.definition, j.first_memory, j.reason]);
    const joined = normalize(chunks.filter(Boolean).join(" "));
    return tokenize(joined);
  }, [categorizedJobs]);

  const topKeywords = useMemo(() => {
    const freq = new Map<string, number>();
    for (const t of allTokens) freq.set(t, (freq.get(t) || 0) + 1);
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({ word, count }));
  }, [allTokens]);

  // 감정 분석
  const POSITIVE_WORDS = useMemo(() => new Set([
    "행복","즐거움","기쁨","의미","성장","몰입","흥미","재미","보람","안정","자유","도전","성취","배움","협업","공감","감사","즐겁다","좋다",
    "happy","joy","meaningful","growth","flow","interest","fun","rewarding","stable","freedom","challenge","achievement","learn","collaboration","empathy","great","good","love"
  ]), []);
  
  const NEGATIVE_WORDS = useMemo(() => new Set([
    "고통","힘듦","스트레스","불안","지루","반복","혼란","갈등","위험","불확실","야근","피로","소모","압박","부담","짜증","싫다",
    "pain","suffering","hard","stress","anxious","boring","repetitive","conflict","risk","uncertainty","overtime","fatigue","burnout","pressure","hate","bad"
  ]), []);

  const emotion = useMemo(() => {
    let pos = 0, neg = 0;
    for (const t of allTokens) {
      if (POSITIVE_WORDS.has(t)) pos++;
      if (NEGATIVE_WORDS.has(t)) neg++;
    }
    const categoryBoost = 2 * counts.happy - 2 * counts.pain;
    const raw = (pos - neg) + categoryBoost;
    const score = Math.max(0, Math.min(100, Math.round(50 + raw * 5)));
    const label = score > 60 ? "긍정적" : score < 40 ? "부정적" : "중립";
    return { score, label };
  }, [allTokens, counts.happy, counts.pain, POSITIVE_WORDS, NEGATIVE_WORDS]);

  // 인사이트 생성
  const insights = useMemo(() => {
    const list: string[] = [];
    if (dominant === "happy") list.push("즐거움과 동기를 제공하는 업무 환경에서 높은 성과를 보일 것으로 예상됩니다.");
    if (dominant === "pain") list.push("문제점을 발견하고 개선하는 역할에서 탁월한 강점을 보일 것입니다.");
    if (dominant === "neutral") list.push("객관적이고 안정적인 판단을 중시하는 경향이 있습니다.");
    if (dominant === "tie") list.push("균형 잡힌 시각으로 다양한 가능성을 탐색하는 특성을 가지고 있습니다.");

    list.push(`현재 전반적 감정 상태는 ${emotion.label}입니다 (${emotion.score}/100점).`);

    if (topKeywords.length > 0) {
      const topThree = topKeywords.slice(0, 3).map(k => k.word).join(", ");
      list.push(`핵심 키워드: ${topThree}`);
    }

    return list;
  }, [dominant, emotion.label, emotion.score, topKeywords]);

  if (total === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>상세 분석 결과</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>분류된 직업이 없습니다.</p>
            <p className="text-sm mt-2">먼저 3단계에서 직업을 분류해주세요.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>상세 분석 결과</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="pr-3">
          <div className="space-y-6">
            {/* Prime Perspective */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{perspective.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{perspective.desc}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  {(["happy", "pain", "neutral"] as Category[]).map((c) => (
                    <div key={c} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{categoryLabels[c]}</span>
                        <span className="text-muted-foreground">{counts[c]} / {total} ({percent(counts[c])}%)</span>
                      </div>
                      <Progress value={percent(counts[c])} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 인사이트 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">핵심 인사이트</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 카테고리별 상세 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["happy", "pain", "neutral"] as Category[]).map((c) => (
                <Card key={c}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[c]}`}>
                        {categoryLabels[c]}
                      </span>
                      <span>({counts[c]}개)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {byCategory[c].map((job) => (
                          <div key={job.id} className="text-sm border border-border rounded p-2 bg-muted/20">
                            <div className="font-medium mb-1">{job.job_name}</div>
                            {job.reason && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                이유: {job.reason}
                              </div>
                            )}
                          </div>
                        ))}
                        {byCategory[c].length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            해당 카테고리에 분류된 직업이 없습니다
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 키워드 분석 & 감정 점수 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">키워드 클라우드</CardTitle>
                </CardHeader>
                <CardContent>
                  {topKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">분석할 키워드가 충분하지 않습니다.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {topKeywords.map((k, idx) => (
                        <Badge 
                          key={k.word} 
                          variant={idx < 3 ? "default" : "secondary"}
                          className={idx < 3 ? "bg-primary/80" : ""}
                        >
                          {k.word} ({k.count})
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">감정 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">감정 점수</span>
                      <span className="font-medium">{emotion.score}/100</span>
                    </div>
                    <Progress value={emotion.score} className="h-3" />
                    <div className="text-center">
                      <Badge variant={emotion.score > 60 ? "default" : emotion.score < 40 ? "destructive" : "secondary"}>
                        {emotion.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 추천 액션 아이템 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">추천 액션 아이템</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {dominant === "happy" && (
                    <>
                      <div>• 즐거움을 주는 업무에 더 많은 시간을 투자하세요</div>
                      <div>• 동기부여가 되는 프로젝트나 역할을 찾아보세요</div>
                      <div>• 팀 협업과 창의적 환경에서 성장할 수 있는 기회를 탐색하세요</div>
                    </>
                  )}
                  {dominant === "pain" && (
                    <>
                      <div>• 문제 해결 능력을 활용할 수 있는 역할을 찾아보세요</div>
                      <div>• 프로세스 개선이나 효율성 향상 프로젝트에 참여하세요</div>
                      <div>• 분석적 사고를 요구하는 업무에 집중하세요</div>
                    </>
                  )}
                  {dominant === "neutral" && (
                    <>
                      <div>• 안정적이고 체계적인 업무 환경을 선택하세요</div>
                      <div>• 객관적 판단이 중요한 역할에 강점을 발휘하세요</div>
                      <div>• 균형 잡힌 업무 분배로 번아웃을 방지하세요</div>
                    </>
                  )}
                  {dominant === "tie" && (
                    <>
                      <div>• 다양한 업무를 경험할 수 있는 기회를 찾아보세요</div>
                      <div>• 균형감을 활용해 팀 내 조율 역할을 맡아보세요</div>
                      <div>• 새로운 분야에 도전해보며 관심사를 확장하세요</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}