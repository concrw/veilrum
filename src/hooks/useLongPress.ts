import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  threshold?: number;   // ms (default 600)
  vibrate?: boolean;    // navigator.vibrate on trigger
  onStart?: () => void; // 홀드 시작 시
  onEnd?: () => void;   // 홀드 해제 시 (트리거 전 손 뗌)
}

export function useLongPress(
  onLongPress: () => void,
  options: UseLongPressOptions = {}
) {
  const { threshold = 600, vibrate = true, onStart, onEnd } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const startTimeRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // 입력창 내에서는 무시 (텍스트 선택 충돌 방지)
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    triggeredRef.current = false;
    startTimeRef.current = Date.now();
    onStart?.();

    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      if (vibrate && navigator.vibrate) {
        navigator.vibrate(30);
      }
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold, vibrate, onStart]);

  const stop = useCallback(() => {
    clear();
    if (!triggeredRef.current) {
      onEnd?.();
    }
  }, [clear, onEnd]);

  const cancel = useCallback(() => {
    clear();
    triggeredRef.current = false;
  }, [clear]);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: cancel,    // 스크롤 시 취소
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
    /** 현재 홀드 진행 시간을 계산하기 위한 시작 시간 */
    startTimeRef,
    /** 트리거 여부 */
    triggeredRef,
  };
}
