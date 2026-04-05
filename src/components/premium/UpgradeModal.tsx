// 프리미엄 전환 트리거 모달 — Amber/Frost 컬러 시스템
// 각 트리거 지점에서 호출되는 바텀시트 형태의 업그레이드 안내 UI

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { C } from '@/lib/colors';

export type TriggerType =
  | 'codetalk_ai_limit'       // T1: AI CODETALK 조언 횟수 초과
  | 'multi_persona_analysis'  // T2: 멀티페르소나 분석 요청
  | 'ikigai_design'           // T3: Ikigai 설계 접근
  | 'brand_identity'          // T4: 브랜드 정체성 설계 접근
  | 'monthly_report_detail';  // T5: 월간 리포트 상세 보기

interface TriggerConfig {
  icon: string;
  title: string;
  description: string;
  benefit: string;
  ctaText: string;
  accentColor: string;
}

const TRIGGER_CONFIG: Record<TriggerType, TriggerConfig> = {
  codetalk_ai_limit: {
    icon: '🧠',
    title: 'AI 조언이 더 필요하신가요?',
    description: '무료 플랜에서는 AI 인사이트를 하루 3회까지 받을 수 있어요.',
    benefit: 'Pro 플랜에서는 무제한 AI 조언과 깊은 패턴 분석을 이용할 수 있어요.',
    ctaText: 'Pro로 업그레이드',
    accentColor: C.frost,
  },
  multi_persona_analysis: {
    icon: '🎭',
    title: '멀티페르소나 분석',
    description: '여러 페르소나 간의 충돌 패턴과 자원 배분을 시각화해요.',
    benefit: '각 페르소나의 시간축 변화, 억압 패턴, 역할 간 긴장 관계를 볼 수 있어요.',
    ctaText: 'Pro로 잠금 해제',
    accentColor: C.amber,
  },
  ikigai_design: {
    icon: '🌀',
    title: 'Ikigai 설계',
    description: '사랑, 재능, 소명, 천직의 교차점에서 삶의 방향을 설계해요.',
    benefit: 'AI가 당신의 패턴을 분석해 개인화된 Ikigai 인사이트를 제공해요.',
    ctaText: 'Pro로 설계 시작',
    accentColor: C.amberGold,
  },
  brand_identity: {
    icon: '💎',
    title: '브랜드 정체성 설계',
    description: '나만의 언어와 방향성으로 개인 브랜드를 구축해요.',
    benefit: 'AI가 당신의 Why, Ikigai를 기반으로 브랜드 전략을 설계해 줘요.',
    ctaText: 'Pro로 브랜드 설계',
    accentColor: C.amberGold,
  },
  monthly_report_detail: {
    icon: '📊',
    title: '상세 월간 리포트',
    description: '무료 플랜에서는 요약만 확인할 수 있어요.',
    benefit: '감정 흐름, 패턴 변화, 성장 추이를 상세하게 분석한 풀 리포트를 받아보세요.',
    ctaText: 'Pro로 전체 리포트 보기',
    accentColor: C.frost,
  },
};

// Stripe Price ID — 서버에서 tier 기반으로 매핑하므로 클라이언트에서는 tier만 전달
const PRO_TIER = 'pro';
// 실제 Stripe Price ID는 환경변수로 관리 (보안)
const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID ?? '';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  trigger: TriggerType;
}

export default function UpgradeModal({ open, onClose, trigger }: UpgradeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = TRIGGER_CONFIG[trigger];

  // Escape 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: STRIPE_PRICE_ID,
          tier: PRO_TIER,
        },
      });

      if (fnError) throw fnError;

      // 트리거 이벤트 로깅 (분석용)
      await supabase.from('premium_trigger_events').insert({
        user_id: user.id,
        trigger_type: trigger,
        action: 'checkout_initiated',
        created_at: new Date().toISOString(),
      }).then(() => {});  // fire-and-forget

      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.sessionId) {
        // Stripe.js redirect fallback
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setError('결제 페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    // 트리거 노출 이벤트 로깅 (분석용, fire-and-forget)
    if (user) {
      supabase.from('premium_trigger_events').insert({
        user_id: user.id,
        trigger_type: trigger,
        action: 'dismissed',
        created_at: new Date().toISOString(),
      }).then(() => {});
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
          zIndex: 50, opacity: 1,
          transition: 'opacity .3s',
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.bg,
        borderRadius: '22px 22px 0 0',
        border: `1px solid ${C.border}`,
        borderBottom: 'none',
        zIndex: 51,
        maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Handle */}
        <div style={{
          width: 32, height: 3, borderRadius: 99,
          background: C.border, margin: '10px auto 0',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border2}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{config.icon}</span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400, fontSize: 18, color: C.text,
            }}>{config.title}</span>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `1px solid ${C.border}`, background: 'transparent',
              cursor: 'pointer', color: C.text4, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            x
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px 20px 28px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Description */}
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
            {config.description}
          </p>

          {/* Benefit card */}
          <div style={{
            background: `${config.accentColor}08`,
            border: `1px solid ${config.accentColor}33`,
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: config.accentColor,
                marginTop: 6, flexShrink: 0,
              }} />
              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                {config.benefit}
              </p>
            </div>
          </div>

          {/* Pro features summary */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {['무제한 AI 조언', '멀티페르소나', 'Ikigai 설계', '브랜드 전략', '상세 리포트'].map((f) => (
              <span key={f} style={{
                fontSize: 10, padding: '3px 8px',
                borderRadius: 99,
                border: `1px solid ${C.amberGold}33`,
                color: C.amberGold,
                background: `${C.amberGold}08`,
              }}>
                {f}
              </span>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p style={{ fontSize: 12, color: '#E57373', textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: loading
                ? `${C.amberGold}66`
                : `linear-gradient(135deg, ${C.amberGold}, ${C.amber})`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: C.bg,
              cursor: loading ? 'default' : 'pointer',
              transition: 'opacity .2s',
            }}
          >
            {loading ? '처리 중...' : config.ctaText}
          </button>

          {/* Dismiss link */}
          <button
            onClick={handleDismiss}
            style={{
              background: 'none', border: 'none',
              fontSize: 12, color: C.text4,
              cursor: 'pointer', textAlign: 'center',
              padding: '4px 0',
            }}
          >
            나중에 할게요
          </button>
        </div>
      </div>
    </>
  );
}
