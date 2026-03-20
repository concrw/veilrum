import { useState, useEffect } from "react";
import { KeywordCard } from "./KeywordCard";
import { RefreshCw, Heart, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Story {
  id: string;
  keyword: string;
  definition: string;
  memory: string;
  author: string;
  reactions: number;
}

interface StoryFeedProps {
  stories: Story[];
  onRefresh: () => void;
  todayKeyword: string;
}

export function StoryFeed({ stories, onRefresh, todayKeyword }: StoryFeedProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 디버깅: stories 데이터 확인
  useEffect(() => {
    console.log('🔍 [StoryFeed] Received stories:', stories);
    console.log('🔍 [StoryFeed] Stories length:', stories?.length || 0);
    console.log('🔍 [StoryFeed] Today keyword:', todayKeyword);
  }, [stories, todayKeyword]);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleLike = (storyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setLikedStories(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(storyId)) {
        newLiked.delete(storyId);
      } else {
        newLiked.add(storyId);
      }
      return newLiked;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLiked = (storyId: string) => likedStories.has(storyId);

  // 스토리가 없을 때의 메시지 (하지만 이미 참여했으므로 다른 메시지)
  const renderEmptyState = () => (
    <div className="text-center py-12 space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">
          아직 다른 사람의 이야기가 없습니다
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          다른 사용자들이 "{todayKeyword}" 키워드에 대한 이야기를 작성하면 여기에 표시됩니다.
          잠시 후 다시 확인해보세요!
        </p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="mt-4"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        새로고침
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            다른 사람들의 정의와 각인된 기억들 : {todayKeyword}
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{stories?.length || 0}명의 이야기</span>
            </div>
            <p>같은 단어, 다른 감정들을 만나보세요</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-border/50 hover:border-accent/50 hover:bg-accent/20"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-3 pr-4">
          {/* 스토리가 있을 때 */}
          {stories && stories.length > 0 ? (
            stories.map((story, index) => (
              <div 
                key={story.id} 
                className="bg-card/80 border border-border rounded-lg hover:border-accent/50 transition-colors backdrop-blur-sm cursor-pointer"
                onClick={() => setSelectedStory(story)}
              >
                <div className="p-4">
                  <div className="grid md:grid-cols-[2fr_3fr] gap-4">
                    <div>
                      <h4 className="text-xs text-muted-foreground mb-1">정의</h4>
                      <p className="text-foreground text-sm leading-relaxed">
                        {truncateText(story.definition)}
                      </p>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-xs text-muted-foreground mb-1">각인된 기억</h4>
                        <p className="text-foreground/80 text-sm leading-relaxed italic">
                          {truncateText(story.memory)}
                        </p>
                      </div>
                      <button
                        className={`flex items-center gap-1 transition-colors ml-4 flex-shrink-0 ${
                          isLiked(story.id) 
                            ? "text-red-400 hover:text-red-300" 
                            : "text-muted-foreground hover:text-primary"
                        }`}
                        onClick={(e) => handleLike(story.id, e)}
                      >
                        <Heart className={`w-4 h-4 ${isLiked(story.id) ? "fill-current" : ""}`} />
                        <span className="text-sm">{story.reactions}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* 스토리가 없을 때 */
            renderEmptyState()
          )}
        </div>
      </ScrollArea>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-2xl bg-card/80 border border-border backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {todayKeyword}에 대한 이야기
            </DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">정의</h3>
                <p className="text-foreground text-sm leading-relaxed bg-muted/20 p-3 rounded-lg">
                  {selectedStory.definition}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">각인된 기억</h3>
                <p className="text-foreground/80 text-sm leading-relaxed italic bg-muted/20 p-3 rounded-lg">
                  {selectedStory.memory}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedStory.reactions}개의 공감
                  </span>
                </div>
                <button
                  className={`flex items-center gap-2 transition-colors px-3 py-2 rounded-lg ${
                    isLiked(selectedStory.id)
                      ? "text-red-400 hover:text-red-300 bg-red-400/20 hover:bg-red-400/30"
                      : "text-muted-foreground hover:text-primary bg-accent/20 hover:bg-accent/30"
                  }`}
                  onClick={() => handleLike(selectedStory.id)}
                >
                  <Heart className={`w-4 h-4 ${isLiked(selectedStory.id) ? "fill-current" : ""}`} />
                  <span className="text-sm">
                    {isLiked(selectedStory.id) ? "공감함" : "공감하기"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}