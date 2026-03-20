import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CommunityPage() {
  const { user } = useAuth();

  const { data: groups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .schema('veilrum').from('community_groups')
        .select('*').order('sort_order').limit(24);
      return data ?? [];
    },
  });

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <h2 className="text-lg font-semibold">커뮤니티 그룹</h2>
      <p className="text-sm text-muted-foreground">당신의 관계 패턴과 연결된 공간에서 이야기를 나눠보세요</p>

      {groups && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((g: any) => (
            <div key={g.id} className="bg-card border rounded-xl p-4 space-y-1">
              <p className="font-medium text-sm">{g.name}</p>
              {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">
          준비 중입니다
        </div>
      )}
    </div>
  );
}
