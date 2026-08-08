import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __setRequestUrlMock } from './mocks/obsidian';
import {
    buildIntegrationDiagnosticReport,
    clearIntegrationDiagnostics,
    getIntegrationDiagnostics,
    recordIntegrationDiagnostic,
    sanitizeDiagnosticEndpoint,
} from '../src/services/integrations/diagnostics';
import {
    fetchJson,
    getActiveIntegrationCooldowns,
    imageUrlExists,
    resetIntegrationRequestStateForTests,
} from '../src/services/integrations/shared';

describe('integration diagnostics', () => {
    beforeEach(() => {
        resetIntegrationRequestStateForTests();
    });

    afterEach(() => {
        __setRequestUrlMock(null);
        resetIntegrationRequestStateForTests();
    });

    it('removes query parameters and identifiers from recorded endpoints', () => {
        const endpoint = sanitizeDiagnosticEndpoint(
            'https://api.rawg.io/api/games/12345?key=secret-key&search=private-query'
        );

        expect(endpoint).toBe('/api/games/:id');
        expect(endpoint).not.toContain('secret-key');
        expect(endpoint).not.toContain('private-query');
        expect(sanitizeDiagnosticEndpoint('https://example.com/search/akame-ga-kill')).toBe('/search/:value');
    });

    it('keeps only the latest 2,000 events', () => {
        for (let index = 0; index < 2_005; index++) {
            recordIntegrationDiagnostic({
                timestamp: index,
                url: `https://example.com/items/${index}`,
                origin: 'https://example.com',
                method: 'GET',
                status: 200,
                outcome: 'success',
                durationMs: index,
                attempt: 1,
            });
        }

        const events = getIntegrationDiagnostics();
        expect(events).toHaveLength(2_000);
        expect(events[0].timestamp).toBe(5);
        expect(events.at(-1)?.timestamp).toBe(2_004);
    });

    it('creates a safe copyable report without request secrets', () => {
        recordIntegrationDiagnostic({
            url: 'https://api.example.com/search?api_key=top-secret&query=dune',
            origin: 'https://api.example.com',
            method: 'GET',
            status: 429,
            outcome: 'blocked',
            durationMs: 42,
            attempt: 1,
        });

        const report = buildIntegrationDiagnosticReport([], Date.UTC(2026, 0, 1));
        expect(report).toContain('GET /search');
        expect(report).toContain('HTTP 429');
        expect(report).not.toContain('top-secret');
        expect(report).not.toContain('query=dune');
    });

    it('builds a report from the filtered events shown in diagnostics', () => {
        recordIntegrationDiagnostic({
            url: 'https://api.rawg.io/api/games/1',
            origin: 'https://api.rawg.io',
            method: 'GET',
            status: 200,
            outcome: 'success',
            durationMs: 20,
            attempt: 1,
        });
        recordIntegrationDiagnostic({
            url: 'https://api.mangaupdates.com/v1/series/2',
            origin: 'https://api.mangaupdates.com',
            method: 'GET',
            status: 503,
            outcome: 'error',
            durationMs: 40,
            attempt: 1,
        });

        const failures = getIntegrationDiagnostics()
            .filter((event) => event.outcome === 'error' || event.outcome === 'blocked' || event.outcome === 'retry');
        const report = buildIntegrationDiagnosticReport([], Date.UTC(2026, 0, 1), failures);

        expect(report).toContain('Events: 1');
        expect(report).toContain('MangaUpdates');
        expect(report).not.toContain('RAWG');
        expect(report).not.toContain('success');
    });

    it('records real network success and local circuit rejections', async () => {
        let status = 200;
        __setRequestUrlMock(() => ({ status, json: { ok: true } }));

        await expect(fetchJson('https://api.mangaupdates.com/v1/series/1?token=hidden')).resolves.toEqual({ ok: true });
        status = 429;
        await expect(fetchJson('https://store.steampowered.com/api/appdetails?appids=10')).rejects.toMatchObject({ status: 429 });
        await expect(fetchJson('https://store.steampowered.com/search/results/?term=portal')).rejects.toMatchObject({ status: 429 });

        const events = getIntegrationDiagnostics();
        expect(events.map((event) => event.outcome)).toEqual(['success', 'blocked', 'blocked']);
        expect(events[2].source).toBe('circuit');
        expect(events.every((event) => !event.endpoint.includes('hidden'))).toBe(true);
        expect(getActiveIntegrationCooldowns()).toHaveLength(1);

        clearIntegrationDiagnostics();
        expect(getIntegrationDiagnostics()).toEqual([]);
        expect(getActiveIntegrationCooldowns()).toHaveLength(1);
    });

    it('records identifiable Steam Sync item failures without request secrets', () => {
        recordIntegrationDiagnostic({
            url: 'https://store.steampowered.com/app/620/?token=hidden',
            origin: 'https://store.steampowered.com',
            method: 'GET',
            status: 0,
            outcome: 'error',
            durationMs: 75,
            attempt: 1,
            kind: 'process',
            operation: 'Steam Sync',
            itemLabel: 'Portal 2',
            itemId: '620',
            detail: 'Network request failed https://store.example.com/app/620?token=very-secret',
        });

        const event = getIntegrationDiagnostics()[0];
        expect(event).toMatchObject({
            provider: 'Steam',
            kind: 'process',
            itemLabel: 'Portal 2',
            itemId: '620',
        });
        const report = buildIntegrationDiagnosticReport();
        expect(report).toContain('Portal 2 (620)');
        expect(report).toContain('Network request failed');
        expect(report).not.toContain('hidden');
        expect(report).not.toContain('very-secret');
    });

    it('does not report expected missing Steam image probes as errors', async () => {
        __setRequestUrlMock(() => ({ status: 404 }));

        await expect(imageUrlExists('https://cdn.example.com/steam/apps/620/cover.jpg')).resolves.toBe(false);
        expect(getIntegrationDiagnostics()).toEqual([]);
    });
});
