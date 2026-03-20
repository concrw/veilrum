import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface IkigaiData {
  love_elements: string[];
  good_at_elements: string[];
  world_needs_elements: string[];
  paid_for_elements: string[];
  final_ikigai_text: string | null;
}

interface WhyAnalysisData {
  happy_jobs: Array<{ name: string; reason?: string }>;
  pain_jobs: Array<{ name: string; reason?: string }>;
  prime_perspective: string | null;
}

interface BrandAnalysisPanelProps {
  ikigaiData: IkigaiData | null;
  whyData: WhyAnalysisData | null;
  hasRequiredData: boolean;
  onNavigateToIkigai: () => void;
  onNavigateToWhy: () => void;
}

export const BrandAnalysisPanel = ({
  ikigaiData,
  whyData,
  hasRequiredData,
  onNavigateToIkigai,
  onNavigateToWhy
}: BrandAnalysisPanelProps) => {
  // Calculate completeness scores
  const ikigaiCompleteness = ikigaiData ? {
    love: ikigaiData.love_elements?.length || 0,
    goodAt: ikigaiData.good_at_elements?.length || 0,
    worldNeeds: ikigaiData.world_needs_elements?.length || 0,
    paidFor: ikigaiData.paid_for_elements?.length || 0,
    total: (ikigaiData.love_elements?.length || 0) + 
           (ikigaiData.good_at_elements?.length || 0) + 
           (ikigaiData.world_needs_elements?.length || 0) + 
           (ikigaiData.paid_for_elements?.length || 0)
  } : null;

  const whyCompleteness = whyData ? {
    happy: whyData.happy_jobs?.length || 0,
    pain: whyData.pain_jobs?.length || 0,
    perspective: whyData.prime_perspective ? 1 : 0,
    total: (whyData.happy_jobs?.length || 0) + (whyData.pain_jobs?.length || 0)
  } : null;

  return (
    <div className="space-y-4">
      {/* Data Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            {hasRequiredData ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
            데이터 준비 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ikigai Status */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium">Ikigai 데이터</h4>
                {ikigaiData ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              
              {ikigaiData && ikigaiCompleteness ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    총 {ikigaiCompleteness.total}개 항목 완료
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>LOVE: {ikigaiCompleteness.love}개</div>
                    <div>GOOD AT: {ikigaiCompleteness.goodAt}개</div>
                    <div>WORLD: {ikigaiCompleteness.worldNeeds}개</div>
                    <div>PAID: {ikigaiCompleteness.paidFor}개</div>
                  </div>
                  {ikigaiData.final_ikigai_text && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <strong>Ikigai:</strong> {ikigaiData.final_ikigai_text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Ikigai 설계가 필요합니다
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onNavigateToIkigai}
                    className="text-xs h-6"
                  >
                    Ikigai 설계하기
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            {/* Why Analysis Status */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium">Why 분석 데이터</h4>
                {whyData ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              
              {whyData && whyCompleteness ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    총 {whyCompleteness.total}개 직업 분석 완료
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>행복: {whyCompleteness.happy}개</div>
                    <div>고통: {whyCompleteness.pain}개</div>
                  </div>
                  {whyData.prime_perspective && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <strong>Prime Perspective:</strong><br />
                      {whyData.prime_perspective}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Why 분석이 필요합니다
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onNavigateToWhy}
                    className="text-xs h-6"
                  >
                    Why 분석하기
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Preview */}
      {hasRequiredData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ikigai Elements Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ikigai 구성 요소</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: "LOVE", items: ikigaiData?.love_elements || [], color: "bg-red-500/20" },
                  { title: "GOOD AT", items: ikigaiData?.good_at_elements || [], color: "bg-blue-500/20" },
                  { title: "WORLD NEEDS", items: ikigaiData?.world_needs_elements || [], color: "bg-green-500/20" },
                  { title: "PAID FOR", items: ikigaiData?.paid_for_elements || [], color: "bg-yellow-500/20" }
                ].map((section) => (
                  <div key={section.title}>
                    <h5 className="text-xs font-medium mb-1">{section.title}</h5>
                    <div className="flex flex-wrap gap-1">
                      {section.items.slice(0, 3).map((item, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className={`text-xs ${section.color}`}
                        >
                          {item}
                        </Badge>
                      ))}
                      {section.items.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{section.items.length - 3}개 더
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Why Analysis Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Why 분석 패턴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-medium mb-1 text-green-600">행복 패턴</h5>
                  <div className="flex flex-wrap gap-1">
                    {whyData?.happy_jobs.slice(0, 4).map((job, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-green-500/20">
                        {job.name}
                      </Badge>
                    ))}
                    {(whyData?.happy_jobs.length || 0) > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{(whyData?.happy_jobs.length || 0) - 4}개 더
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-medium mb-1 text-red-600">고통 패턴</h5>
                  <div className="flex flex-wrap gap-1">
                    {whyData?.pain_jobs.slice(0, 4).map((job, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-red-500/20">
                        {job.name}
                      </Badge>
                    ))}
                    {(whyData?.pain_jobs.length || 0) > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{(whyData?.pain_jobs.length || 0) - 4}개 더
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Missing Data Warning */}
      {!hasRequiredData && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">데이터 준비 필요</h4>
                <p className="text-xs text-amber-700 mt-1">
                  브랜드 전략을 생성하려면 Ikigai 설계와 Why 분석을 먼저 완료해야 합니다.
                </p>
                <div className="flex gap-2 mt-3">
                  {!ikigaiData && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={onNavigateToIkigai}
                      className="text-xs h-6 border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Ikigai 설계하기
                    </Button>
                  )}
                  {!whyData && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={onNavigateToWhy}
                      className="text-xs h-6 border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Why 분석하기
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};