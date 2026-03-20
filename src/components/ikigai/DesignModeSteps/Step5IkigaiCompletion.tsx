import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IkigaiVennDiagram } from "@/components/ikigai/IkigaiVennDiagram";
import { IkigaiExportButton } from "@/components/ikigai/IkigaiExportButton";
import { useAuth } from "@/context/AuthContext";

interface DesignedIkigai {
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
}

interface Intersections {
  passion: string[];
  mission: string[];
  profession: string[];
  vocation: string[];
}

interface Step5IkigaiCompletionProps {
  designedIkigai: DesignedIkigai;
  intersections: Intersections;
}

export const Step5IkigaiCompletion = ({
  designedIkigai,
  intersections
}: Step5IkigaiCompletionProps) => {
  const { user } = useAuth();
  const diagramRef = useRef<HTMLDivElement>(null);

  const ikigaiText = designedIkigai.love[0] && designedIkigai.goodAt[0]
    ? `${designedIkigai.love[0]}을 통한 ${designedIkigai.goodAt[0]} 전문가`
    : "각 영역을 완성해주세요";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">🎯 설계된 IKIGAI</CardTitle>
          <IkigaiExportButton
            diagramRef={diagramRef}
            userName={user?.email || "User"}
            data={designedIkigai}
          />
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg mb-4">
            <div className="text-xs font-medium mb-1">당신의 IKIGAI는</div>
            <div className="text-sm font-bold text-primary">{ikigaiText}</div>
          </div>

          {/* Venn Diagram */}
          <div ref={diagramRef}>
            <IkigaiVennDiagram
              data={designedIkigai}
              interactive={true}
              size="md"
              showLabels={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Four Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { title: "LOVE", items: designedIkigai.love, color: "bg-primary/20" },
          { title: "GOOD AT", items: designedIkigai.goodAt, color: "bg-secondary/20" },
          { title: "WORLD NEEDS", items: designedIkigai.worldNeeds, color: "bg-accent/20" },
          { title: "PAID FOR", items: designedIkigai.paidFor, color: "bg-green-500/20" }
        ].map((section) => (
          <Card key={section.title} className={section.color}>
            <CardHeader>
              <CardTitle className="text-xs">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {section.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">항목이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {section.items.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{item}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Intersections Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs">교집합 분석</CardTitle>
          <p className="text-xs text-muted-foreground">3가지 조건은 만족하지만 1가지가 빠진 영역들을 확인하세요</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-lg p-3">
              <h4 className="text-xs font-medium text-green-600 mb-2">✅ 완성된 영역</h4>
              <div className="space-y-1 text-xs">
                {intersections.passion.length > 0 && (
                  <div>• Passion: {intersections.passion.join(", ")}</div>
                )}
                {intersections.mission.length > 0 && (
                  <div>• Mission: {intersections.mission.join(", ")}</div>
                )}
                {intersections.profession.length > 0 && (
                  <div>• Profession: {intersections.profession.join(", ")}</div>
                )}
                {intersections.vocation.length > 0 && (
                  <div>• Vocation: {intersections.vocation.join(", ")}</div>
                )}
                {Object.values(intersections).every(arr => arr.length === 0) && (
                  <div className="text-muted-foreground">아직 완성된 교집합이 없습니다</div>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="text-xs font-medium text-amber-600 mb-2">⚠️ 개선 필요 영역</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {designedIkigai.worldNeeds.length === 0 && (
                  <div>• 사회적 가치 영역이 비어있습니다</div>
                )}
                {designedIkigai.paidFor.length === 0 && (
                  <div>• 수익화 영역이 비어있습니다</div>
                )}
                {designedIkigai.goodAt.length === 0 && (
                  <div>• 숙련도 3점 이상 스킬이 없습니다</div>
                )}
                {designedIkigai.worldNeeds.length > 0 && 
                 designedIkigai.paidFor.length > 0 && 
                 designedIkigai.goodAt.length > 0 && (
                  <div>모든 영역이 채워져 있습니다!</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};