import { afterEach, describe, expect, it, vi } from 'vitest';
import { __setRequestUrlMock } from './mocks/obsidian';
import {
    fetchJson,
    isProviderBlockedError,
    isRateLimitError,
    resetIntegrationRequestStateForTests,
} from '../src/services/integrations/shared';

describe('integration rate-limit detection', () => {
    afterEach(() => {
        vi.useRealTimers();
        __setRequestUrlMock(null);
        resetIntegrationRequestStateForTests();
    });

    it('recognizes request errors that expose an HTTP status', () => {
        expect(isRateLimitError({ status: 429 })).toBe(true);
        expect(isRateLimitError({ statusCode: 429 })).toBe(true);
    });

    it('recognizes common provider error messages and nested causes', () => {
        expect(isRateLimitError(new Error('Request failed, status 429'))).toBe(true);
        expect(isRateLimitError(new Error('Too Many Requests'))).toBe(true);
        expect(isRateLimitError(new Error('Provider rate limit reached'))).toBe(true);
        expect(isRateLimitError({ cause: new Error('HTTP 429') })).toBe(true);
    });

    it('does not classify unrelated failures as rate limits', () => {
        expect(isRateLimitError(new Error('Request failed, status 500'))).toBe(false);
        expect(isRateLimitError(new Error('Item 4290 was not found'))).toBe(false);
        expect(isRateLimitError(null)).toBe(false);
    });

    it('rejects a returned 429 response even when the request layer does not throw', async () => {
        __setRequestUrlMock(() => ({ status: 429, json: { message: 'slow down' } }));

        await expect(fetchJson('https://example.com/items')).rejects.toMatchObject({ status: 429 });
    });

    it('opens a per-provider circuit after 403 instead of repeating blocked requests', async () => {
        let calls = 0;
        __setRequestUrlMock(() => {
            calls++;
            return { status: 403, json: { message: 'forbidden' } };
        });

        const first = fetchJson('https://store.steampowered.com/api/appdetails?appids=10');
        await expect(first).rejects.toMatchObject({ status: 403 });
        await expect(first).rejects.toThrow(/paused to prevent a longer block/i);
        await expect(fetchJson('https://store.steampowered.com/search/results/?term=portal'))
            .rejects.toMatchObject({ status: 403 });
        expect(calls).toBe(1);
    });

    it('classifies both 403 and 429 as provider blocks', () => {
        expect(isProviderBlockedError({ status: 403 })).toBe(true);
        expect(isProviderBlockedError({ status: 429 })).toBe(true);
        expect(isProviderBlockedError(new Error('Request failed with status code 403'))).toBe(true);
        expect(isProviderBlockedError(new Error('HTTP 500'))).toBe(false);
    });

    it('serializes concurrent requests to the same provider', async () => {
        let active = 0;
        let maxActive = 0;
        __setRequestUrlMock(async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await new Promise(resolve => setTimeout(resolve, 5));
            active--;
            return { status: 200, json: { ok: true } };
        });

        await Promise.all([
            fetchJson('https://example.com/a'),
            fetchJson('https://example.com/b'),
            fetchJson('https://example.com/c'),
        ]);
        expect(maxActive).toBe(1);
    });

    it('recovers from a short network interruption with bounded retries', async () => {
        let calls = 0;
        __setRequestUrlMock(() => {
            calls++;
            if (calls === 1) throw new Error('Temporary network failure');
            return { status: 200, json: { ok: true } };
        });

        await expect(fetchJson('https://example.com/retry')).resolves.toEqual({ ok: true });
        expect(calls).toBe(2);
    });

    it.each([429, 503])('retries MangaUpdates HTTP %s after 2, 4, 8, and 16 seconds', async (status) => {
        vi.useFakeTimers();
        let calls = 0;
        __setRequestUrlMock(() => {
            calls++;
            return calls <= 4
                ? { status, json: { message: 'try later' } }
                : { status: 200, json: { ok: true } };
        });

        const request = fetchJson('https://api.mangaupdates.com/v1/series/512');
        await vi.advanceTimersByTimeAsync(0);
        for (const delay of [2_000, 4_000, 8_000, 16_000]) {
            await vi.advanceTimersByTimeAsync(delay);
        }

        await expect(request).resolves.toEqual({ ok: true });
        expect(calls).toBe(5);
    });

    it('spaces MangaUpdates requests by at least one second', async () => {
        vi.useFakeTimers();
        const starts: number[] = [];
        __setRequestUrlMock(() => {
            starts.push(Date.now());
            return { status: 200, json: { ok: true } };
        });

        await fetchJson('https://api.mangaupdates.com/v1/series/1');
        const second = fetchJson('https://api.mangaupdates.com/v1/series/2');
        await vi.advanceTimersByTimeAsync(999);
        expect(starts).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(1);
        await second;

        expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(1_000);
    });
});
