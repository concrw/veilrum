import { useState, useEffect } from 'react';
import { C } from '@/lib/colors';
import { supabase, veilrumDb } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ZoneToggle from './ZoneToggle';
import { LANG_LABELS } from '@/data/mePageData';

export interface AiSettings {
  name: string;
  tone: 'friend' | 'warm' | 'calm' | 'expert';
  personality: 'empathetic' | 'direct' | 'curious' | 'playful';
  frequency: 'low' | 'normal' | 'high';
}

const TONE_OPTIONS: { value: AiSettings['tone']; label: string; desc: string }[] = [
  { value: 'friend', label: '친구', desc: '편하게 반말로' },
  { value: 'warm', label: '따뜻한', desc: '부드럽고 수용적으로' },
  { value: 'calm', label: '차분한', desc: '침착하고 안정적으로' },
  { value: 'expert', label: '전문가', desc: '분석적이고 명확하게' },
];

const PERSONALITY_OPTIONS: { value: AiSettings['personality']; label: string }[] = [
  { value: 'empathetic', label: '공감형' },
  { value: 'direct', label: '직설형' },
  { value: 'curious', label: '탐구형' },
  { value: 'playful', label: '유쾌형' },
];

const FREQ_OPTIONS: { value: AiSettings['frequency']; label: string }[] = [
  { value: 'low', label: '가끔' },
  { value: 'normal', label: '보통' },
  { value: 'high', label: '자주' },
];

const DEFAULT_AI_SETTINGS: AiSettings = { name: '엠버', tone: 'warm', personality: 'empathetic', frequency: 'normal' };

