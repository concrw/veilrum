import { useState, useEffect, useCallback } from 'react';
import { AmberBtn, FrostBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useUserMeData } from '../../hooks/useUserMeData';
import { usePremiumTrigger } from '../../hooks/usePremiumTrigger';
import UpgradeModal from '../../components/premium/UpgradeModal';
import { C } from '@/lib/colors';
import { ZONES, TOTAL_ZONES, RADAR_DATA, PERSONAS, FRIENDS, SEED_STAGES } from '@/data/mePageData';
import PersonaMap from '@/components/persona/PersonaMap';
import RadarChart from '@/components/me/RadarChart';
import MonthlyReportCard from '@/components/me/MonthlyReportCard';
import ZoneToggle from '@/components/me/ZoneToggle';
import AISheet from '@/components/me/AISheet';
import SettingsSheet from '@/components/me/SettingsSheet';
import RenameSheet from '@/components/me/RenameSheet';
import SeedCard from '@/components/me/SeedCard';
import PeopleSection from '@/components/me/PeopleSection';
import WeeklyReportSection from '@/components/me/WeeklyReportSection';
import DiagnosisSection from '@/components/me/DiagnosisSection';

/* ── Extracted static styles ── */
const PERSONA_TAG_STYLE = { fontSize: 9, padding: '2px 7px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.text4 } as const;
const RADAR_AXIS_ITEM_STYLE = { display: 'flex' as const, alignItems: 'center' as const, gap: 5, background: C.bg, borderRadius: 7, padding: '5px 8px' } as const;
const RADAR_AXIS_LABEL_STYLE = { fontSize: 9, fontWeight: 300, color: C.text4, flex: 1 } as const;
const RADAR_AXIS_VALUE_STYLE = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.text } as const;
const RADAR_BASELINE_STYLE = { fontSize: 10, fontWeight: 300, color: C.text5, marginLeft: 2 } as const;
const FRIEND_CARD_STYLE = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '11px 13px', display: 'flex' as const, alignItems: 'center' as const, gap: 10 } as const;
const FRIEND_NAME_STYLE = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 14, color: C.text, marginBottom: 2 } as const;
const FRIEND_REASON_STYLE = { fontSize: 10, fontWeight: 300, color: C.text4, lineHeight: 1.4 } as const;
const FRIEND_MATCH_STYLE = { fontSize: 9, padding: '2px 6px', borderRadius: 99, border: `1px solid ${C.amberGold}33`, color: C.amberGold, background: `${C.amberGold}08`, flexShrink: 0, whiteSpace: 'nowrap' as const } as const;
const FRIEND_DM_BTN_STYLE = { width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, cursor: 'pointer' as const, flexShrink: 0 } as const;
const ZONE_ITEM_NAME_STYLE = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 13.5, color: C.text, marginBottom: 1 } as const;
const ZONE_ITEM_DESC_STYLE = { fontSize: 10, fontWeight: 300, color: C.text4 } as const;
const ZONE_SENSITIVE_BADGE_STYLE = { fontSize: 9, padding: '2px 6px', borderRadius: 99, border: `1px solid ${C.amberDim}33`, color: C.amberDim, background: `${C.amberDim}0A`, flexShrink: 0 } as const;

