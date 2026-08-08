import { describe, expect, it } from 'vitest';
import { mapInFrameBatches } from '../src/services/media/serviceUtils';

describe('mapInFrameBatches', () => {
    it('preserves order and filters null results across batches', async () => {
        const result = await mapInFrameBatches(
            [1, 2, 3, 4, 5],
            (value) => value % 2 === 0 ? value * 10 : null,
            2
        );

        expect(result).toEqual([20, 40]);
    });
});
