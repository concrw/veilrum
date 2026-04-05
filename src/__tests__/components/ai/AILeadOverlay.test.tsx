import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    primaryMask: 'PWR',
    axisScores: { A: 50, B: 50, C: 50, D: 50 },
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { reply: 'AI response' }, error: null }),
    },
  },
}));

const sttMock = {
  listening: false,
  supported: true,
  interimTranscript: '',
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
};

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => sttMock,
}));

const ttsMock = {
  speaking: false,
  speak: vi.fn(),
  stop: vi.fn(),
};

vi.mock('@/hooks/useSpeechSynthesis', () => ({
  useSpeechSynthesis: () => ttsMock,
}));

vi.mock('@/lib/colors', () => ({
  C: {
    bg: '#1C1917',
    bg2: '#2A2624',
    text: '#E7E5E4',
    text2: '#D6D3D1',
    text3: '#A8A29E',
    text4: '#78716C',
    text5: '#57534E',
    border: '#3C3835',
    amberGold: '#D4A574',
  },
}));

const { default: AILeadOverlay } = await import('@/components/ai/AILeadOverlay');

describe('AILeadOverlay', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders as a dialog with correct aria attributes', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('is hidden when open is false', () => {
    render(<AILeadOverlay open={false} onClose={onClose} />);

    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveStyle({ pointerEvents: 'none', opacity: '0' });
  });

  it('is visible when open is true', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({ pointerEvents: 'all', opacity: '1' });
  });

  it('displays the AI name (default: 엠버)', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    // The first character of the AI name is rendered in the avatar
    expect(screen.getByText('엠')).toBeInTheDocument();
    // The full name appears
    expect(screen.getByText('엠버')).toBeInTheDocument();
  });

  it('displays custom AI name when provided', () => {
    render(<AILeadOverlay open={true} onClose={onClose} aiName="프로스트" />);

    expect(screen.getByText('프')).toBeInTheDocument();
    expect(screen.getByText('프로스트')).toBeInTheDocument();
  });

  it('shows tab-specific greeting for vent tab', () => {
    render(<AILeadOverlay open={true} onClose={onClose} currentTab="vent" />);

    expect(screen.getByText('지금 어떤 감정인지 말해줄래요?')).toBeInTheDocument();
  });

  it('shows tab-specific greeting for dig tab', () => {
    render(<AILeadOverlay open={true} onClose={onClose} currentTab="dig" />);

    expect(screen.getByText('패턴을 더 깊이 들여다볼까요?')).toBeInTheDocument();
  });

  it('shows default greeting when no tab is specified', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    expect(screen.getByText('무엇이든 말해줄래요?')).toBeInTheDocument();
  });

  it('has a close button', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('대화 모드 닫기');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('대화 모드 닫기'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has a text input field', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    const input = screen.getByLabelText('AI에게 보낼 메시지 입력');
    expect(input).toBeInTheDocument();
  });

  it('has a microphone button', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    const micBtn = screen.getByLabelText('음성으로 말하기');
    expect(micBtn).toBeInTheDocument();
  });

  it('shows swipe hint text', () => {
    render(<AILeadOverlay open={true} onClose={onClose} />);

    expect(screen.getByText('아래로 스와이프하면 돌아가요')).toBeInTheDocument();
  });
});
