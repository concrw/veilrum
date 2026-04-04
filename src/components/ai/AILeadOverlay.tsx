import { useState, useRef, useEffect, useCallback } from 'react';
import { C } from '@/lib/colors';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FOCUS_TRAP_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface AILeadOverlayProps {
  open: boolean;
  onClose: () => void;
  aiName?: string;
  currentTab?: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

// 음성 파형 (시각 장식)
function WaveForm({ active }: { active: boolean }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3, borderRadius: 99,
            background: active ? C.amberGold : C.border,
            height: active ? undefined : 8,
            animation: active ? `vr-wave 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// 탭별 AI 첫 마디
const TAB_GREETINGS: Record<string, string> = {
  vent: '지금 어떤 감정인지 말해줄래요?',
  dig: '패턴을 더 깊이 들여다볼까요?',
  get: '당신에 대해 더 알아보고 싶어요.',
  set: '오늘 어떤 선택을 해볼까요?',
  me: '변화를 함께 돌아볼까요?',
};

export default function AILeadOverlay({ open, onClose, aiName = '엠버', currentTab }: AILeadOverlayProps) {
  const { user, primaryMask, axisScores } = useAuth();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [statusText, setStatusText] = useState('');
  const startY = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const greeting = TAB_GREETINGS[currentTab ?? ''] ?? '무엇이든 말해줄래요?';

  // TTS — AI 응답 읽어주기. 읽기 끝나면 자동으로 다시 듣기 시작 (연속 대화)
  const tts = useSpeechSynthesis({
    lang: 'ko-KR',
    rate: 0.95,
    onEnd: () => {
      setStatusText('말해주세요...');
      // 연속 대화: TTS 끝나면 자동으로 STT 시작
      if (open) stt.start();
    },
  });

  // AI에게 메시지 전송
  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim() || aiThinking) return;

    const userMsg: ChatMessage = { role: 'user', text: text.trim() };
    setHistory(prev => [...prev, userMsg]);
    setAiThinking(true);
    setStatusText('생각하고 있어요...');

    try {
      const { data, error } = await supabase.functions.invoke('held-chat', {
        body: {
          text: text.trim(),
          emotion: '',
          mask: primaryMask ?? '',
          axisScores: axisScores ?? undefined,
          history: [...history, userMsg].slice(-6),
          tab: currentTab ?? 'vent',
          userId: user?.id,
        },
      });

      const aiText = error ? '지금은 연결이 어려워요. 잠시 후 다시 시도해주세요.' : (data?.reply ?? '...');
      const aiMsg: ChatMessage = { role: 'ai', text: aiText };
      setHistory(prev => [...prev, aiMsg]);
      setStatusText('');

      // TTS로 읽어주기
      tts.speak(aiText);
    } catch {
      const fallback: ChatMessage = { role: 'ai', text: '연결이 불안정해요. 다시 말해줄래요?' };
      setHistory(prev => [...prev, fallback]);
      setStatusText('');
      tts.speak(fallback.text);
    } finally {
      setAiThinking(false);
    }
  }, [aiThinking, history, primaryMask, axisScores, tts]);

  // STT — 음성 인식 완료 시 자동 전송
  const stt = useSpeechRecognition({
    lang: 'ko-KR',
    onResult: (transcript) => {
      sendToAI(transcript);
    },
    onEnd: () => {
      setStatusText('');
    },
  });

  // 마이크 토글
  const toggleMic = useCallback(() => {
    if (stt.listening) {
      stt.stop();
      setStatusText('');
    } else {
      tts.stop(); // TTS 중이면 중단
      stt.start();
      setStatusText('듣고 있어요...');
    }
  }, [stt, tts]);

  // 텍스트 전송
  const handleTextSend = useCallback(() => {
    if (!message.trim()) return;
    sendToAI(message);
    setMessage('');
  }, [message, sendToAI]);

  // 열릴 때 초기화 + TTS로 인사
  useEffect(() => {
    if (open) {
      setHistory([]);
      setStatusText('');
      setMessage('');
      // 인사말을 TTS로 읽어주기
      const timer = setTimeout(() => {
        tts.speak(greeting);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      stt.abort();
      tts.stop();
    }
  }, [open]);

  // 새 메시지 오면 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // 스와이프 다운
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches[0].clientY - startY.current > 100) onClose();
  }, [onClose]);

  // ESC + 포커스 트랩
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(FOCUS_TRAP_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 스크롤 잠금 + 포커스
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        overlayRef.current?.querySelector<HTMLElement>(FOCUS_TRAP_SELECTOR)?.focus();
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // 현재 표시할 상태 텍스트
  const displayStatus = aiThinking ? '생각하고 있어요...'
    : stt.listening ? '듣고 있어요...'
    : tts.speaking ? ''
    : statusText || (history.length === 0 ? greeting : '마이크를 누르거나 글을 적어주세요');

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-label="AI 음성 대화 모드 — 음성 또는 텍스트로 AI와 대화할 수 있습니다"
      aria-modal="true"
      aria-hidden={!open}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: C.bg,
        display: 'flex', flexDirection: 'column',
        opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* 스와이프 힌트 */}
      <div aria-hidden="true" style={{
        width: 32, height: 3, borderRadius: 99, background: C.border,
        margin: '12px auto 0',
      }} />
      <p style={{ textAlign: 'center', fontSize: 10, color: C.text5, margin: '6px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
        아래로 스와이프하면 돌아가요
      </p>

      {/* 대화 영역 */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 대화 없을 때: 아바타 중앙 */}
        {history.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* 아바타 */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.amberGold}22, ${C.amberGold}08)`,
              border: `2px solid ${C.amberGold}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', marginBottom: 20,
            }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${C.amberGold}22`, animation: 'vr-pulse-ring 2s ease-out infinite' }} />
              <div aria-hidden="true" style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: `1px solid ${C.amberGold}11`, animation: 'vr-pulse-ring 2s ease-out 0.5s infinite' }} />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: C.amberGold }}>
                {aiName[0]}
              </span>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: C.text }}>
              {aiName}
            </p>
          </div>
        )}

        {/* 대화 버블 */}
        {history.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%', marginBottom: 10,
              padding: '10px 14px', borderRadius: 14,
              background: msg.role === 'user' ? `${C.amberGold}15` : C.bg2,
              border: `1px solid ${msg.role === 'user' ? `${C.amberGold}33` : C.border}`,
            }}
          >
            {msg.role === 'ai' && (
              <p style={{ fontSize: 9, color: C.amberGold, marginBottom: 4, fontWeight: 400 }}>{aiName}</p>
            )}
            <p style={{ fontSize: 13, fontWeight: 300, color: C.text2, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
              {msg.text}
            </p>
          </div>
        ))}

        {/* AI 생각 중 표시 */}
        {aiThinking && (
          <div style={{
            alignSelf: 'flex-start', maxWidth: '60%', marginBottom: 10,
            padding: '10px 14px', borderRadius: 14,
            background: C.bg2, border: `1px solid ${C.border}`,
          }}>
            <p style={{ fontSize: 9, color: C.amberGold, marginBottom: 4 }}>{aiName}</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: 6, height: 6, borderRadius: '50%', background: C.text4,
                  animation: `vr-wave 0.6s ease-in-out ${j * 0.15}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 상태 텍스트 */}
      <p
        aria-live="polite"
        style={{
          textAlign: 'center', fontSize: 12, color: C.text4, padding: '0 20px 8px',
          fontFamily: "'DM Sans', sans-serif", minHeight: 20,
        }}
      >
        {stt.interimTranscript && <span style={{ color: C.text3 }}>{stt.interimTranscript}</span>}
        {!stt.interimTranscript && displayStatus}
      </p>

      {/* 음성 파형 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <WaveForm active={stt.listening || tts.speaking} />
      </div>

      {/* 하단 입력 영역 */}
      <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* 텍스트 입력 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 360,
          background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px',
        }}>
          <input
            aria-label="AI에게 보낼 메시지 입력"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="또는 여기에 적어요..."
            disabled={aiThinking}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text2,
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleTextSend(); }}
          />
          {message.trim() && (
            <button
              aria-label="메시지 전송"
              onClick={handleTextSend}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: C.amberGold, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 10V2M6 2L2 6M6 2l4 4" stroke={C.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* 마이크 + 닫기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* TTS 중지 버튼 (읽는 중일 때) */}
          {tts.speaking && (
            <button
              aria-label="읽기 중지"
              onClick={() => tts.stop()}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: C.bg2, border: `1px solid ${C.border}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1" fill={C.text4}/>
              </svg>
            </button>
          )}

          {/* 마이크 버튼 */}
          <button
            onClick={toggleMic}
            disabled={aiThinking}
            aria-label={stt.listening ? '녹음 중지' : stt.supported ? '음성으로 말하기' : '음성 인식을 지원하지 않는 브라우저입니다'}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: stt.listening ? C.amberGold : C.bg2,
              border: `2px solid ${stt.listening ? C.amberGold : C.border}`,
              cursor: aiThinking ? 'default' : 'pointer',
              opacity: aiThinking ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: stt.listening ? 'vr-pulse-mic 1.5s ease-in-out infinite' : 'none',
              transition: 'background 0.3s, border-color 0.3s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="7" y="2" width="6" height="10" rx="3" stroke={stt.listening ? C.bg : C.text3} strokeWidth="1.5"/>
              <path d="M4 10a6 6 0 0 0 12 0" stroke={stt.listening ? C.bg : C.text3} strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 16v2" stroke={stt.listening ? C.bg : C.text3} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* 닫기 */}
          <button
            onClick={onClose}
            aria-label="대화 모드 닫기"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: C.bg2, border: `1px solid ${C.border}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11L11 3M3 3l8 8" stroke={C.text4} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* STT 미지원 안내 */}
        {!stt.supported && (
          <p style={{ fontSize: 10, color: C.text5, textAlign: 'center' }}>
            이 브라우저는 음성 인식을 지원하지 않아요. 텍스트로 대화해주세요.
          </p>
        )}
      </div>

      {/* 하단 여백 (safe area) */}
      <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
    </div>
  );
}
