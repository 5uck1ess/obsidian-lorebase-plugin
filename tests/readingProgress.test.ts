import { describe, expect, it } from 'vitest';
import { normalizeReadingProgress, stepReadingProgress } from '../src/modals/ReadingEditModal';

describe('reading progress limits', () => {
    it('never allows progress below zero', () => {
        expect(normalizeReadingProgress(-5, 10)).toBe(0);
        expect(stepReadingProgress(0, -1, 10)).toBe(0);
    });

    it('never allows typed or stepped progress above the known total', () => {
        expect(normalizeReadingProgress(999, 10)).toBe(10);
        expect(stepReadingProgress(10, 1, 10)).toBe(10);
    });

    it('keeps progress unrestricted when the total is unknown', () => {
        expect(normalizeReadingProgress(999, null)).toBe(999);
        expect(stepReadingProgress(999, 1, null)).toBe(1000);
    });

    it('normalizes manual input and buttons with the same integer rules', () => {
        expect(normalizeReadingProgress(4.9, 10)).toBe(4);
        expect(stepReadingProgress(3.9, 1, 10)).toBe(4);
        expect(normalizeReadingProgress(null, 10)).toBeNull();
    });
});
