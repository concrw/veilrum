import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { MASK_PROFILES } from '@/lib/priperAlgorithm';
import { Button } from '@/components/ui/button';

export default function PriperHome() {
  const navigate = useNavigate();
  const { primaryMask, secondaryMask, axisScores } = useAuth();
  const mask = MASK_PROFILES.find(m => m.nameKo === primaryMask);

  const radarData = axisScores ? [
    { axis: '애착', value: axisScores.A },
    { axis: '소통', value: axisScores.B },
    { axis: '욕구표현', value: axisScores.C },
    { axis: '역할', value: axisScores.D },
  ] : [];

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      {mask ? (
        <>
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">나의 Prime Mask</p>
            <h2 className="text-3xl font-bold" style={{ color: mask.color }}>{mask.nameKo}</h2>
            <p className="text-sm text-muted-foreground">{mask.archetype}</p>
            {secondaryMask && secondaryMask !== primaryMask && (
              <p className="text-xs text-muted-foreground">복합형: +{secondaryMask}</p>
            )}
          </div>

          {axisScores && (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
                <Radar dataKey="value" fill={mask.color} fillOpacity={0.3}
                  stroke={mask.color} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}

          <div className="bg-card border rounded-2xl p-5 space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{mask.description}</p>
            <div className="pt-2 border-t space-y-2 text-xs">
              <p><span className="text-muted-foreground">핵심 상처:</span> {mask.coreWound}</p>
              <p><span className="text-muted-foreground">핵심 두려움:</span> {mask.coreFear}</p>
              <p><span className="text-muted-foreground">핵심 욕구:</span> {mask.coreNeed}</p>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding/priper/start')}>
            재진단하기
          </Button>
        </>
      ) : (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">아직 진단을 완료하지 않았어요</p>
          <Button onClick={() => navigate('/onboarding/priper/start')}>진단 시작</Button>
        </div>
      )}
    </div>
  );
}
