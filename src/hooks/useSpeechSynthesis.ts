import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;    // 0.1~10, default 0.95
  pitch?: number;   // 0~2, default 1
  onEnd?: () => void;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { lang = 'ko-KR', rate = 0.95, pitch = 1, onEnd } = options;
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // 이전 발화 중단
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // 한국어 음성 선택 (가능하면)
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find(v => v.lang.startsWith('ko'));
    if (koVoice) utterance.voice = koVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, onEnd]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return {
    speaking,
    supported,
    speak,
    stop,
  };
}
