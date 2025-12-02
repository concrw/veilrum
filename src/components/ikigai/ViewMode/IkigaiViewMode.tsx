import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IkigaiVennDiagram } from "@/components/ikigai/IkigaiVennDiagram";
import { IkigaiExportButton } from "@/components/ikigai/IkigaiExportButton";
import { useAuth } from "@/context/AuthContext";

interface AssessmentRow {
  id: string;
  created_at: string;
  final_ikigai: string | null;
  love_elements: any;
  good_at_elements: any;
  world_needs_elements: any;
  paid_for_elements: any;
  ikigai_intersections: any;
}

interface IkigaiViewModeProps {
  loading: boolean;
  running: boolean;
  row: AssessmentRow | null;
  onLoad: () => void;
  onRunAnalysis: () => void;
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
    {children}
  </span>
);

export const IkigaiViewMode = ({
  loading,
  running,
  row,
  onLoad,
  onRunAnalysis
}: IkigaiViewModeProps) => {
  const { user } = useAuth();
  const diagramRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        데이터 로딩...
      </div>
    );
  }

  if (!row) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">아직 IKIGAI가 없습니다. AI로 생성해보세요.</p>
        <Button onClick={onRunAnalysis} size="sm">IKIGAI 생성</Button>
      </div>
    );
  }

  const love = Array.isArray(row?.love_elements) ? row.love_elements : [];
  const goodAt = Array.isArray(row?.good_at_elements) ? row.good_at_elements : [];
  const needs = Array.isArray(row?.world_needs_elements) ? row.world_needs_elements : [];
  const paid = Array.isArray(row?.paid_for_elements) ? row.paid_for_elements : [];
  const inter = row?.ikigai_intersections || {};
  const completeness = inter?.completeness || { love: 0, good_at: 0, world_needs: 0, paid_for: 0 };

  const ikigaiData = {
    love,
    goodAt,
    worldNeeds: needs,
    paidFor: paid
  };

  return (
    <>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-medium">IKIGAI 완성</h1>
        <div className="flex items-center gap-2">
          <IkigaiExportButton
            diagramRef={diagramRef}
            userName={user?.email || "User"}
            data={ikigaiData}
          />
          <Button variant="secondary" onClick={onLoad} size="sm" className="text-xs">
            새로고침
          </Button>
          <Button onClick={onRunAnalysis} disabled={running} size="sm" className="text-xs">
            {running ? "AI 생성 중..." : "AI로 업데이트"}
          </Button>
        </div>
      </header>

      <div className="space-y-4 animate-fade-in">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm">최종 IKIGAI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{row.final_ikigai}</p>
          </CardContent>
        </Card>

        {/* Venn Diagram & Progress */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div ref={diagramRef}>
            <IkigaiVennDiagram
              data={ikigaiData}
              interactive={true}
              size="sm"
              showLabels={true}
            />
          </div>

          <div className="space-y-3">
            <Card className="bg-card/60">
              <CardHeader><CardTitle className="text-sm">완성도</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { k: "love", label: "LOVE" },
                  { k: "good_at", label: "GOOD AT" },
                  { k: "world_needs", label: "WORLD NEEDS" },
                  { k: "paid_for", label: "PAID FOR" }
                ].map((it) => (
                  <div key={it.k}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{it.label}</span>
                      <span className="text-muted-foreground">{completeness[it.k] ?? 0}%</span>
                    </div>
                    <Progress value={completeness[it.k] ?? 0} className="h-1" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/60">
              <CardHeader><CardTitle className="text-sm">개선 제안</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {completeness.world_needs < 60 && (
                    <li>타깃의 Pain Points를 더 구체화해보세요.</li>
                  )}
                  {completeness.paid_for < 60 && (
                    <li>수익화 경로(컨설팅, 강의, 콘텐츠 등)를 구체화하세요.</li>
                  )}
                  {completeness.good_at < 60 && (
                    <li>경험 노트와 사례를 더 추가해 강점을 명확히 하세요.</li>
                  )}
                  {completeness.love < 60 && (
                    <li>행복 직업의 이유를 정리하며 선호의 패턴을 찾으세요.</li>
                  )}
                  {completeness.love >= 60 && completeness.good_at >= 60 && 
                   completeness.world_needs >= 60 && completeness.paid_for >= 60 && (
                    <li>네 원소가 균형적입니다. IKIGAI를 행동 계획으로 전환하세요.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Four Quadrants */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: "LOVE", list: love },
            { title: "GOOD AT", list: goodAt },
            { title: "WORLD NEEDS", list: needs },
            { title: "PAID FOR", list: paid }
          ].map((g) => (
            <Card key={g.title} className="bg-card/60">
              <CardHeader><CardTitle className="text-xs">{g.title}</CardTitle></CardHeader>
              <CardContent>
                {g.list.length === 0 ? (
                  <p className="text-xs text-muted-foreground">항목이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {g.list.map((v: any, i: number) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="text-xs hover-scale" 
                        title={String(v)}
                      >
                        {String(v).slice(0, 20)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Intersections */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: "Passion (LOVE ∩ GOOD AT)", list: inter?.Passion || [] },
            { title: "Mission (LOVE ∩ WORLD)", list: inter?.Mission || [] },
            { title: "Profession (GOOD AT ∩ PAID)", list: inter?.Profession || [] },
            { title: "Vocation (WORLD ∩ PAID)", list: inter?.Vocation || [] }
          ].map((g) => (
            <Card key={g.title} className="bg-card/60">
              <CardHeader><CardTitle className="text-xs">{g.title}</CardTitle></CardHeader>
              <CardContent>
                {g.list.length === 0 ? (
                  <p className="text-xs text-muted-foreground">항목이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {g.list.map((v: any, i: number) => (
                      <Pill key={i}>{String(v)}</Pill>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </>
  );
};