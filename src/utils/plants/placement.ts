import type { PlacementMethod } from '../../types/scene';

export const placementMethods: Record<string, PlacementMethod> = {
	placeEmpty: () => false,
	placeDense: () => true,
	placeRows: (_x: number, y: number) => y % 2 === 0,
	placeColumns: (x: number, _y: number) => x % 2 === 0,
	placeDiagonal: (x: number, y: number) => (x - y) % 4 === 0,
	placeBackDiagonal: (x: number, y: number) => (x + y) % 4 === 0,
	placeGrid: (x: number, y: number) => x % 2 === 0 && y % 2 === 0,
	placeCheckerboard: (x: number, y: number) => (x + y) % 2 === 0,
	placeRandom: (_x: number, _y: number) => Math.random() > 0.5,
	placeSparse: (_x: number, _y: number) => Math.random() > 0.8,
};

export function getRandomPlacementMethod(): PlacementMethod {
	const methodNames = Object.keys(placementMethods);
	const randomMethod = methodNames[Math.floor(Math.random() * methodNames.length)];
	return placementMethods[randomMethod];
}
