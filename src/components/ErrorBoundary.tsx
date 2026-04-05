import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId ?? `ERR-${Date.now()}`;
    console.error('[ErrorBoundary]', {
      errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: info.componentStack,
      platform: 'veilrum',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });
    // TODO: Sentry 연동 시 이 위치에서 전송
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1C1917',
            color: '#E7E5E4',
            fontFamily: "'DM Sans', sans-serif",
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(212,165,116,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              fontSize: 24,
            }}
          >
            !
          </div>

          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#D4A574',
              marginBottom: '0.5rem',
            }}
          >
            문제가 발생했습니다
          </h2>

          <p
            style={{
              fontSize: '0.875rem',
              color: '#A8A29E',
              maxWidth: 360,
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            예상치 못한 오류가 발생했어요. 아래 버튼을 눌러 다시 시도해 주세요.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #3C3835',
                background: 'transparent',
                color: '#E7E5E4',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#D4A574',
                color: '#1C1917',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              새로고침
            </button>
          </div>

          {this.state.errorId && (
            <p
              style={{
                marginTop: '1rem',
                fontSize: '0.7rem',
                color: '#57534E',
                fontFamily: 'monospace',
              }}
            >
              {this.state.errorId}
            </p>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                marginTop: '2rem',
                padding: '1rem',
                background: '#292524',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#78716C',
                maxWidth: '90vw',
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
