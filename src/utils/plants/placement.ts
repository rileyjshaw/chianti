import type { Rng } from '../random';

/**
 * Decides whether a plant should be placed at a grid position. Stochastic
 * methods draw from the provided rng so placement is reproducible.
 */
export type PlacementMethod = (gridX: number, gridY: number, rng: Rng) => boolean;

export const placementMethods = {
	empty: () => false,
	full: () => true,
	rows: (gridX: number) => gridX % 2 === 0,
	columns: (_gridX: number, gridY: number) => gridY % 2 === 0,
	checkerboard: (gridX: number, gridY: number) => (gridX + gridY) % 2 === 0,
	diagonal: (gridX: number, gridY: number) => (gridX + gridY) % 3 === 0,
	dense: (_gridX: number, _gridY: number, rng: Rng) => rng() < 0.8,
	random: (_gridX: number, _gridY: number, rng: Rng) => rng() < 0.5,
	sparse: (_gridX: number, _gridY: number, rng: Rng) => rng() < 0.2,
} satisfies Record<string, PlacementMethod>;

const allMethods = Object.values(placementMethods);

export function getRandomPlacementMethod(rng: Rng): PlacementMethod {
	return allMethods[Math.floor(rng() * allMethods.length)];
}
