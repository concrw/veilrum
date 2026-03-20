import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, AlertCircle } from "lucide-react";
import { useMasterData, type CustomerCohort } from "@/hooks/useMasterData";

interface Step4RevenueOpportunitiesProps {
  selectedCohorts: string[];
  customRevenue: string;
  onCustomRevenueChange: (value: string) => void;
  onToggleCohort: (cohort: string, checked: boolean) => void;
  onAddCustomRevenue: () => void;
  onRemoveCohort: (cohort: string) => void;
}

export const Step4RevenueOpportunities = ({
  selectedCohorts,
  customRevenue,
  onCustomRevenueChange,
  onToggleCohort,
  onAddCustomRevenue,
  onRemoveCohort
}: Step4RevenueOpportunitiesProps) => {
  const { customerCohorts, loading, error } = useMasterData();

  // 카테고리별로 그룹화
  const groupedCohorts = customerCohorts.reduce((acc, cohort) => {
    const category = cohort.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cohort);
    return acc;
  }, {} as Record<string, CustomerCohort[]>);

  // 추천 고객 코호트 목록 (DB에서 로드된 것들)
  const suggestedCohorts = customerCohorts.map(cohort => `${cohort.segment}: ${cohort.pain_points}`);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-muted-foreground">고객 코호트 목록을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">💰</span>
          돈 벌 수 있는 것 (PAID FOR)
        </CardTitle>
        <p className="text-xs text-muted-foreground">특정 문제를 가진 고객군과 수익 기회를 확인하세요</p>
        
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>데이터 로드 중 문제가 발생했습니다. 기본 옵션을 제공합니다.</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Cohorts by Category */}
        <div>
          <h4 className="text-xs font-medium mb-3">페인 포인트가 있는 고객군</h4>
          
          {Object.keys(groupedCohorts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedCohorts).map(([category, cohorts]) => (
                <div key={category}>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2 capitalize">
                    {category === 'general' ? '일반' : category}
                  </h5>
                  <div className="grid gap-2 pl-2">
                    {cohorts.map((cohort) => {
                      const value = `${cohort.segment}: ${cohort.pain_points}`;
                      return (
                        <label 
                          key={cohort.id} 
                          className="flex items-start space-x-3 cursor-pointer border rounded-lg p-2 hover:bg-muted/50"
                        >
                          <Checkbox 
                            checked={selectedCohorts.includes(value)}
                            onCheckedChange={(checked) => onToggleCohort(value, !!checked)}
                          />
                          <div>
                            <div className="text-xs font-medium">{cohort.segment}</div>
                            <div className="text-xs text-muted-foreground">{cohort.pain_points}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">사용 가능한 고객 코호트가 없습니다.</p>
            </div>
          )}
        </div>

        {/* Custom Revenue Opportunity */}
        <div className="border rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-medium">수익 기회 직접 입력</h4>
          <div className="flex gap-2">
            <Textarea 
              placeholder="발견한 수익 기회나 고객의 문제를 입력하세요" 
              value={customRevenue}
              onChange={(e) => onCustomRevenueChange(e.target.value)}
              rows={2}
              className="text-xs"
            />
            <Button onClick={onAddCustomRevenue} size="sm" className="h-8 mt-1">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Selected Items */}
        {selectedCohorts.length > 0 && (
          <div>
            <h4 className="text-xs font-medium mb-2">선택된 수익 기회</h4>
            <div className="space-y-1">
              {selectedCohorts.map((item, index) => {
                const isCustom = !suggestedCohorts.includes(item);
                return (
                  <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                    <div className="flex-1">
                      <span className="text-xs">{item}</span>
                      {isCustom && (
                        <Badge variant="outline" className="text-xs ml-2">직접입력</Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveCohort(item)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            선택된 항목: {selectedCohorts.length}개 | 
            전체 옵션: {customerCohorts.length}개 |
            직접 입력: {selectedCohorts.filter(item => !suggestedCohorts.includes(item)).length}개
          </p>
        </div>
      </CardContent>
    </Card>
  );
};