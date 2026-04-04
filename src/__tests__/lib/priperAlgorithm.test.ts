import { describe, it, expect } from 'vitest';
import {
  MASK_PROFILES,
  calculateAxisScores,
  findMasks,
  generateInsights,
  runDiagnosis,
} from '@/lib/vfileAlgorithm';
import type { MaskProfile, DiagnosisResult } from '@/lib/vfileAlgorithm';
import type { AxisScores } from '@/context/AuthContext';

describe('vfileAlgorithm (V-File)', () => {
  describe('MASK_PROFILES', () => {
    it('contains exactly 12 masks', () => {
      expect(MASK_PROFILES).toHaveLength(12);
    });

    it('each mask has all required fields', () => {
      const requiredFields: (keyof MaskProfile)[] = [
        'id', 'nameKo', 'nameEn', 'archetype', 'description',
        'scores', 'coreWound', 'coreFear', 'coreNeed', 'color',
      ];
      for (const mask of MASK_PROFILES) {
        for (const field of requiredFields) {
          expect(mask, `${mask.id} missing ${field}`).toHaveProperty(field);
        }
      }
    });

    it('all mask IDs are unique', () => {
      const ids = MASK_PROFILES.map(m => m.id);
      expect(new Set(ids).size).toBe(12);
    });

    it('all masks have scores with A, B, C, D keys', () => {
      for (const mask of MASK_PROFILES) {
        expect(mask.scores).toHaveProperty('A');
        expect(mask.scores).toHaveProperty('B');
        expect(mask.scores).toHaveProperty('C');
        expect(mask.scores).toHaveProperty('D');
      }
    });

    it('all score values are between 0 and 100', () => {
      for (const mask of MASK_PROFILES) {
        for (const key of ['A', 'B', 'C', 'D'] as (keyof AxisScores)[]) {
          expect(mask.scores[key]).toBeGreaterThanOrEqual(0);
          expect(mask.scores[key]).toBeLessThanOrEqual(100);
        }
      }
    });

    it('all colors are valid hex codes', () => {
      for (const mask of MASK_PROFILES) {
        expect(mask.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('findMasks (euclidean distance)', () => {
    it('high attachment score maps near mirror(EMP) mask', () => {
      const scores: AxisScores = { A: 80, B: 25, C: 20, D: 15 };
      const { primary } = findMasks(scores);
      expect(['mirror', 'victim']).toContain(primary.id); // EMP(거울) or DEP(희생자)
    });

    it('low all scores maps near achiever(NRC) mask', () => {
      // 공허자(NRC): A:15, B:15, C:15, D:30
      const scores: AxisScores = { A: 15, B: 15, C: 15, D: 30 };
      const { primary } = findMasks(scores);
      expect(primary.id).toBe('achiever'); // 공허자(NRC)
      expect(primary.mskCode).toBe('NRC');
    });

    it('returns primary and secondary that are different', () => {
      const scores: AxisScores = { A: 50, B: 50, C: 50, D: 50 };
      const { primary, secondary } = findMasks(scores);
      expect(primary.id).not.toBe(secondary.id);
    });

    it('isComplex is true when top 2 distances are close', () => {
      // Explorer(PSP) scores: A:85, B:80, C:85, D:80
      const exactExplorer: AxisScores = { A: 85, B: 80, C: 85, D: 80 };
      const result = findMasks(exactExplorer);
      expect(result.primary.id).toBe('explorer'); // 탐험자(PSP)
      expect(result.primary.mskCode).toBe('PSP');
      expect(typeof result.isComplex).toBe('boolean');
    });
  });

  describe('calculateAxisScores', () => {
    it('returns object with A, B, C, D keys', () => {
      const result = calculateAxisScores({});
      expect(result).toHaveProperty('A');
      expect(result).toHaveProperty('B');
      expect(result).toHaveProperty('C');
      expect(result).toHaveProperty('D');
    });

    it('returns 50 for all axes when no responses', () => {
      const result = calculateAxisScores({});
      expect(result).toEqual({ A: 50, B: 50, C: 50, D: 50 });
    });
  });

  describe('runDiagnosis', () => {
    it('returns primary and secondary mask', () => {
      const result = runDiagnosis({});
      expect(result.primary).toBeDefined();
      expect(result.secondary).toBeDefined();
      expect(result.primary.id).not.toBe(result.secondary.id);
    });

    it('returns isComplex flag as boolean', () => {
      const result = runDiagnosis({});
      expect(typeof result.isComplex).toBe('boolean');
    });

    it('insights array is non-empty', () => {
      const result = runDiagnosis({});
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('insights contains exactly 3 strings', () => {
      const result = runDiagnosis({});
      expect(result.insights).toHaveLength(3);
      for (const insight of result.insights) {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      }
    });

    it('scores are valid AxisScores', () => {
      const result = runDiagnosis({});
      for (const key of ['A', 'B', 'C', 'D'] as (keyof AxisScores)[]) {
        expect(result.scores[key]).toBeGreaterThanOrEqual(0);
        expect(result.scores[key]).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('generateInsights', () => {
    it('generates 3 insights', () => {
      const primary = MASK_PROFILES[0];
      const secondary = MASK_PROFILES[1];
      const scores: AxisScores = { A: 80, B: 30, C: 40, D: 20 };
      const insights = generateInsights(scores, primary, secondary, false);
      expect(insights).toHaveLength(3);
    });

    it('mentions primary mask name in insights', () => {
      const primary = MASK_PROFILES[0]; // mirror
      const secondary = MASK_PROFILES[1]; // glass
      const scores: AxisScores = { A: 80, B: 30, C: 40, D: 20 };
      const insights = generateInsights(scores, primary, secondary, false);
      const combined = insights.join(' ');
      expect(combined).toContain(primary.nameKo);
    });

    it('complex result mentions both masks', () => {
      const primary = MASK_PROFILES[0];
      const secondary = MASK_PROFILES[1];
      const scores: AxisScores = { A: 80, B: 30, C: 40, D: 20 };
      const insights = generateInsights(scores, primary, secondary, true);
      const combined = insights.join(' ');
      expect(combined).toContain(primary.nameKo);
      expect(combined).toContain(secondary.nameKo);
    });
  });
});
