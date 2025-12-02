import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface ContentRecommendation {
  id: string;
  type: "article" | "course" | "book" | "video";
  title: string;
  description: string;
  url?: string;
  relevance_score: number;
  tags: string[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "article":
      return <FileText className="w-4 h-4 text-blue-500" />;
    case "course":
      return <GraduationCap className="w-4 h-4 text-green-500" />;
    case "book":
      return <BookOpen className="w-4 h-4 text-amber-500" />;
    case "video":
      return <Video className="w-4 h-4 text-red-500" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "article":
      return "아티클";
    case "course":
      return "강의";
    case "book":
      return "도서";
    case "video":
      return "영상";
    default:
      return type;
  }
};

export const ContentRecommendations = () => {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<{ recommendations: ContentRecommendation[]; keywords: string[] }>({
    queryKey: ["content-recommendations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("recommend-content");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            맞춤 콘텐츠 추천
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            맞춤 콘텐츠 추천
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground mb-3">
              추천 콘텐츠를 불러오지 못했습니다
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = data?.recommendations || [];
  const keywords = data?.keywords || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            맞춤 콘텐츠 추천
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-6 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {keywords.slice(0, 5).map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">
              아직 추천 콘텐츠가 없습니다
            </p>
            <p className="text-xs text-muted-foreground">
              Why 분석을 완료하면 맞춤 콘텐츠를 추천받을 수 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div
                key={item.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {getTypeLabel(item.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        관련도 {Math.round(item.relevance_score * 100)}%
                      </span>
                    </div>
                    <h4 className="text-sm font-medium mb-1 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => window.open(item.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
