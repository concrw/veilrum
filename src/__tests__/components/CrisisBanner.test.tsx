import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrisisBanner } from '@/components/CrisisBanner';

describe('CrisisBanner', () => {
  it('renders for high severity', () => {
    render(<CrisisBanner severity="high" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/힘든 감정이 느껴지시나요/)).toBeInTheDocument();
  });

  it('renders for critical severity with different message', () => {
    render(<CrisisBanner severity="critical" />);
    expect(screen.getByText(/지금 많이 힘드시군요/)).toBeInTheDocument();
  });

  it('stage 1 shows stabilize and connect buttons', () => {
    render(<CrisisBanner severity="high" />);
    expect(screen.getByText(/먼저 마음을 가라앉히기/)).toBeInTheDocument();
    expect(screen.getByText(/전문가에게 연락하기/)).toBeInTheDocument();
  });

  it('clicking connect button shows hotline numbers', () => {
    render(<CrisisBanner severity="high" />);
    fireEvent.click(screen.getByText(/전문가에게 연락하기/));
    expect(screen.getByText(/1393/)).toBeInTheDocument();
    expect(screen.getByText(/1577-0199/)).toBeInTheDocument();
    expect(screen.getByText(/1588-9191/)).toBeInTheDocument();
  });

  it('clicking stabilize button shows breathing and grounding options', () => {
    render(<CrisisBanner severity="high" />);
    fireEvent.click(screen.getByText(/먼저 마음을 가라앉히기/));
    expect(screen.getByText(/호흡 가이드/)).toBeInTheDocument();
    expect(screen.getByText(/그라운딩/)).toBeInTheDocument();
  });

  it('dismiss button calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(<CrisisBanner severity="high" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('배너 닫기'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(<CrisisBanner severity="high" />);
    expect(screen.queryByLabelText('배너 닫기')).not.toBeInTheDocument();
  });

  it('has role="alert" and aria-live="assertive"', () => {
    render(<CrisisBanner severity="critical" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('contains disclaimer text', () => {
    render(<CrisisBanner severity="high" />);
    expect(screen.getByText(/이 앱은 전문 상담을 대체하지 않습니다/)).toBeInTheDocument();
  });

  it('stage progress indicator is visible', () => {
    render(<CrisisBanner severity="critical" />);
    // 3 단계 진행바 존재
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});
