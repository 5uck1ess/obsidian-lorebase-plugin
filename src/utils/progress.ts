export function normalizeProgress(value: number | null, total: number | null): number | null {
    if (value === null) return null;
    const normalized = Math.max(0, Math.trunc(value));
    return total && total > 0 ? Math.min(normalized, total) : normalized;
}

export function stepProgress(current: number | null, delta: number, total: number | null): number | null {
    return normalizeProgress((current ?? 0) + delta, total);
}
