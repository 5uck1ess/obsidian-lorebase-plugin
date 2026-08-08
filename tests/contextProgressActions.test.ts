import { describe, expect, it } from 'vitest';
import { AnimeItem, MangaItem } from '../src/types';
import { incrementAnimeEpisode, incrementMangaChapter } from '../src/views/library/progressActions';

describe('context menu progress actions', () => {
    it('increments an anime episode with one action', () => {
        const anime = makeAnime({ episodeCurrent: 4, episodeTotal: 12 });

        const mutation = incrementAnimeEpisode(anime);

        expect(anime.episodeCurrent).toBe(5);
        expect(mutation.updates.episodeCurrent).toBe(5);
    });

    it('increments the active anime part and caps it at the known total', () => {
        const anime = makeAnime({
            episodeCurrent: 9,
            episodeTotal: 10,
            activePartId: 'season-1',
            parts: [{
                id: 'season-1',
                kind: 'tv',
                title: 'Season 1',
                seasonNumber: 1,
                episodeCurrent: 9,
                episodeTotal: 10,
                status: 'watching',
            }],
        });

        incrementAnimeEpisode(anime);
        incrementAnimeEpisode(anime);

        expect(anime.episodeCurrent).toBe(10);
        expect(anime.parts?.[0].episodeCurrent).toBe(10);
        expect(anime.status).toBe('completed');
    });

    it('increments a manga chapter with one action and never passes the total', () => {
        const manga = makeManga({ chapterCurrent: 5, chapterTotal: 6 });

        const first = incrementMangaChapter(manga);
        const second = incrementMangaChapter(manga);

        expect(first.updates.chapterCurrent).toBe(6);
        expect(second.updates.chapterCurrent).toBe(6);
        expect(manga.chapterCurrent).toBe(6);
        expect(manga.status).toBe('completed');
    });

    it('keeps context progress unrestricted when the total is unknown', () => {
        const anime = makeAnime({ episodeCurrent: 999, episodeTotal: null });
        const manga = makeManga({ chapterCurrent: 999, chapterTotal: null });

        incrementAnimeEpisode(anime);
        incrementMangaChapter(manga);

        expect(anime.episodeCurrent).toBe(1000);
        expect(manga.chapterCurrent).toBe(1000);
    });
});

function makeAnime(overrides: Partial<AnimeItem>): AnimeItem {
    return {
        type: 'anime',
        filePath: 'Anime/Test.md',
        displayName: 'Test anime',
        status: 'watching',
        format: 'tv',
        episodeCurrent: null,
        episodeTotal: null,
        seasonCurrent: null,
        seasonTotal: null,
        parts: [],
        activePartId: null,
        ...overrides,
    } as AnimeItem;
}

function makeManga(overrides: Partial<MangaItem>): MangaItem {
    return {
        type: 'manga',
        filePath: 'Manga/Test.md',
        displayName: 'Test manga',
        status: 'watching',
        chapterCurrent: null,
        chapterTotal: null,
        volumeCurrent: null,
        volumeTotal: null,
        parts: [],
        activePartId: null,
        ...overrides,
    } as MangaItem;
}
