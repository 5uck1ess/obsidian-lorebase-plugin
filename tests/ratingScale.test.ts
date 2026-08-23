import { describe, expect, it } from 'vitest';
import {
    clampRating,
    normalizeRatingScale,
    ratingBadgeText,
    ratingFillPct,
    ratingReadout,
} from '../src/services/ratingScale';

describe('normalizeRatingScale', () => {
    it('accepts 10 as a number or string', () => {
        expect(normalizeRatingScale(10)).toBe(10);
        expect(normalizeRatingScale('10')).toBe(10);
    });

    it('defaults every other value to 5', () => {
        for (const value of [5, '5', undefined, null, 0, 7, 'abc', {}]) {
            expect(normalizeRatingScale(value)).toBe(5);
        }
    });
});

describe('clampRating', () => {
    it('passes through in-range values and clamps values above the scale', () => {
        expect(clampRating(8, 10)).toBe(8);
        expect(clampRating(4, 5)).toBe(4);
        expect(clampRating(12, 10)).toBe(10);
        expect(clampRating(7, 5)).toBe(5);
    });

    it('rounds values and rejects null, non-finite, and values below 1', () => {
        expect(clampRating(8.6, 10)).toBe(9);
        expect(clampRating(2.4, 5)).toBe(2);
        expect(clampRating(null, 10)).toBeNull();
        expect(clampRating(Number.NaN, 10)).toBeNull();
        expect(clampRating(0.4, 10)).toBeNull();
    });
});

describe('rating display helpers', () => {
    it('formats readouts and fill percentages for both scales', () => {
        expect(ratingReadout(8, 10)).toBe('8.0 / 10.0');
        expect(ratingReadout(4, 5)).toBe('4.0 / 5.0');
        expect(ratingReadout(null, 10)).toBe('0.0 / 10.0');
        expect(ratingFillPct(8, 10)).toBe(80);
        expect(ratingFillPct(5, 5)).toBe(100);
        expect(ratingFillPct(null, 10)).toBe(0);
    });

    it('keeps emoji output and falls back to a numeric star', () => {
        expect(ratingBadgeText(3, 'emoji', '😐')).toBe('😐');
        expect(ratingBadgeText(8, 'emoji', undefined)).toBe('★8');
        expect(ratingBadgeText(3, 'star', '😐')).toBe('★3');
        expect(ratingBadgeText(10, 'star', undefined)).toBe('★10');
    });
});
