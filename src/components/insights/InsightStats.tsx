interface InsightStatsProps {
  stats: {
    totalUsers?: number | null;
    totalStories?: number | null;
    totalKeywords?: number | null;
    todayStories?: number | null;
  } | null;
  isLoading: boolean;
}

export const InsightStats = ({ stats, isLoading }: InsightStatsProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">통계 로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.totalUsers != null && (
        <div className="text-center p-4 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
          <div className="text-xs text-muted-foreground">총 참가자</div>
        </div>
      )}
      {stats.totalStories != null && (
        <div className="text-center p-4 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-primary">{stats.totalStories}</div>
          <div className="text-xs text-muted-foreground">총 스토리</div>
        </div>
      )}
      {stats.totalKeywords != null && (
        <div className="text-center p-4 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-primary">{stats.totalKeywords}</div>
          <div className="text-xs text-muted-foreground">총 키워드</div>
        </div>
      )}
      {stats.todayStories != null && (
        <div className="text-center p-4 bg-card rounded-lg border">
          <div className="text-2xl font-bold text-primary">{stats.todayStories}</div>
          <div className="text-xs text-muted-foreground">오늘 스토리</div>
        </div>
      )}
    </div>
  );
};
