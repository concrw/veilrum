import { Outlet, NavLink } from 'react-router-dom';

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
  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100dvh', background: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* 콘텐츠 */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: '64px' }}>
        <Outlet />
      </main>

      {/* 하단 탭 nav */}
      <nav
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
