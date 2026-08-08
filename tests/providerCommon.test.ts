import { describe, expect, it } from 'vitest';
import { pickAnimeTitle } from '../src/services/integrations/providers/common';

describe('integration provider title selection', () => {
    it('prefers the English AniList title over userPreferred romaji', () => {
        expect(pickAnimeTitle({
            userPreferred: 'Ore dake Level Up na Ken',
            romaji: 'Ore dake Level Up na Ken',
            english: 'Solo Leveling',
            native: '나 혼자만 레벨업',
        })).toBe('Solo Leveling');
    });

    it('falls back when an English title is unavailable', () => {
        expect(pickAnimeTitle({
            userPreferred: 'Sousou no Frieren',
            romaji: 'Sousou no Frieren',
            native: '葬送のフリーレン',
        })).toBe('Sousou no Frieren');
    });
});