function SettingsSheet({
  open, onClose, amberName, frostName,
  onRenameAmber, onRenameFrost, lang, onChangeLang,
  aiSettings: externalAiSettings, onAiSettingsChange,
}: {
  open: boolean; onClose: () => void;
  amberName: string; frostName: string;
  onRenameAmber: () => void; onRenameFrost: () => void;
  lang: string; onChangeLang: (l: string) => void;
  aiSettings?: AiSettings; onAiSettingsChange?: (s: AiSettings) => void;
}) {
  const { user, signOut } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [notifAmber, setNotifAmber] = useState(true);
  const [notifReport, setNotifReport] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(externalAiSettings ?? DEFAULT_AI_SETTINGS);
  const [aiCustomOpen, setAiCustomOpen] = useState(false);

  // 알림 + AI 설정 DB 로드
  useEffect(() => {
    if (!user) return;
    veilrumDb.from('user_profiles').select('notification_amber, notification_report, ai_settings').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          if (data.notification_amber !== undefined) setNotifAmber(data.notification_amber);
          if (data.notification_report !== undefined) setNotifReport(data.notification_report);
          if (data.ai_settings) setAiSettings({ ...DEFAULT_AI_SETTINGS, ...data.ai_settings });
        }
      });
  }, [user]);

  // AI 설정 변경 → DB 저장
  const updateAiSetting = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => {
    const next = { ...aiSettings, [key]: value };
    setAiSettings(next);
    onAiSettingsChange?.(next);
    if (user) {
      veilrumDb.from('user_profiles').update({ ai_settings: next, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    }
  };

  // 알림 토글 → DB 저장
  const toggleNotif = async (key: 'notification_amber' | 'notification_report', setter: (v: boolean) => void) => {
    setter((prev: boolean) => {
      const next = !prev;
      if (user) {
        veilrumDb.from('user_profiles').update({ [key]: next, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      }
      return next;
    });
  };
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !deleteConfirm) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user-data', {
        body: { userId: user.id },
      });
      if (error) throw error;
      await signOut();
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity .3s' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: C.bg,
        borderRadius: '22px 22px 0 0', border: `1px solid #44403C`, borderBottom: 'none',
        zIndex: 41, display: 'flex', flexDirection: 'column', maxHeight: '85%',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ width: 32, height: 3, borderRadius: 99, background: C.border, margin: '10px auto 0', flexShrink: 0 }} />
        <div style={{ padding: '12px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 18, color: C.text }}>설정</span>
          <button aria-label="닫기" onClick={onClose} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.text4, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 언어 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>언어</p>
          <div onClick={() => setLangOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={C.text3} strokeWidth="1.2"/><path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13" stroke={C.text3} strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>언어 설정</p>
              <p style={{ fontSize: 10, color: C.text4 }}>앱 전체 언어를 변경해요</p>
            </div>
            <span style={{ fontSize: 11, color: C.text3 }}>{LANG_LABELS[lang]}</span>
            <span style={{ fontSize: 11, color: C.text5, transform: langOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
          </div>
          {langOpen && (
            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, overflow: 'hidden' }}>
              {['ko', 'en', 'ja'].map(l => (
                <div key={l} onClick={() => { onChangeLang(l); setLangOpen(false); }}
                  style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: l !== 'ja' ? `1px solid ${C.border2}` : 'none', cursor: 'pointer', background: lang === l ? `${C.amberGold}08` : 'transparent' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.text }}>{LANG_LABELS[l]}</span>
                  <span style={{ fontSize: 11, color: C.amberGold, opacity: lang === l ? 1 : 0 }}>✓</span>
                </div>
              ))}
            </div>
          )}

          {/* AI 캐릭터 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>AI 캐릭터</p>
          {[
            { name: amberName, sub: '비서 · F모드', color: C.amber, onClick: onRenameAmber },
            { name: frostName, sub: '닥터 · T모드', color: C.frost, onClick: onRenameFrost },
          ].map((ai, i) => (
            <div key={i} onClick={ai.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${ai.color}15`, border: `1px solid ${ai.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: ai.color, display: 'block' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>{ai.name}</p>
                <p style={{ fontSize: 10, color: C.text4 }}>{ai.sub}</p>
              </div>
              <span style={{ fontSize: 11, color: C.text3 }}>이름 변경</span>
              <span style={{ fontSize: 11, color: C.text5 }}>›</span>
            </div>
          ))}

          {/* AI 커스터마이징 */}
          <div onClick={() => setAiCustomOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎛️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>AI 성격 설정</p>
              <p style={{ fontSize: 10, color: C.text4 }}>
                {TONE_OPTIONS.find(t => t.value === aiSettings.tone)?.label} · {PERSONALITY_OPTIONS.find(p => p.value === aiSettings.personality)?.label}
              </p>
            </div>
            <span style={{ fontSize: 11, color: C.text5, transform: aiCustomOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
          </div>
          {aiCustomOpen && (
            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 어투 */}
              <div>
                <p style={{ fontSize: 10, color: C.text4, marginBottom: 6 }}>어투</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => updateAiSetting('tone', t.value)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        border: aiSettings.tone === t.value ? `1px solid ${C.amberGold}` : `1px solid ${C.border}`,
                        background: aiSettings.tone === t.value ? `${C.amberGold}15` : 'transparent',
                        color: aiSettings.tone === t.value ? C.amberGold : C.text3,
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 9, color: C.text5, marginTop: 4 }}>
                  {TONE_OPTIONS.find(t => t.value === aiSettings.tone)?.desc}
                </p>
              </div>
              {/* 성격 */}
              <div>
                <p style={{ fontSize: 10, color: C.text4, marginBottom: 6 }}>성격</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PERSONALITY_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => updateAiSetting('personality', p.value)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        border: aiSettings.personality === p.value ? `1px solid ${C.amberGold}` : `1px solid ${C.border}`,
                        background: aiSettings.personality === p.value ? `${C.amberGold}15` : 'transparent',
                        color: aiSettings.personality === p.value ? C.amberGold : C.text3,
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* 말 거는 빈도 */}
              <div>
                <p style={{ fontSize: 10, color: C.text4, marginBottom: 6 }}>말 거는 빈도</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {FREQ_OPTIONS.map(f => (
                    <button key={f.value} onClick={() => updateAiSetting('frequency', f.value)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', flex: 1,
                        border: aiSettings.frequency === f.value ? `1px solid ${C.amberGold}` : `1px solid ${C.border}`,
                        background: aiSettings.frequency === f.value ? `${C.amberGold}15` : 'transparent',
                        color: aiSettings.frequency === f.value ? C.amberGold : C.text3,
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 알림 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>알림</p>
          {[
            { label: 'Amber 알림', sub: '패시브 모드 푸시 알림', on: notifAmber, key: 'notification_amber' as const, setter: setNotifAmber },
            { label: '주간 리포트 알림', sub: '매주 월요일 오전', on: notifReport, key: 'notification_report' as const, setter: setNotifReport },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔔</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>{row.label}</p>
                <p style={{ fontSize: 10, color: C.text4 }}>{row.sub}</p>
              </div>
              <ZoneToggle on={row.on} onToggle={() => toggleNotif(row.key, row.setter)} />
            </div>
          ))}

          {/* 구독 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>구독</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>구독 관리</p>
              <p style={{ fontSize: 10, color: C.text4 }}>갱신일 2026년 4월 20일</p>
            </div>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, border: `1px solid ${C.amberGold}44`, color: C.amberGold, background: `${C.amberGold}08` }}>Pro</span>
            <span style={{ fontSize: 11, color: C.text5 }}>›</span>
          </div>

          {/* 개인정보 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>개인정보 & 계정</p>
          {['데이터 및 개인정보', '계정 설정'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>{label}</p>
              </div>
              <span style={{ fontSize: 11, color: C.text5 }}>›</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid #C0807033`, borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 11l3-3-3-3M13 8H6M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6" stroke="#C08070" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#C08070' }}>로그아웃</p>
          </div>

          {/* 계정 삭제 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '12px 0 4px' }}>위험 구역</p>
          {!deleteConfirm ? (
            <div onClick={() => setDeleteConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: '1px solid #DC262633', borderRadius: 11, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#DC26260A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#DC2626' }}>계정 삭제</p>
                <p style={{ fontSize: 10, color: C.text4 }}>모든 데이터가 영구적으로 삭제됩니다</p>
              </div>
            </div>
          ) : (
            <div style={{ background: '#DC26260A', border: '1px solid #DC262644', borderRadius: 11, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>정말 계정을 삭제하시겠어요?</p>
              <p style={{ fontSize: 10, color: C.text4, lineHeight: 1.5 }}>모든 대화, 분석 결과, 시그널이 영구 삭제되며 복구할 수 없습니다.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDeleteConfirm(false)} disabled={deleting}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text3, fontSize: 12, cursor: 'pointer' }}>
                  취소
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, cursor: 'pointer', opacity: deleting ? 0.5 : 1 }}>
                  {deleting ? '삭제 중...' : '영구 삭제'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SettingsSheet;
