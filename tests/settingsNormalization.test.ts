import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/constants';
import { migrateLegacyJikanMangaSettings } from '../src/settings/settingsNormalization';

describe('settings migrations', () => {
    it('migrates the removed Jikan manga default once and records the version', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.integrations!.media.manga.provider = 'jikan';
        settings.integrations!.providers.jikan.enabled = true;
        const savedIntegrations = structuredClone(settings.integrations!);
        delete (savedIntegrations.providers as Partial<typeof savedIntegrations.providers>).mangaupdates;

        expect(migrateLegacyJikanMangaSettings(settings, savedIntegrations)).toBe(true);
        expect(settings.integrations?.media.manga.provider).toBe('mangaupdates');
        expect(settings.integrations?.providers.mangaupdates.enabled).toBe(true);
        expect(settings.migrations?.jikanMangaProviderV1).toBe(true);

        settings.integrations!.providers.jikan.enabled = false;
        expect(migrateLegacyJikanMangaSettings(settings, savedIntegrations)).toBe(false);
        expect(settings.integrations?.providers.mangaupdates.enabled).toBe(true);
    });
});
