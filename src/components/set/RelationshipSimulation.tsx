// #33 관계 시뮬레이션 — AI 역할극 + #34 CodeTalk 연습
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MASK_PROFILES } from '@/lib/vfileAlgorithm';

const SCENARIOS = [
  { id: 'boundary', title: '경계 설정 연습', desc: '상대에게 NO라고 말하기', prompt: '사용자가 관계에서 경계를 설정하는 연습을 하고 있어. 상대 역할을 맡아서 자연스러운 대화 상황을 만들어줘. 사용자가 경계를 말하면 현실적으로 반응해.' },
  { id: 'conflict', title: '갈등 해결 연습', desc: '감정적이지 않게 의견 전달', prompt: '사용자가 갈등 상황에서 비폭력적 소통을 연습하고 있어. 약간 화난 상대 역할을 맡아줘. 사용자가 감정 언어를 사용하면 긍정적으로 반응해.' },
  { id: 'needs', title: '욕구 표현 연습', desc: '내가 원하는 것을 말하기', prompt: '사용자가 관계에서 자신의 욕구를 표현하는 연습을 하고 있어. 파트너 역할을 맡아서 들어줘. 사용자가 솔직하게 말하면 공감적으로 반응해.' },
  { id: 'apology', title: '사과하기 연습', desc: '진심 어린 사과와 책임', prompt: '사용자가 사과하는 연습을 하고 있어. 상처받은 상대 역할을 맡아줘. 사용자가 진심 어린 사과를 하면 조금씩 마음을 열어줘.' },
];

export default function RelationshipSimulation() {
  const { user, primaryMask, axisScores } = useAuth();
  const [scenario, setScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const profile = MASK_PROFILES.find(m => m.nameKo === primaryMask || m.mskCode === primaryMask);

  const startScenario = (s: typeof SCENARIOS[0]) => {
    setScenario(s);
    setMessages([{ role: 'ai', text: '준비됐어? 시작할게. 자연스럽게 대화해봐.' }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !scenario || loading) return;
    const userMsg = { role: 'user' as const, text: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await supabase.functions.invoke('held-chat', {
        body: {
          text: input.trim(),
          emotion: '',
          mask: primaryMask ?? '',
          axisScores: axisScores ?? undefined,
          history: [...messages, userMsg].slice(-6),
          tab: 'set',
          userId: user?.id,
          aiSettings: { name: '시뮬레이션 파트너', tone: 'calm', personality: 'direct' },
        },
      });
      setMessages(m => [...m, { role: 'ai', text: data?.response ?? '...' }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: '연결이 어려워요. 다시 시도해주세요.' }]);
    }
    setLoading(false);
  };

  if (!scenario) {
    return (
      <div className="bg-card border rounded-2xl p-5 space-y-3">
        <p className="text-xs text-muted-foreground">관계 시뮬레이션</p>
        <p className="text-xs text-muted-foreground">AI와 역할극으로 소통 스킬을 연습해보세요</p>
        <div className="space-y-2">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => startScenario(s)}
              className="w-full flex items-center gap-3 bg-muted/50 rounded-xl p-3 text-left hover:bg-muted transition-colors">
              <div className="flex-1">
                <p className="text-xs font-medium">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
              <span className="text-xs text-primary">시작</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{scenario.title}</p>
        <button onClick={() => { setScenario(null); setMessages([]); }} className="text-[10px] text-muted-foreground">종료</button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
            m.role === 'user' ? 'bg-primary/10 ml-auto' : 'bg-muted/50'
          }`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground animate-pulse">상대가 대답하고 있어요...</div>}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="대화를 이어가세요..."
          className="flex-1 bg-background border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          className="px-4 py-2 bg-primary text-white text-xs rounded-lg disabled:opacity-40">전송</button>
      </div>
    </div>
  );
}
