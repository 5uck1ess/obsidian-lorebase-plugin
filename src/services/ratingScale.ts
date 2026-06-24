/**
 * LOREBASE — Rating scale helpers
 *
 * Pure functions (no Obsidian imports) for the configurable 1–5 / 1–10
 * personal rating scale. Keeping the math here makes it unit-testable and
 * keeps the scale logic in one place.
 */
import { UserRating, RatingScale } from '../types';

/** Coerce any persisted value to a valid rating scale; defaults to 5. */
export function normalizeRatingScale(raw: unknown): RatingScale {
    return Number(raw) === 10 ? 10 : 5;
}

/**
 * Round to the nearest integer, then clamp into [1, scale].
 * Returns null for null, non-finite values, or values that round below 1.
 */
export function clampRating(value: number | null, scale: RatingScale): UserRating {
    if (value === null || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    if (rounded < 1) return null;
    return (rounded > scale ? scale : rounded) as UserRating;
}

/** Readout like "8.0 / 10.0"; unset reads "0.0 / {scale}.0". */
export function ratingReadout(value: UserRating, scale: RatingScale): string {
    const numeric = value ?? 0;
    return `${numeric.toFixed(1)} / ${scale}.0`;
}

/** Fill-bar percentage (0–100) for value over scale. */
export function ratingFillPct(value: UserRating, scale: RatingScale): number {
    const numeric = value ?? 0;
    return Math.round((numeric / scale) * 100);
}

/**
 * Badge text. In emoji mode, returns `emoji` when one is supplied (defined
 * for 1–5); otherwise falls back to "★N" so values above 5 are never blank.
 */
export function ratingBadgeText(
    value: number,
    mode: 'emoji' | 'star',
    emoji: string | undefined,
): string {
    if (mode === 'emoji' && emoji) return emoji;
    return `★${value}`;
}
