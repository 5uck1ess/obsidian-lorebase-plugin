import { describe, expect, it } from 'vitest';
import { getJikanDetails, getLegacyJikanMangaDetails, searchJikan } from '../src/services/integrations/providers/jikan';
import type { JsonFetcher } from '../src/services/integrations/providers/common';
import { IntegrationService } from '../src/services/IntegrationService';
import { DEFAULT_SETTINGS } from '../src/constants';
import { createMockApp } from './helpers/testHelpers';

describe('Jikan provider', () => {
    it('maps search results and pagination from MyAnimeList ids', async () => {
        let requestedUrl = '';
        const fetchJson: JsonFetcher = async (url) => {
            requestedUrl = url;
            return {
                data: [{
                    mal_id: 22199,
                    title: 'Akame ga Kill!',
                    title_english: 'Akame ga Kill!',
                    title_japanese: 'アカメが斬る！',
                    type: 'TV',
                    year: 2014,
                    images: {
                        jpg: {
                            image_url: 'https://cdn.example/akame.jpg',
                            large_image_url: 'https://cdn.example/akame-large.jpg',
                        },
                    },
                }],
                pagination: { has_next_page: true },
            };
        };

        const results = await searchJikan(fetchJson, 'Akame', { page: 2, pageSize: 12 });

        expect(requestedUrl).toContain('q=Akame');
        expect(requestedUrl).toContain('page=2');
        expect(requestedUrl).toContain('limit=12');
        expect(results[0]).toMatchObject({
            id: '22199',
            title: 'Akame ga Kill!',
            provider: 'jikan',
            image: 'https://cdn.example/akame-large.jpg',
            year: '2014',
        });
        expect((results as typeof results & { hasNext?: boolean }).hasNext).toBe(true);
    });

    it('falls back to Shikimori search while preserving MAL ids when Jikan returns 504', async () => {
        const requestedUrls: string[] = [];
        const fetchJson: JsonFetcher = async (url, _headers, method, body) => {
            requestedUrls.push(url);
            if (url.includes('api.jikan.moe')) {
                throw Object.assign(new Error('Jikan request failed (HTTP 504).'), { status: 504 });
            }
            expect(method).toBe('POST');
            expect(JSON.parse(String(body)).variables).toEqual({ search: 'Akame', limit: 10, page: 1 });
            return {
                data: {
                    animes: [{
                        id: '22199',
                        malId: '22199',
                        name: 'Akame ga Kill!',
                        russian: 'Убийца Акамэ!',
                        kind: 'tv',
                        airedOn: { year: 2014 },
                        poster: { originalUrl: '/uploads/poster/animes/22199/cover.jpeg' },
                    }],
                },
            };
        };

        const results = await searchJikan(fetchJson, 'Akame');

        expect(requestedUrls).toEqual([
            expect.stringContaining('api.jikan.moe/v4/anime'),
            'https://shikimori.net/api/graphql',
        ]);
        expect(results[0]).toMatchObject({
            id: '22199',
            title: 'Akame ga Kill!',
            subtitle: 'Убийца Акамэ!',
            provider: 'jikan',
            image: 'https://shikimori.net/uploads/poster/animes/22199/cover.jpeg',
            year: '2014',
        });
    });

    it('maps full anime metadata, MAL rating, and root progress part', async () => {
        const fetchJson: JsonFetcher = async () => ({
            data: {
                mal_id: 22199,
                url: 'https://myanimelist.net/anime/22199/Akame_ga_Kill',
                title: 'Akame ga Kill!',
                title_english: 'Akame ga Kill!',
                synopsis: 'Night Raid fights <b>the Empire</b>.',
                type: 'TV',
                episodes: 24,
                year: 2014,
                score: 7.48,
                scored_by: 1418777,
                images: { webp: { large_image_url: 'https://cdn.example/akame.webp' } },
                studios: [{ name: 'White Fox' }],
                genres: [{ name: 'Action' }, { name: 'Fantasy' }],
                explicit_genres: [],
                themes: [{ name: 'Gore' }],
                demographics: [{ name: 'Shounen' }],
            },
        });

        const details = await getJikanDetails(fetchJson, '22199');

        expect(details).toMatchObject({
            kind: 'anime',
            name: 'Akame ga Kill!',
            description: 'Night Raid fights the Empire.',
            image: 'https://cdn.example/akame.webp',
            tags: ['Action', 'Fantasy', 'Gore', 'Shounen'],
            studios: ['White Fox'],
            year: '2014',
            communityRating: '7.48',
            communityVotes: '1418777',
            url: 'https://myanimelist.net/anime/22199/Akame_ga_Kill',
        });
        expect(details?.parts).toEqual([{
            id: 'jikan-22199',
            kind: 'tv',
            title: 'Akame ga Kill!',
            seasonNumber: 1,
            episodeCurrent: 0,
            episodeTotal: 24,
            status: 'planned',
        }]);
    });

    it('keeps legacy manga notes refreshable by their original MAL id', async () => {
        let requestedUrl = '';
        const fetchJson: JsonFetcher = async (url) => {
            requestedUrl = url;
            return {
                data: {
                    mal_id: 2,
                    url: 'https://myanimelist.net/manga/2/Berserk',
                    title: 'Berserk',
                    synopsis: 'A <b>dark fantasy</b> manga.',
                    published: { from: '1989-08-25T00:00:00+00:00' },
                    chapters: 380,
                    volumes: 42,
                    score: 9.47,
                    scored_by: 410000,
                    images: { jpg: { large_image_url: 'https://cdn.example/berserk.jpg' } },
                    authors: [{ name: 'Kentaro Miura', type: 'Story & Art' }],
                    genres: [{ name: 'Action' }, { name: 'Adventure' }],
                    explicit_genres: [],
                    themes: [{ name: 'Gore' }],
                    demographics: [{ name: 'Seinen' }],
                },
            };
        };

        const details = await getLegacyJikanMangaDetails(fetchJson, '2');

        expect(requestedUrl).toBe('https://api.jikan.moe/v4/manga/2');
        expect(details).toMatchObject({
            kind: 'manga',
            name: 'Berserk',
            description: 'A dark fantasy manga.',
            authors: ['Kentaro Miura'],
            artists: ['Kentaro Miura'],
            genres: ['Action', 'Adventure', 'Gore', 'Seinen'],
            year: '1989',
            chapters: '380',
            volumes: '42',
            communityRating: '9.47',
            communityVotes: '410000',
        });
        expect(details?.parts).toHaveLength(42);
        expect(details?.parts?.[0]).toMatchObject({
            id: 'volume-1',
            volumeNumber: 1,
            chapterTotal: 10,
        });
    });

    it('routes an existing manga Jikan source through the legacy details adapter', async () => {
        const service = new IntegrationService(createMockApp({}), () => structuredClone(DEFAULT_SETTINGS));
        let requestedUrl = '';
        (service as unknown as { jsonFetcher: JsonFetcher }).jsonFetcher = async (url) => {
            requestedUrl = url;
            return {
                data: {
                    mal_id: 2,
                    title: 'Berserk',
                    chapters: 380,
                    volumes: 42,
                    score: 9.47,
                    images: { jpg: { large_image_url: 'https://cdn.example/berserk.jpg' } },
                    authors: [{ name: 'Kentaro Miura', type: 'Story & Art' }],
                    genres: [{ name: 'Action' }],
                },
            };
        };

        const patch = await service.getMediaEnrichment('manga', {
            provider: 'jikan',
            id: '2',
            title: 'Berserk',
        });

        expect(requestedUrl).toBe('https://api.jikan.moe/v4/manga/2');
        expect(patch?.values).toMatchObject({
            integration_provider: 'jikan',
            integration_id: '2',
            name: 'Berserk',
            chapter_total: 10,
            volume_total: 42,
        });
    });
});
