import { describe, expect, it } from 'vitest';
import { ScrollManager } from '../src/views/library/ScrollManager';

function createScrollContainer(): HTMLElement {
    return {
        scrollTop: 90,
        scrollHeight: 500,
        clientHeight: 200,
        querySelectorAll: () => [],
        getBoundingClientRect: () => ({ top: 0, bottom: 200 }),
    } as unknown as HTMLElement;
}

describe('ScrollManager', () => {
    it('restores the exact scroll position without following a reordered card', () => {
        const container = createScrollContainer();
        const manager = new ScrollManager(() => container, () => false);

        manager.apply('position', {
            scrollTop: 120,
            filePath: 'Anime/Changed.md',
            offsetTop: 20,
        });

        expect(container.scrollTop).toBe(120);
    });

    it('clamps an exact position to the available scroll range', () => {
        const container = createScrollContainer();
        const manager = new ScrollManager(() => container, () => false);

        manager.apply('position', {
            scrollTop: 900,
            filePath: null,
            offsetTop: null,
        });

        expect(container.scrollTop).toBe(300);
    });
});
