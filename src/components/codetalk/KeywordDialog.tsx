import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, TrendingUp, Users } from "lucide-react";
import { useKeywordDetails } from "@/hooks/useKeywordDetails";

interface KeywordDialogProps {
  keyword: string;
  definitionCount: number;
  children: React.ReactNode;
}

export const KeywordDialog = ({ keyword, definitionCount, children }: KeywordDialogProps) => {
  const { data: keywordDetails, isLoading } = useKeywordDetails(keyword);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto m-2">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-2xl font-bold flex items-center gap-2">
            {keyword}
            <Badge variant="secondary" className="text-xs">
              {definitionCount}개 정의
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 통계 요약 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">통계 요약</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">가장 많은 감정</span>
                  </div>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">로딩 중...</p>
                  ) : keywordDetails ? (
                    <p className="text-sm text-muted-foreground">
                      이 키워드는 주로 <span className="font-semibold text-primary">{keywordDetails.insights.mostCommonEmotion}</span>적인 감정으로 해석됩니다.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">평균 공감도</span>
                  </div>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">로딩 중...</p>
                  ) : keywordDetails ? (
                    <p className="text-sm text-muted-foreground">
                      정의당 평균 <span className="font-semibold text-primary">{keywordDetails.insights.averageLikes}개</span>의 좋아요를 받고 있습니다.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">참여자 수</span>
                  </div>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">로딩 중...</p>
                  ) : keywordDetails ? (
                    <p className="text-sm text-muted-foreground">
                      총 <span className="font-semibold text-primary">{keywordDetails.insights.uniqueAuthors}명</span>이 참여했습니다.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">평균 길이</span>
                  </div>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">로딩 중...</p>
                  ) : keywordDetails ? (
                    <p className="text-sm text-muted-foreground">
                      평균 <span className="font-semibold text-primary">{keywordDetails.insights.averageLength}자</span>로 작성됩니다.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 주요 정의들 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">주요 정의들</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">정의를 불러오는 중...</p>
                </div>
              ) : keywordDetails && keywordDetails.definitions.length > 0 ? (
                keywordDetails.definitions.map((def, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <p className="text-sm mb-2">"{def.text}"</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>- {def.author}</span>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-xs">
                            {def.emotion}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{def.likes}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">아직 정의가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};