export default function MePage() {
  type Tab = 'growth' | 'people' | 'zone';
  const { user } = useAuth();
  const meData = useUserMeData();
  const { isPro, modalOpen, activeTrigger, tryAccess, closeModal } = usePremiumTrigger();
  const [tab, setTab] = useState<Tab>('growth');

  // Zone state
  const [zoneState, setZoneState] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ZONES.forEach(g => g.items.forEach(item => { init[item.id] = item.defaultOn; }));
    return init;
  });
  const [zonesLoaded, setZonesLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('persona_zones').select('sub_zone, is_enabled').eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const loaded: Record<string, boolean> = {};
          (data as { sub_zone: string; is_enabled: boolean }[]).forEach(row => { loaded[row.sub_zone] = row.is_enabled; });
          setZoneState(prev => ({ ...prev, ...loaded }));
        }
        setZonesLoaded(true);
      });
  }, [user]);

  const toggleZone = useCallback(async (id: string) => {
    if (!user) return;
    const newVal = !zoneState[id];
    setZoneState(prev => ({ ...prev, [id]: newVal }));
    await supabase.from('persona_zones').upsert({
      user_id: user.id, sub_zone: id, is_enabled: newVal,
      layer: ZONES.find(g => g.items.some(i => i.id === id))?.layer ?? 'social',
      enabled_at: new Date().toISOString(),
    }, { onConflict: 'user_id,sub_zone' });
  }, [user, zoneState]);

  const [chartMode, setChartMode] = useState<'prev' | 'now'>('now');
  const [openPersona, setOpenPersona] = useState<number | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [aiSheet, setAiSheet] = useState<'amber' | 'frost' | null>(null);
  const amberFlash = useAmberAttention();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<'amber' | 'frost' | null>(null);
  const [amberName, setAmberName] = useState('엠버');
  const [frostName, setFrostName] = useState('프로스트');
  const [lang, setLang] = useState('ko');
  const [dmToast, setDmToast] = useState('');
  const [shareToast, setShareToast] = useState(false);

  const calcPct = useCallback(() => {
    // 정밀도% = Zone 토글(40%) + 실제 사용 데이터(60%)
    const zoneOn = Object.values(zoneState).filter(Boolean).length;
    const zonePct = zoneOn / TOTAL_ZONES; // 0~1

    const stats = meData?.stats;
    const sessionScore = Math.min((stats?.sessionCount ?? 0) / 20, 1);
    const signalScore = Math.min((stats?.signalCount ?? 0) / 50, 1);
    const patternScore = Math.min((stats?.patternAreaCount ?? 0) / 5, 1);

    const raw = zonePct * 40 + sessionScore * 25 + signalScore * 20 + patternScore * 15;
    return Math.min(Math.round(raw), 100);
  }, [zoneState, meData?.stats]);

  const pct = calcPct();
  const closedCount = Object.values(zoneState).filter(v => !v).length;
  const seedTitle = pct < 40 ? '씨앗을 심었어요' : pct < 65 ? '패턴이 보이기 시작했어요' : pct < 85 ? '뿌리를 내리는 중' : '꽃이 피어나고 있어요';

  const stageStatus = (i: number) => {
    const next = SEED_STAGES[i + 1]?.threshold ?? 101;
    if (pct >= next) return 'done' as const;
    if (pct >= SEED_STAGES[i].threshold) return 'active' as const;
    return 'none' as const;
  };

  const sendDM = (name: string) => {
    setDmToast(`${name}에게 대화 신청을 보냈어요 💬`);
    setTimeout(() => setDmToast(''), 2200);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'growth', label: '나의 성장' },
    { id: 'people', label: '내 사람들' },
    { id: 'zone',   label: 'Zone'     },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px 9px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 22, color: C.text, lineHeight: 1 }}>ME</span>
          <span style={{ fontSize: 10, fontWeight: 300, color: C.text4, letterSpacing: '.02em' }}>나를 알아가고 있어요</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setSettingsOpen(true)} aria-label="설정 열기" style={{ width: 28, height: 28, borderRadius: '50%', background: C.border2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke={C.text3} strokeWidth="1.2"/>
              <path d="M13.3 6.7l-.9-.5a5.1 5.1 0 0 0 0-1.4l.9-.5a.5.5 0 0 0 .2-.7l-1-1.7a.5.5 0 0 0-.7-.2l-.9.5a5 5 0 0 0-1.2-.7V1a.5.5 0 0 0-.5-.5H6.8A.5.5 0 0 0 6.3 1v1a5 5 0 0 0-1.2.7l-.9-.5a.5.5 0 0 0-.7.2l-1 1.7a.5.5 0 0 0 .2.7l.9.5a5.1 5.1 0 0 0 0 1.4l-.9.5a.5.5 0 0 0-.2.7l1 1.7a.5.5 0 0 0 .7.2l.9-.5a5 5 0 0 0 1.2.7V15a.5.5 0 0 0 .5.5h2.4a.5.5 0 0 0 .5-.5v-1a5 5 0 0 0 1.2-.7l.9.5a.5.5 0 0 0 .7-.2l1-1.7a.5.5 0 0 0-.2-.7z" stroke={C.text3} strokeWidth="1.2"/>
            </svg>
          </button>
          <AmberBtn onClick={() => setAiSheet('amber')} flash={amberFlash} />
          <FrostBtn onClick={() => setAiSheet('frost')} />
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border2}`, padding: '0 20px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontSize: 11, fontWeight: tab === t.id ? 400 : 300, color: tab === t.id ? C.amberGold : C.text4, padding: '10px 0', marginRight: 20, background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? C.amberGold : 'transparent'}`, cursor: 'pointer', transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Growth tab */}
      {tab === 'growth' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 80px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <SeedCard pct={pct} seedTitle={seedTitle} stats={meData.stats} stageStatus={stageStatus} />

          {/* Frost bar */}
          {closedCount > 0 && (
            <div className="vr-fade-in" style={{ background: `${C.frost}08`, border: `1px solid ${C.frost}22`, borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 17, height: 17, borderRadius: '50%', background: `${C.frost}15`, border: `1px solid ${C.frost}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.frost, display: 'block' }} />
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 12, color: C.text3, flex: 1, lineHeight: 1.5 }}>
                "현재 정밀도 {pct}%. {closedCount}개 영역이 닫혀 있어요. 열면 더 정확해져요."
              </p>
              <span style={{ fontSize: 9, color: C.text5, flexShrink: 0, marginTop: 2 }}>Frost</span>
            </div>
          )}

          {user && <PersonaMap userId={user.id} />}

          {/* Multi-persona */}
          <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '15px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text }}>멀티페르소나</span>
              <span style={{ fontSize: 9, fontWeight: 300, color: C.text4 }}>
                {meData.personasLoading ? '...' : `${meData.personas.length > 0 ? meData.personas.length : PERSONAS.length}개 발견됨`}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(meData.personas.length > 0 ? meData.personas : PERSONAS).map((p, i) => {
                const isOpen = openPersona === i;
                return (
                  <div key={i} onClick={() => setOpenPersona(isOpen ? null : i)}
                    style={{ background: isOpen ? `${C.amberGold}06` : C.bg, border: `1px solid ${isOpen ? `${C.amberGold}44` : C.border}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'all .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'block' }} />
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 14, color: C.text, flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, border: `1px solid ${isOpen ? `${C.amberGold}33` : C.border}`, color: isOpen ? C.amberGold : C.text4 }}>{p.zone}</span>
                    </div>
                    {isOpen && (
                      <div style={{ paddingTop: 9, marginTop: 9, borderTop: `1px solid ${C.border2}` }}>
                        <p style={{ fontSize: 11, fontWeight: 300, color: C.text3, lineHeight: 1.55, marginBottom: 6 }}>{p.desc}</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
                          {p.tags.map(tag => <span key={tag} style={PERSONA_TAG_STYLE}>{tag}</span>)}
                        </div>
                        <div style={{ background: `${C.amberGold}08`, border: `1px solid ${C.amberGold}22`, borderRadius: 7, padding: '7px 9px' }}>
                          <p style={{ fontSize: 9, color: C.amberGold, marginBottom: 2, fontWeight: 400, letterSpacing: '.05em' }}>다른 페르소나와의 충돌</p>
                          <p style={{ fontSize: 11, fontWeight: 300, color: C.text2, lineHeight: 1.5 }}>{p.conflict}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          {(() => {
            const radarNow = meData.radar?.now ?? RADAR_DATA.now;
            const radarPrev = meData.radar?.prev ?? RADAR_DATA.prev;
            const radarCurrent = chartMode === 'now' ? radarNow : radarPrev;
            return (
              <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '15px 17px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text }}>관계 프로필 변화</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {(['prev', 'now'] as const).map(m => (
                      <button key={m} onClick={() => setChartMode(m)}
                        disabled={m === 'prev' && !radarPrev}
                        style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, border: `1px solid ${chartMode === m ? `${C.amberGold}44` : C.border}`, color: chartMode === m ? C.amberGold : C.text4, background: chartMode === m ? `${C.amberGold}08` : 'transparent', cursor: (m === 'prev' && !radarPrev) ? 'default' : 'pointer', opacity: (m === 'prev' && !radarPrev) ? 0.4 : 1, transition: 'all .15s' }}>
                        {m === 'prev' ? '1개월 전' : '지금'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <RadarChart mode={chartMode} data={radarCurrent} prev={radarPrev} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {radarCurrent.axes.map((axis, i) => {
                    const nowVal = radarCurrent.vals[i];
                    const prevVal = radarPrev?.vals[i] ?? nowVal;
                    const delta = nowVal - prevVal;
                    return (
                      <div key={i} style={RADAR_AXIS_ITEM_STYLE}>
                        <span style={RADAR_AXIS_LABEL_STYLE}>{axis}</span>
                        <span style={RADAR_AXIS_VALUE_STYLE}>{nowVal}</span>
                        {chartMode === 'now' && radarPrev
                          ? <span style={{ fontSize: 9, fontWeight: 400, color: delta >= 0 ? C.amberGold : C.text4 }}>{delta >= 0 ? '+' : ''}{delta}</span>
                          : <span style={RADAR_BASELINE_STYLE}>기준</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <WeeklyReportSection weeklyReport={meData.weeklyReport} weeklyReportLoading={meData.weeklyReportLoading} />

          {user && <MonthlyReportCard userId={user.id} onTriggerUpgrade={isPro ? undefined : () => tryAccess('monthly_report_detail')} />}

          <DiagnosisSection diagnosis={meData.diagnosis} />

          {/* Friend recommendations */}
          <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text }}>대화가 잘 통할 것 같아요</span>
              <span style={{ fontSize: 9, fontWeight: 300, color: C.text4 }}>패턴과 zone 교집합 기준</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FRIENDS.map((f, i) => (
                <div key={i} style={FRIEND_CARD_STYLE}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.bg }}>{f.av}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={FRIEND_NAME_STYLE}>{f.name}</p>
                    <p style={FRIEND_REASON_STYLE}>{f.reason}</p>
                  </div>
                  <span style={FRIEND_MATCH_STYLE}>{f.match}</span>
                  <button onClick={() => sendDM(f.name)} style={FRIEND_DM_BTN_STYLE}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v8H8l-3 2V10H2z" stroke={C.text4} strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
            {dmToast && <p style={{ fontSize: 10, fontWeight: 300, color: C.amberGold, textAlign: 'center', marginTop: 6 }}>{dmToast}</p>}
          </div>

          {/* Share card */}
          <div className="vr-fade-in" style={{ background: `linear-gradient(135deg,${C.amberGold}08,${C.bg})`, border: `1px solid ${C.amberGold}33`, borderRadius: 14, padding: '14px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.amberGold}15`, border: `1px solid ${C.amberGold}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 10l4-4 3 3 5-6" stroke={C.amberGold} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text }}>나의 변화 공유하기</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 300, color: C.text4, lineHeight: 1.5, marginBottom: 9 }}>처음과 지금이 얼마나 달라졌는지 한 장으로.</p>
            <button onClick={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2500); }}
              style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: C.amberGold, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 400, color: C.bg, cursor: 'pointer' }}>
              공유 카드 만들기
            </button>
            {shareToast && <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 300, color: C.amberGold, marginTop: 7 }}>준비 중이에요 — 곧 만들 수 있어요 🌱</p>}
          </div>
        </div>
      )}

      {/* People tab */}
      {tab === 'people' && (
        <PeopleSection people={meData.people} peopleLoading={meData.peopleLoading} />
      )}

      {/* Zone tab */}
      {tab === 'zone' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '11px 20px 10px', borderBottom: `1px solid ${C.border2}` }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text, marginBottom: 2 }}>탐색 범위 설정</p>
            <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>열어둔 영역 안에서만 AI가 작동해요.</p>
          </div>
          <div style={{ flexShrink: 0, padding: '9px 20px', borderBottom: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 300, color: C.text4, flexShrink: 0 }}>정밀도</span>
            <div style={{ flex: 1, height: 3, background: C.border2, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${C.amberGold},${C.amber})`, width: `${pct}%`, transition: 'width .4s ease' }} />
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.amberGold, flexShrink: 0, minWidth: 34, textAlign: 'right' }}>{pct}%</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '11px 20px 80px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {closedCount > 0 && (
              <div style={{ background: `${C.frost}08`, border: `1px solid ${C.frost}22`, borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 17, height: 17, borderRadius: '50%', background: `${C.frost}15`, border: `1px solid ${C.frost}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.frost, display: 'block' }} />
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 12, color: C.text3, flex: 1, lineHeight: 1.5 }}>
                  "현재 정밀도 {pct}%. {closedCount}개 영역이 닫혀 있어요."
                </p>
                <span style={{ fontSize: 9, color: C.text5, flexShrink: 0, marginTop: 2 }}>Frost</span>
              </div>
            )}
            {ZONES.map((g, gi) => {
              const groupOpen = openGroups[gi] !== false;
              return (
                <div key={gi} className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
                  <div onClick={() => setOpenGroups(prev => ({ ...prev, [gi]: !groupOpen }))}
                    style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0, display: 'block' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text, marginBottom: 2 }}>{g.title}</p>
                      <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>{g.sub}</p>
                    </div>
                    <span style={{ fontSize: 11, color: C.text5, transform: groupOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block', flexShrink: 0 }}>›</span>
                  </div>
                  {groupOpen && (
                    <div style={{ borderTop: `1px solid ${C.border2}` }}>
                      {g.items.map((item, ii) => (
                        <div key={item.id} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: ii < g.items.length - 1 ? `1px solid ${C.border2}` : 'none' }}>
                          <div style={{ flex: 1 }}>
                            <p style={ZONE_ITEM_NAME_STYLE}>{item.name}</p>
                            <p style={ZONE_ITEM_DESC_STYLE}>{item.desc}</p>
                          </div>
                          {item.sensitive && <span style={ZONE_SENSITIVE_BADGE_STYLE}>민감</span>}
                          <ZoneToggle on={zoneState[item.id]} onToggle={() => toggleZone(item.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sheets */}
      <AISheet open={aiSheet === 'amber'} type="amber" aiName={amberName} onClose={() => setAiSheet(null)} />
      <AISheet open={aiSheet === 'frost'} type="frost" aiName={frostName} onClose={() => setAiSheet(null)} />
      <SettingsSheet
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        amberName={amberName} frostName={frostName}
        onRenameAmber={() => { setSettingsOpen(false); setTimeout(() => setRenameTarget('amber'), 350); }}
        onRenameFrost={() => { setSettingsOpen(false); setTimeout(() => setRenameTarget('frost'), 350); }}
        lang={lang} onChangeLang={setLang}
      />
      <RenameSheet
        open={renameTarget !== null} onClose={() => setRenameTarget(null)}
        title={renameTarget === 'amber' ? '엠버 이름 변경' : '프로스트 이름 변경'}
        currentName={renameTarget === 'amber' ? amberName : frostName}
        onApply={(n) => { if (renameTarget === 'amber') setAmberName(n); else setFrostName(n); setRenameTarget(null); }}
      />
      <UpgradeModal open={modalOpen} onClose={closeModal} trigger={activeTrigger} />
    </div>
  );
}
