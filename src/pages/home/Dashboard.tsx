import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase, veilrumDb } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, primaryMask, axisScores } = useAuth();

  // 오늘의 CODETALK 키워드
  const { data: todayKeyword } = useQuery({
    queryKey: ['today-keyword', user?.id],
    queryFn: async () => {
      const { data: profile } = await veilrumDb.from('user_profiles')
        .select('codetalk_day').eq('id', user!.id).single();
      const day = profile?.codetalk_day ?? 1;
      const { data } = await veilrumDb.from('codetalk_keywords')
        .select('*').eq('day_number', day).single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="px-4 py-6 space-y-5 max-w-sm mx-auto">
      {/* 웰컴 */}
      <div className="bg-card border rounded-2xl p-5">
        <p className="text-xs text-muted-foreground mb-1">나의 가면</p>
        <h2 className="text-xl font-bold">{primaryMask ?? '—'}</h2>
        {axisScores && (
          <div className="flex gap-3 mt-3">
            {(['A','B','C','D'] as const).map(axis => (
              <div key={axis} className="text-center">
                <div className="text-xs text-muted-foreground">{axis}</div>
                <div className="text-sm font-semibold">{axisScores[axis]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 오늘의 CODETALK */}
      <button
        onClick={() => navigate('/home/codetalk')}
        className="w-full bg-card border rounded-2xl p-5 text-left hover:border-primary/50 transition-colors"
      >
        <p className="text-xs text-muted-foreground mb-1">오늘의 CODETALK</p>
        <p className="font-semibold">{todayKeyword?.keyword ?? '키워드 로딩 중...'}</p>
        {todayKeyword?.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{todayKeyword.description}</p>
        )}
      </button>

      {/* 모듈 빠른 진입 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'DIVE', desc: '관계 상담', path: '/home/dive', emoji: '🌊' },
          { label: 'V-File', desc: '가면 재진단', path: '/home/priper', emoji: '🎭' },
          { label: 'Community', desc: '그룹 피드', path: '/home/community', emoji: '👥' },
          { label: 'CODETALK', desc: '100일 기록', path: '/home/codetalk', emoji: '💬' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="bg-card border rounded-2xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <span className="text-2xl">{item.emoji}</span>
            <p className="font-medium text-sm mt-2">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
