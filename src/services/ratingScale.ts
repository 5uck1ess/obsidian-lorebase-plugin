/**
 * Pure helpers for the configurable 1-5 / 1-10 personal rating scale.
 */
import type { RatingBadgeMode, RatingScale, UserRating } from '../types';

/** Coerce any persisted value to a valid rating scale; defaults to 5. */
export function normalizeRatingScale(raw: unknown): RatingScale {
    return Number(raw) === 10 ? 10 : 5;
}

/** Round to the nearest integer and clamp it to the active scale. */
export function clampRating(value: number | null, scale: RatingScale): UserRating {
    if (value === null || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    if (rounded < 1) return null;
    return (rounded > scale ? scale : rounded) as UserRating;
}

/** Readout like "8.0 / 10.0"; an unset value reads "0.0 / {scale}.0". */
export function ratingReadout(value: UserRating, scale: RatingScale): string {
    const numeric = value ?? 0;
    return `${numeric.toFixed(1)} / ${scale}.0`;
}

/** Fill-bar percentage for a value on the active scale. */
export function ratingFillPct(value: UserRating, scale: RatingScale): number {
    const numeric = value ?? 0;
    return Math.round((numeric / scale) * 100);
}

/**
 * Compose the existing badge mode with the wider scale. Emoji values retain
 * their current output; values without an emoji fall back to a numeric star.
 */
export function ratingBadgeText(
    value: number,
    mode: RatingBadgeMode,
    emoji: string | undefined,
): string {
    if (mode === 'emoji' && emoji) return emoji;
    return `\u2605${value}`;
}
