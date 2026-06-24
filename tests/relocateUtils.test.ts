import { describe, it, expect } from 'vitest';
import { relocatedPath, uniqueVaultPath } from '../src/services/relocateUtils';

describe('relocatedPath', () => {
    it('moves a flat note into the new folder', () => {
        expect(relocatedPath('Anime/BLEACH.md', 'Anime', 'Entertainment/Anime'))
            .toBe('Entertainment/Anime/BLEACH.md');
    });

    it('preserves a nested subpath under the new folder', () => {
        expect(relocatedPath('Anime/sub/Naruto.md', 'Anime', 'Media'))
            .toBe('Media/sub/Naruto.md');
    });

    it('supports moving from a folder to vault root', () => {
        expect(relocatedPath('Games/Halo.md', 'Games', '')).toBe('Halo.md');
    });

    it('supports moving from vault root into a folder', () => {
        expect(relocatedPath('Halo.md', '', 'Games')).toBe('Games/Halo.md');
    });
});

describe('uniqueVaultPath', () => {
    it('returns the desired path when nothing exists there', () => {
        expect(uniqueVaultPath('A/X.md', () => false)).toBe('A/X.md');
    });

    it('appends " 2" when the desired path is taken', () => {
        expect(uniqueVaultPath('A/X.md', (p) => p === 'A/X.md')).toBe('A/X 2.md');
    });

    it('increments the suffix until a free path is found', () => {
        const taken = new Set(['A/X.md', 'A/X 2.md']);
        expect(uniqueVaultPath('A/X.md', (p) => taken.has(p))).toBe('A/X 3.md');
    });
});
