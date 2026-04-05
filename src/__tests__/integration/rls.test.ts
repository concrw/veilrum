// @vitest-environment node
/**
 * Supabase RLS (Row Level Security) 통합 테스트 — Data Harness
 *
 * 목적: 실제 DB 정책이 의도대로 동작하는지 검증 (보안 하네스)
 * 방식: anon 키로 쿼리를 실행하여 인증되지 않은 접근 차단 확인
 *
 * 실행 조건:
 *   - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 환경변수 필요
 *   - 환경변수 미설정 시 전체 스킵 (CI에서 secrets 없이도 안전)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const hasEnv = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

const describeIfEnv = hasEnv ? describe : describe.skip;

let anonClient: ReturnType<typeof createClient>;

beforeAll(() => {
  if (!hasEnv) return;
  anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'veilrum' },
  });
});

// ── user_profiles ────────────────────────────────────────────────────

describeIfEnv('RLS: user_profiles', () => {
  it('비인증 상태에서 SELECT하면 0건이 반환된다', async () => {
    const { data, error } = await anonClient
      .from('user_profiles')
      .select('user_id')
      .limit(5);
    if (error) { expect(error.code).toBeTruthy(); }
    else { expect(data).toHaveLength(0); }
  });

  it('비인증 상태에서 INSERT하면 차단된다', async () => {
    const { error } = await anonClient
      .from('user_profiles')
      .insert({ user_id: '00000000-0000-0000-0000-000000000000', display_name: 'hacker' });
    expect(error).not.toBeNull();
  });
});

// ── subscriptions ────────────────────────────────────────────────────

describeIfEnv('RLS: subscriptions', () => {
  it('비인증 상태에서 SELECT하면 0건이 반환된다', async () => {
    const { data, error } = await anonClient
      .from('subscriptions')
      .select('user_id, tier')
      .limit(5);
    if (error) { expect(error.code).toBeTruthy(); }
    else { expect(data).toHaveLength(0); }
  });

  it('타겟 유저 구독 정보를 직접 조회할 수 없다 (BOLA 방지)', async () => {
    const { data, error } = await anonClient
      .from('subscriptions')
      .select('tier')
      .eq('user_id', '00000000-0000-0000-0000-000000000001')
      .limit(1);
    if (error) { expect(error.code).toBeTruthy(); }
    else { expect(data).toHaveLength(0); }
  });
});

// ── codetalk_entries ─────────────────────────────────────────────────

describeIfEnv('RLS: codetalk_entries', () => {
  it('비인증 상태에서 공개 항목 접근 시 RLS가 적용된다', async () => {
    const { data, error } = await anonClient
      .from('codetalk_entries')
      .select('id, is_public')
      .eq('is_public', true)
      .limit(3);
    if (error) {
      expect(error.message).toContain('permission denied');
    } else {
      if (data && data.length > 0) {
        for (const entry of data) { expect(entry.is_public).toBe(true); }
      }
    }
  });

  it('비공개 항목은 조회되지 않는다', async () => {
    const { data, error } = await anonClient
      .from('codetalk_entries')
      .select('id, is_public')
      .eq('is_public', false)
      .limit(3);
    if (error) { expect(error.code).toBeTruthy(); }
    else { expect(data).toHaveLength(0); }
  });

  it('비인증 상태에서 INSERT하면 차단된다', async () => {
    const { error } = await anonClient
      .from('codetalk_entries')
      .insert({ user_id: '00000000-0000-0000-0000-000000000000', keyword: 'test', is_public: true });
    expect(error).not.toBeNull();
  });
});

// ── cq_responses ─────────────────────────────────────────────────────

describeIfEnv('RLS: cq_responses (핵심 감정 응답 — 민감 데이터)', () => {
  it('비인증 상태에서 조회 불가하다', async () => {
    const { data, error } = await anonClient
      .from('cq_responses')
      .select('user_id')
      .limit(5);
    if (error) { expect(error.code).toBeTruthy(); }
    else { expect(data).toHaveLength(0); }
  });
});

// ── 환경변수 체크 ─────────────────────────────────────────────────────

describe('RLS test setup', () => {
  it('환경변수 설정 여부를 확인한다', () => {
    if (!hasEnv) {
      console.warn(
        '[RLS] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 미설정 → RLS 통합 테스트 스킵\n' +
        'CI GitHub Secrets에 위 값을 추가하면 자동 실행됩니다.'
      );
    }
    expect(true).toBe(true);
  });
});
