import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Hoisted mocks
const authMock = vi.hoisted(() => ({
  priperCompleted: false,
  personaContextsCompleted: [] as string[],
  user: { id: 'test-user' },
  session: {},
  loading: false,
  authError: null,
  onboardingStep: 'complete' as const,
  primaryMask: null,
  secondaryMask: null,
  axisScores: null,
  login: vi.fn(),
  signUp: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithKakao: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('@/hooks/useLongPress', () => ({
  useLongPress: () => ({}),
}));

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    listening: false,
    supported: false,
    interimTranscript: '',
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSpeechSynthesis', () => ({
  useSpeechSynthesis: () => ({
    speaking: false,
    speak: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    functions: { invoke: vi.fn() },
  },
}));

// AILeadOverlay uses scrollIntoView which jsdom doesn't support
vi.mock('@/components/ai/AILeadOverlay', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="ai-overlay">AI Overlay</div> : null,
}));

vi.mock('@/components/ai/HoldCircle', () => ({
  default: () => null,
}));

const { default: HomeLayout } = await import('@/layouts/HomeLayout');

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/home/vent']}>
      <HomeLayout />
    </MemoryRouter>
  );
}

describe('HomeLayout — dynamic bottom nav (#67)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.priperCompleted = false;
    authMock.personaContextsCompleted = [];
  });

  it('shows 3 tabs (Vent, Dig, Me) when V-File is incomplete', () => {
    authMock.priperCompleted = false;
    renderWithRouter();

    expect(screen.getByText('Vent')).toBeInTheDocument();
    expect(screen.getByText('Dig')).toBeInTheDocument();
    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.queryByText('Get')).not.toBeInTheDocument();
    expect(screen.queryByText('Set')).not.toBeInTheDocument();
  });

  it('shows 5 tabs (Vent, Dig, Get, Set, Me) when V-File is complete', () => {
    authMock.priperCompleted = true;
    authMock.personaContextsCompleted = ['general'];
    renderWithRouter();

    expect(screen.getByText('Vent')).toBeInTheDocument();
    expect(screen.getByText('Dig')).toBeInTheDocument();
    expect(screen.getByText('Get')).toBeInTheDocument();
    expect(screen.getByText('Set')).toBeInTheDocument();
    expect(screen.getByText('Me')).toBeInTheDocument();
  });

  it('shows badge on Set tab when multi-persona >= 2', () => {
    authMock.priperCompleted = true;
    authMock.personaContextsCompleted = ['general', 'social'];
    renderWithRouter();

    const badge = screen.getByLabelText('새 기능 알림');
    expect(badge).toBeInTheDocument();
  });

  it('does not show badge on Set tab when only 1 persona', () => {
    authMock.priperCompleted = true;
    authMock.personaContextsCompleted = ['general'];
    renderWithRouter();

    expect(screen.queryByLabelText('새 기능 알림')).not.toBeInTheDocument();
  });

  it('renders screen-reader AI button', () => {
    renderWithRouter();
    expect(screen.getByText('AI 대화 모드 열기 (Ctrl+Shift+A)')).toBeInTheDocument();
  });

  it('renders nav with correct aria-label', () => {
    renderWithRouter();
    expect(screen.getByLabelText('메인 탭 네비게이션')).toBeInTheDocument();
  });
});
