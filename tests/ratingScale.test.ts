import { describe, it, expect } from 'vitest';
import {
    normalizeRatingScale,
    clampRating,
    ratingReadout,
    ratingFillPct,
    ratingBadgeText,
} from '../src/services/ratingScale';

describe('normalizeRatingScale', () => {
    it('accepts 10 (number and string)', () => {
        expect(normalizeRatingScale(10)).toBe(10);
        expect(normalizeRatingScale('10')).toBe(10);
    });
    it('defaults everything else to 5', () => {
        for (const v of [5, '5', undefined, null, 0, 7, 'abc', {}]) {
            expect(normalizeRatingScale(v)).toBe(5);
        }
    });
});

describe('clampRating', () => {
    it('passes in-range values through', () => {
        expect(clampRating(8, 10)).toBe(8);
        expect(clampRating(4, 5)).toBe(4);
    });
    it('clamps above the scale down to the max', () => {
        expect(clampRating(12, 10)).toBe(10);
        expect(clampRating(7, 5)).toBe(5);
    });
    it('rounds non-integers before clamping', () => {
        expect(clampRating(8.6, 10)).toBe(9);
        expect(clampRating(2.4, 5)).toBe(2);
    });
    it('returns null for null, NaN, and values below 1', () => {
        expect(clampRating(null, 10)).toBe(null);
        expect(clampRating(NaN, 10)).toBe(null);
        expect(clampRating(0, 10)).toBe(null);
        expect(clampRating(0.4, 10)).toBe(null);
    });
});

describe('ratingReadout', () => {
    it('formats value over scale', () => {
        expect(ratingReadout(8, 10)).toBe('8.0 / 10.0');
        expect(ratingReadout(4, 5)).toBe('4.0 / 5.0');
    });
    it('reads 0.0 when unset', () => {
        expect(ratingReadout(null, 10)).toBe('0.0 / 10.0');
    });
});

describe('ratingFillPct', () => {
    it('computes percentage of scale', () => {
        expect(ratingFillPct(8, 10)).toBe(80);
        expect(ratingFillPct(5, 5)).toBe(100);
        expect(ratingFillPct(10, 10)).toBe(100);
    });
    it('is 0 when unset', () => {
        expect(ratingFillPct(null, 10)).toBe(0);
    });
});

describe('ratingBadgeText', () => {
    it('shows the emoji in emoji mode when one exists', () => {
        expect(ratingBadgeText(3, 'emoji', '😐')).toBe('😐');
    });
    it('falls back to ★N in emoji mode when no emoji exists', () => {
        expect(ratingBadgeText(8, 'emoji', undefined)).toBe('★8');
    });
    it('always shows ★N in star mode', () => {
        expect(ratingBadgeText(3, 'star', '😐')).toBe('★3');
        expect(ratingBadgeText(10, 'star', undefined)).toBe('★10');
    });
});
