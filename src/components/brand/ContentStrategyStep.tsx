import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Lightbulb } from "lucide-react";
import { useState } from "react";

interface ContentStrategy {
  topics: string[];
  formats: string[];
  channels: string[];
  cadence: string;
}

interface ContentStrategyStepProps {
  contentStrategy: ContentStrategy;
  onUpdate: (strategy: ContentStrategy) => void;
}

// 추천 옵션들
const suggestedTopics = [
  "실무 팁", "트렌드 분석", "케이스 스터디", "인사이트", "경험담", 
  "튜토리얼", "리뷰", "인터뷰", "Q&A", "라이프스타일"
];

const suggestedFormats = [
  "블로그 포스트", "숏폼 영상", "긴 영상", "인포그래픽", "팟캐스트", 
  "뉴스레터", "라이브 방송", "웨비나", "이미지 카드", "캐러셀"
];

const suggestedChannels = [
  "인스타그램", "유튜브", "블로그", "링크드인", "틱톡", "브런치", 
  "네이버 블로그", "페이스북", "트위터", "개인 홈페이지"
];

export const ContentStrategyStep = ({
  contentStrategy,
  onUpdate
}: ContentStrategyStepProps) => {
  const [newTopic, setNewTopic] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [newChannel, setNewChannel] = useState("");

  const updateField = (field: keyof ContentStrategy, value: string | string[]) => {
    onUpdate({
      ...contentStrategy,
      [field]: value
    });
  };

  const addItem = (field: 'topics' | 'formats' | 'channels', item: string) => {
    if (item.trim() && !contentStrategy[field].includes(item.trim())) {
      updateField(field, [...contentStrategy[field], item.trim()]);
    }
  };

  const removeItem = (field: 'topics' | 'formats' | 'channels', index: number) => {
    const newArray = [...contentStrategy[field]];
    newArray.splice(index, 1);
    updateField(field, newArray);
  };

  const addSuggested = (field: 'topics' | 'formats' | 'channels', item: string) => {
    if (!contentStrategy[field].includes(item)) {
      updateField(field, [...contentStrategy[field], item]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">📝</span>
          콘텐츠 전략
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          브랜드 콘텐츠의 주제, 형식, 채널을 설정하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Topics */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">콘텐츠 주제</Label>
          
          {/* Current Topics */}
          <div className="flex flex-wrap gap-1">
            {contentStrategy.topics.map((topic, index) => (
              <Badge key={index} variant="default" className="text-xs">
                {topic}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('topics', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Topic */}
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="새 주제 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('topics', newTopic);
                  setNewTopic("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('topics', newTopic);
                setNewTopic("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Topics */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 주제:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedTopics
                .filter(topic => !contentStrategy.topics.includes(topic))
                .map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('topics', topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Formats */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">콘텐츠 형식</Label>
          
          {/* Current Formats */}
          <div className="flex flex-wrap gap-1">
            {contentStrategy.formats.map((format, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {format}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('formats', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Format */}
          <div className="flex gap-2">
            <Input
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value)}
              placeholder="새 형식 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('formats', newFormat);
                  setNewFormat("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('formats', newFormat);
                setNewFormat("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Formats */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 형식:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedFormats
                .filter(format => !contentStrategy.formats.includes(format))
                .map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('formats', format)}
                >
                  {format}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">배포 채널</Label>
          
          {/* Current Channels */}
          <div className="flex flex-wrap gap-1">
            {contentStrategy.channels.map((channel, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {channel}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('channels', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Channel */}
          <div className="flex gap-2">
            <Input
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="새 채널 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('channels', newChannel);
                  setNewChannel("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('channels', newChannel);
                setNewChannel("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Channels */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 채널:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedChannels
                .filter(channel => !contentStrategy.channels.includes(channel))
                .map((channel) => (
                <Button
                  key={channel}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('channels', channel)}
                >
                  {channel}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Cadence */}
        <div className="space-y-2">
          <Label htmlFor="cadence" className="text-xs font-medium">
            발행 빈도
          </Label>
          <Input
            id="cadence"
            value={contentStrategy.cadence}
            onChange={(e) => updateField('cadence', e.target.value)}
            placeholder="예: 주 3회, 매일, 격주"
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            지속 가능한 빈도로 설정하세요
          </p>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
            <div>
              <h5 className="text-xs font-medium mb-1">콘텐츠 전략 팁</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>주제</strong>: 타겟 고객의 관심사와 일치하는 주제 선택</li>
                <li>• <strong>형식</strong>: 본인이 잘 만들 수 있는 형식부터 시작</li>
                <li>• <strong>채널</strong>: 타겟이 많이 이용하는 플랫폼 우선</li>
                <li>• <strong>빈도</strong>: 꾸준함이 가장 중요합니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-4">
          <h5 className="text-xs font-medium mb-2">콘텐츠 전략 요약</h5>
          <div className="bg-background border rounded-lg p-3 space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">주제({contentStrategy.topics.length}개):</span>{" "}
              {contentStrategy.topics.slice(0, 3).join(", ")}
              {contentStrategy.topics.length > 3 && ` 외 ${contentStrategy.topics.length - 3}개`}
            </div>
            <div>
              <span className="text-muted-foreground">형식({contentStrategy.formats.length}개):</span>{" "}
              {contentStrategy.formats.slice(0, 3).join(", ")}
              {contentStrategy.formats.length > 3 && ` 외 ${contentStrategy.formats.length - 3}개`}
            </div>
            <div>
              <span className="text-muted-foreground">채널({contentStrategy.channels.length}개):</span>{" "}
              {contentStrategy.channels.slice(0, 3).join(", ")}
              {contentStrategy.channels.length > 3 && ` 외 ${contentStrategy.channels.length - 3}개`}
            </div>
            <div>
              <span className="text-muted-foreground">빈도:</span>{" "}
              {contentStrategy.cadence || "빈도를 설정하세요"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};