/** Pure helpers for the configurable 1-5 / 1-10 personal rating scale. */
import type { RatingBadgeMode, RatingScale, UserRating } from '../types';

/** Coerce a persisted value to a supported scale, defaulting safely to 5. */
export function normalizeRatingScale(raw: unknown): RatingScale {
    return Number(raw) === 10 ? 10 : 5;
}

/** Round a numeric rating and constrain it to the active scale. */
export function clampRating(value: number | null, scale: RatingScale): UserRating {
    if (value === null || !Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    if (rounded < 1) return null;
    return Math.min(rounded, scale) as UserRating;
}

export function ratingReadout(value: UserRating, scale: RatingScale): string {
    return `${(value ?? 0).toFixed(1)} / ${scale}.0`;
}

export function ratingFillPct(value: UserRating, scale: RatingScale): number {
    return Math.round(((value ?? 0) / scale) * 100);
}

/** Preserve emoji badges for 1-5 and use a numeric star when no emoji exists. */
export function ratingBadgeText(
    value: number,
    mode: RatingBadgeMode,
    emoji: string | undefined
): string {
    if (mode === 'emoji' && emoji) return emoji;
    return `\u2605${value}`;
}
