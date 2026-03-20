import { useState, useEffect } from 'react';

/**
 * Amber 어텐션 애니메이션 공통 훅
 * 앱 첫 진입 후 5~9초 뒤 첫 번쩍임 → 이후 9~22초 랜덤 인터벌 반복
 */
export function useAmberAttention() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleFlash(delay: number) {
      timeoutId = setTimeout(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 1400);
        scheduleFlash(9000 + Math.random() * 13000);
      }, delay);
    }

    scheduleFlash(5000 + Math.random() * 4000);

    return () => clearTimeout(timeoutId);
  }, []);

  return flash;
}
