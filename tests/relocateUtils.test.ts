import { describe, expect, it } from 'vitest';
import { relocatedPath, uniqueVaultPath } from '../src/services/relocateUtils';

describe('relocatedPath', () => {
    it('moves a flat note and preserves nested relative paths', () => {
        expect(relocatedPath('Anime/BLEACH.md', 'Anime', 'Entertainment/Anime'))
            .toBe('Entertainment/Anime/BLEACH.md');
        expect(relocatedPath('Anime/sub/Naruto.md', 'Anime', 'Media'))
            .toBe('Media/sub/Naruto.md');
    });

    it('supports moves to and from the vault root', () => {
        expect(relocatedPath('Games/Halo.md', 'Games', '')).toBe('Halo.md');
        expect(relocatedPath('Halo.md', '', 'Games')).toBe('Games/Halo.md');
    });
});

describe('uniqueVaultPath', () => {
    it('returns the desired path when it is free', () => {
        expect(uniqueVaultPath('A/X.md', () => false)).toBe('A/X.md');
    });

    it('increments a numeric suffix until a path is free', () => {
        const taken = new Set(['A/X.md', 'A/X 2.md']);
        expect(uniqueVaultPath('A/X.md', (path) => taken.has(path))).toBe('A/X 3.md');
    });
});
