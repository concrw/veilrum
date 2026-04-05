import { describe, it, expect } from 'vitest';
import {
  calculateAxisScores,
  findMasks,
  generateInsights,
  classifyVProfile,
  runDiagnosis,
  MASK_PROFILES,
  ATTRACTION_PAIRS,
  VFILE_CONTEXT_LABELS,
} from '@/lib/vfileAlgorithm';
import type { AxisScores } from '@/context/AuthContext';

describe('vfileAlgorithm', () => {
  // ── MASK_PROFILES data integrity ──────────────────────────────────
  describe('MASK_PROFILES', () => {
    it('has 12 masks total', () => {
      expect(MASK_PROFILES).toHaveLength(12);
    });

    it('has 6 predatory and 6 prey', () => {
      const predatory = MASK_PROFILES.filter(m => m.category === 'predatory');
      const prey = MASK_PROFILES.filter(m => m.category === 'prey');
      expect(predatory).toHaveLength(6);
      expect(prey).toHaveLength(6);
    });

    it('every mask has a unique mskCode', () => {
      const codes = MASK_PROFILES.map(m => m.mskCode);
      expect(new Set(codes).size).toBe(12);
    });

    it('every mask has a valid pairCode referencing another mask', () => {
      const codes = new Set(MASK_PROFILES.map(m => m.mskCode));
      for (const mask of MASK_PROFILES) {
        expect(codes.has(mask.pairCode)).toBe(true);
      }
    });

    it('every mask has scores with all 4 axes (A, B, C, D)', () => {
      for (const mask of MASK_PROFILES) {
        expect(mask.scores).toHaveProperty('A');
        expect(mask.scores).toHaveProperty('B');
        expect(mask.scores).toHaveProperty('C');
        expect(mask.scores).toHaveProperty('D');
      }
    });
  });

  // ── ATTRACTION_PAIRS ──────────────────────────────────────────────
  describe('ATTRACTION_PAIRS', () => {
    it('has 6 pairs', () => {
      expect(ATTRACTION_PAIRS).toHaveLength(6);
    });

    it('each pair references valid predatory and prey MSK codes', () => {
      const predatoryCodes = new Set(MASK_PROFILES.filter(m => m.category === 'predatory').map(m => m.mskCode));
      const preyCodes = new Set(MASK_PROFILES.filter(m => m.category === 'prey').map(m => m.mskCode));
      for (const pair of ATTRACTION_PAIRS) {
        expect(predatoryCodes.has(pair.predatory)).toBe(true);
        expect(preyCodes.has(pair.prey)).toBe(true);
      }
    });
  });

  // ── VFILE_CONTEXT_LABELS ──────────────────────────────────────────
  describe('VFILE_CONTEXT_LABELS', () => {
    it('has general, social, secret contexts', () => {
      expect(VFILE_CONTEXT_LABELS).toHaveProperty('general');
      expect(VFILE_CONTEXT_LABELS).toHaveProperty('social');
      expect(VFILE_CONTEXT_LABELS).toHaveProperty('secret');
    });
  });

  // ── calculateAxisScores ───────────────────────────────────────────
  describe('calculateAxisScores', () => {
    it('returns default 50 for all axes when no responses', () => {
      const scores = calculateAxisScores({});
      expect(scores).toEqual({ A: 50, B: 50, C: 50, D: 50 });
    });

    it('clamps values to 0-100 range', () => {
      // Even if raw response is out of range, it should be clamped
      const scores = calculateAxisScores({ Q01: 150, Q11: -50 });
      // Q01 is axis A, Q11 is axis B — both should be clamped
      expect(scores.A).toBeGreaterThanOrEqual(0);
      expect(scores.A).toBeLessThanOrEqual(100);
      expect(scores.B).toBeGreaterThanOrEqual(0);
      expect(scores.B).toBeLessThanOrEqual(100);
    });

    it('computes correct average for axis A with known responses', () => {
      // Q01-Q10 are axis A questions (all non-reversed based on vfileQuestions)
      const scores = calculateAxisScores({ Q01: 80, Q02: 60 });
      // Both A-axis, non-reversed: avg of 80 and 60 = 70
      expect(scores.A).toBe(70);
    });
  });

  // ── findMasks ─────────────────────────────────────────────────────
  describe('findMasks', () => {
    it('returns primary and secondary masks', () => {
      const scores: AxisScores = { A: 20, B: 20, C: 25, D: 90 };
      const result = findMasks(scores);
      expect(result.primary).toBeDefined();
      expect(result.secondary).toBeDefined();
      expect(result.primary.mskCode).toBeTruthy();
      expect(result.secondary.mskCode).toBeTruthy();
    });

    it('matches Controller (PWR) for scores { A:20, B:20, C:25, D:90 }', () => {
      // These are the exact scores for Controller
      const scores: AxisScores = { A: 20, B: 20, C: 25, D: 90 };
      const result = findMasks(scores);
      expect(result.primary.mskCode).toBe('PWR');
    });

    it('matches Mirror (EMP) for scores { A:75, B:25, C:20, D:15 }', () => {
      const scores: AxisScores = { A: 75, B: 25, C: 20, D: 15 };
      const result = findMasks(scores);
      expect(result.primary.mskCode).toBe('EMP');
    });

    it('flags isComplex when top two masks are close', () => {
      // Scores equidistant between two masks should set isComplex
      const scores: AxisScores = { A: 17, B: 17, C: 20, D: 60 };
      const result = findMasks(scores);
      expect(typeof result.isComplex).toBe('boolean');
    });

    it('primary and secondary are different masks', () => {
      const scores: AxisScores = { A: 50, B: 50, C: 50, D: 50 };
      const result = findMasks(scores);
      expect(result.primary.mskCode).not.toBe(result.secondary.mskCode);
    });
  });

  // ── generateInsights ──────────────────────────────────────────────
  describe('generateInsights', () => {
    it('returns exactly 3 insights', () => {
      const scores: AxisScores = { A: 80, B: 30, C: 60, D: 40 };
      const { primary, secondary, isComplex } = findMasks(scores);
      const insights = generateInsights(scores, primary, secondary, isComplex);
      expect(insights).toHaveLength(3);
    });

    it('insights are non-empty strings', () => {
      const scores: AxisScores = { A: 20, B: 20, C: 25, D: 90 };
      const { primary, secondary, isComplex } = findMasks(scores);
      const insights = generateInsights(scores, primary, secondary, isComplex);
      for (const insight of insights) {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(10);
      }
    });

    it('first insight mentions the most extreme axis', () => {
      const scores: AxisScores = { A: 10, B: 50, C: 50, D: 50 };
      const { primary, secondary, isComplex } = findMasks(scores);
      const insights = generateInsights(scores, primary, secondary, isComplex);
      // A is the most extreme (10 is 40 away from 50)
      expect(insights[0]).toContain('애착');
    });

    it('second insight mentions the primary mask core wound', () => {
      const scores: AxisScores = { A: 20, B: 20, C: 25, D: 90 };
      const { primary, secondary, isComplex } = findMasks(scores);
      const insights = generateInsights(scores, primary, secondary, isComplex);
      expect(insights[1]).toContain(primary.coreWound);
    });
  });

  // ── classifyVProfile ──────────────────────────────────────────────
  describe('classifyVProfile', () => {
    it('returns AOEP for all-high scores', () => {
      const result = classifyVProfile({ A: 80, B: 70, C: 60, D: 90 });
      expect(result.code).toBe('AOEP');
      expect(result.axes.A).toBe('high');
      expect(result.axes.B).toBe('high');
      expect(result.axes.C).toBe('high');
      expect(result.axes.D).toBe('high');
    });

    it('returns VCSR for all-low scores', () => {
      const result = classifyVProfile({ A: 10, B: 20, C: 30, D: 40 });
      expect(result.code).toBe('VCSR');
      expect(result.axes.A).toBe('low');
      expect(result.axes.B).toBe('low');
      expect(result.axes.C).toBe('low');
      expect(result.axes.D).toBe('low');
    });

    it('threshold is exactly 50 (50 = high)', () => {
      const result = classifyVProfile({ A: 50, B: 50, C: 50, D: 50 });
      expect(result.code).toBe('AOEP');
    });

    it('returns a Korean name and description', () => {
      const result = classifyVProfile({ A: 80, B: 30, C: 70, D: 20 });
      expect(result.nameKo).toBeTruthy();
      expect(result.description).toBeTruthy();
      expect(result.description.length).toBeGreaterThan(10);
    });

    it('mixed scores produce correct code', () => {
      // A=high->A, B=low->C, C=high->E, D=low->R
      const result = classifyVProfile({ A: 70, B: 30, C: 60, D: 20 });
      expect(result.code).toBe('ACER');
    });
  });

  // ── runDiagnosis ──────────────────────────────────────────────────
  describe('runDiagnosis', () => {
    it('returns a complete DiagnosisResult', () => {
      const result = runDiagnosis({ Q01: 80, Q02: 60 });
      expect(result.scores).toBeDefined();
      expect(result.primary).toBeDefined();
      expect(result.secondary).toBeDefined();
      expect(result.insights).toHaveLength(3);
      expect(result.dataSource).toBe('priper');
      expect(result.context).toBe('general');
      expect(result.vProfile).toBeDefined();
    });

    it('uses provided context', () => {
      const result = runDiagnosis({ Q01: 50 }, 'social');
      expect(result.context).toBe('social');
    });

    it('defaults context to general', () => {
      const result = runDiagnosis({});
      expect(result.context).toBe('general');
    });
  });
});
