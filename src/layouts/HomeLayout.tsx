import { useState, useCallback, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useLongPress } from '@/hooks/useLongPress';
import HoldCircle from '@/components/ai/HoldCircle';
import AILeadOverlay from '@/components/ai/AILeadOverlay';

// 탭별 포인트 컬러 (인계문서 §2 기준)
const TABS = [
  { to: '/home/vent', label: 'Vent', color: '#D4A574' },
  { to: '/home/dig',  label: 'Dig',  color: '#A07850' },
  { to: '/home/get',  label: 'Get',  color: '#8C7060' },
  { to: '/home/set',  label: 'Set',  color: '#C4A355' },
  { to: '/home/me',   label: 'Me',   color: '#E7C17A' },
];

// Amber 버튼 공통
export function AmberBtn({ onClick, flash }: { onClick: () => void; flash?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Amber AI 상담 열기"
      className={`relative w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer ${flash ? 'amber-flash' : ''}`}
      style={{ background: '#D4A57415', border: '1px solid #D4A57444' }}
    >
      <span
        className="absolute inset-[-3px] rounded-full"
        style={{ border: '1px solid #D4A57418', animation: 'ai-pulse 3s ease-in-out infinite' }}
      />
      <span className="w-[19px] h-[19px] rounded-full block" style={{ background: '#D4A574' }} />
    </button>
  );
}

// Frost 버튼 공통
export function FrostBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Frost AI 분석 열기"
      className="relative w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
      style={{ background: '#7BA8C415', border: '1px solid #7BA8C444' }}
    >
      <span
        className="absolute inset-[-3px] rounded-full"
        style={{ border: '1px solid #7BA8C418', animation: 'ai-pulse 3.4s ease-in-out infinite .4s' }}
      />
      <span className="w-[19px] h-[19px] rounded-full block" style={{ background: '#7BA8C4' }} />
    </button>
  );
}

export default function HomeLayout() {
  const [aiLeadOpen, setAiLeadOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const location = useLocation();

  // 현재 탭 감지
  const currentTab = location.pathname.split('/').pop() ?? '';

  const openAILead = useCallback(() => {
    setHolding(false);
    setAiLeadOpen(true);
  }, []);

  // 키보드 단축키: Ctrl+Shift+A — 시각장애인/키보드 사용자를 위한 대안
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAiLeadOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const longPressHandlers = useLongPress(openAILead, {
    threshold: 600,
    vibrate: true,
    onStart: () => setHolding(true),
    onEnd: () => setHolding(false),
  });

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', background: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}
      {...longPressHandlers}
    >
      {/* 스크린리더 전용: AI 모드 진입 안내 */}
      <button
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-black focus:text-white focus:px-3 focus:py-2 focus:rounded"
        onClick={() => setAiLeadOpen(true)}
      >
        AI 대화 모드 열기 (Ctrl+Shift+A)
      </button>

      {/* 롱프레스 홀드 서클 */}
      <HoldCircle active={holding} duration={600} />

      {/* AI 리드 모드 오버레이 */}
      <AILeadOverlay
        open={aiLeadOpen}
        onClose={() => setAiLeadOpen(false)}
        currentTab={currentTab}
      />

      {/* 콘텐츠 */}
      <main id="main-content" className="flex-1 overflow-y-auto" style={{ paddingBottom: '64px' }}>
        <Outlet />
      </main>

      {/* 하단 탭 nav */}
      <nav
        aria-label="메인 탭 네비게이션"
        className="fixed bottom-0 inset-x-0 z-20 flex justify-around"
        style={{
          background: '#1C1917',
          borderTop: '1px solid #2A2624',
          padding: '9px 10px 16px',
        }}
      >
        {TABS.map(({ to, label, color }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 cursor-pointer px-3 py-1 rounded-[9px] border-none bg-transparent"
            style={({ isActive }) => ({
              background: isActive ? `${color}0A` : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className="w-[5px] h-[5px] rounded-full transition-all"
                  style={{
                    background: isActive ? color : '#3C3835',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                <span
                  className="text-[11px] font-light transition-colors"
                  style={{
                    color: isActive ? color : '#57534E',
                    fontWeight: isActive ? 400 : 300,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
