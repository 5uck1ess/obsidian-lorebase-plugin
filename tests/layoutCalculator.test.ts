import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '../src/constants';
import { LayoutCalculator } from '../src/views/library/LayoutCalculator';

describe('LayoutCalculator', () => {
    it('adapts horizontal columns to the available pane width', () => {
        const calculator = new LayoutCalculator(() => 1100);
        const layout = calculator.getEffectiveLayout(DEFAULT_SETTINGS.games, 'horizontal');

        expect(layout.minCardWidth).toBe(340);
        expect(calculator.getRenderedColumns(layout)).toBe(3);
    });

    it('keeps horizontal cards from overflowing narrow panes', () => {
        const calculator = new LayoutCalculator(() => 760);
        const layout = calculator.getEffectiveLayout(DEFAULT_SETTINGS.games, 'horizontal');

        expect(calculator.getRenderedColumns(layout)).toBe(2);
    });

    it('renders a compact two-column poster grid on phones', () => {
        const calculator = new LayoutCalculator(() => 390);
        const layout = calculator.getEffectiveLayout(DEFAULT_SETTINGS.games, 'grid');

        expect(layout.minCardWidth).toBe(136);
        expect(calculator.getRenderedColumns(layout)).toBe(2);
    });

    it('does not preserve the desktop card height on phones', () => {
        const calculator = new LayoutCalculator(() => 390);
        const layout = calculator.getEffectiveLayout(DEFAULT_SETTINGS.games, 'grid');
        const grid = { clientWidth: 390 } as HTMLElement;

        expect(calculator.calculateActualCardHeight(layout, 2, grid)).toBeLessThan(320);
    });
});
