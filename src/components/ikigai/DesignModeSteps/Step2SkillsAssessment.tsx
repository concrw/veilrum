import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Plus, X, AlertCircle } from "lucide-react";
import { useMasterData } from "@/hooks/useMasterData";

interface Skill {
  name: string;
  level: number;
  category: string;
}

interface Step2SkillsAssessmentProps {
  skills: Skill[];
  newSkill: Skill;
  onNewSkillChange: (skill: Skill) => void;
  onAddSkill: () => void;
  onRemoveSkill: (index: number) => void;
  onUpdateSkillLevel: (index: number, level: number[]) => void;
}

export const Step2SkillsAssessment = ({
  skills,
  newSkill,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
  onUpdateSkillLevel
}: Step2SkillsAssessmentProps) => {
  const { skillCategories, loading, error } = useMasterData();

  // 스킬 카테고리 옵션 (DB에서 로드된 것들 + 폴백)
  const categoryOptions = skillCategories.length > 0 
    ? skillCategories.map(cat => cat.category_name)
    : ["기술", "창작", "소통", "분석", "기타"]; // 폴백 옵션

  // 카테고리별 색상 매핑
  const getCategoryColor = (categoryName: string) => {
    const category = skillCategories.find(cat => cat.category_name === categoryName);
    return category?.color_code || '#6B7280';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-muted-foreground">스킬 카테고리를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">💪</span>
          잘하는 것 (GOOD AT)
        </CardTitle>
        <p className="text-xs text-muted-foreground">숙련도 3점 이상인 스킬들이 "잘하는 것"으로 분류됩니다</p>
        
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>카테고리 로드 중 문제가 발생했습니다. 기본 옵션을 제공합니다.</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Skill */}
        <div className="border rounded-lg p-3 space-y-3">
          <h4 className="text-xs font-medium">새 스킬 추가</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input 
              placeholder="스킬명 입력" 
              value={newSkill.name}
              onChange={(e) => onNewSkillChange({...newSkill, name: e.target.value})}
              className="text-xs"
            />
            <select 
              className="px-2 py-1 border rounded-md bg-background text-xs"
              value={newSkill.category}
              onChange={(e) => onNewSkillChange({...newSkill, category: e.target.value})}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs">레벨:</span>
              <Slider
                value={[newSkill.level]}
                onValueChange={(value) => onNewSkillChange({...newSkill, level: value[0]})}
                max={5}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-medium w-4">{newSkill.level}</span>
            </div>
            <Button onClick={onAddSkill} size="sm" className="h-8">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Available Categories Info */}
        {skillCategories.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <h5 className="text-xs font-medium mb-2">사용 가능한 카테고리</h5>
            <div className="flex flex-wrap gap-1">
              {skillCategories.map((category) => (
                <Badge 
                  key={category.id} 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: category.color_code,
                    color: category.color_code
                  }}
                >
                  {category.category_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills List */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium">현재 스킬 목록</h4>
          {skills.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              아직 추가된 스킬이 없습니다. 스킬을 추가해주세요.
            </div>
          ) : (
            skills.map((skill, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: getCategoryColor(skill.category),
                          color: getCategoryColor(skill.category)
                        }}
                      >
                        {skill.category}
                      </Badge>
                      {skill.level >= 3 && (
                        <Badge variant="default" className="text-xs">잘하는 것</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">숙련도:</span>
                      <Slider
                        value={[skill.level]}
                        onValueChange={(value) => onUpdateSkillLevel(index, value)}
                        max={5}
                        min={1}
                        step={1}
                        className="flex-1 max-w-32"
                      />
                      <span className="text-xs font-medium w-8">{skill.level}/5</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRemoveSkill(index)} className="h-8 w-8 p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Statistics */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            전체 스킬: {skills.length}개 | 
            잘하는 것 (3점 이상): {skills.filter(s => s.level >= 3).length}개 |
            평균 숙련도: {skills.length > 0 ? (skills.reduce((sum, s) => sum + s.level, 0) / skills.length).toFixed(1) : 0}점
          </p>
        </div>
      </CardContent>
    </Card>
  );
};