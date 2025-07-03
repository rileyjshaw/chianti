import { PlantType } from '../../types/scene';

export interface PlacementMethod {
	(worldX: number, worldY: number): boolean;
	name?: string;
}

// Cache for placement decisions to avoid redundant calculations
const placementCache = new Map<string, boolean>();

function getCacheKey(worldX: number, worldY: number, methodName: string): string {
	return `${worldX},${worldY},${methodName}`;
}

function getCachedPlacement(worldX: number, worldY: number, method: PlacementMethod): boolean {
	const methodName = method.name || 'unknown';
	const cacheKey = getCacheKey(worldX, worldY, methodName);

	if (placementCache.has(cacheKey)) {
		return placementCache.get(cacheKey)!;
	}

	const result = method(worldX, worldY);
	placementCache.set(cacheKey, result);
	return result;
}

// Clear cache when parameters change
export function clearPlacementCache(): void {
	placementCache.clear();
}

// Optimized placement methods with caching
export const placementMethods = {
	placeRows: function placeRows(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => x % 2 === 0);
	} as PlacementMethod,

	placeColumns: function placeColumns(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => y % 2 === 0);
	} as PlacementMethod,

	placeCheckerboard: function placeCheckerboard(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => (x + y) % 2 === 0);
	} as PlacementMethod,

	placeDiagonal: function placeDiagonal(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => (x + y) % 3 === 0);
	} as PlacementMethod,

	placeSparse: function placeSparse(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => (x + y) % 4 === 0);
	} as PlacementMethod,

	placeDense: function placeDense(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => Math.random() < 0.8);
	} as PlacementMethod,

	placeRandom: function placeRandom(worldX: number, worldY: number): boolean {
		return getCachedPlacement(worldX, worldY, (x, y) => Math.random() < 0.5);
	} as PlacementMethod,
};

export function getRandomPlacementMethod(): PlacementMethod {
	const methods = Object.values(placementMethods);
	return methods[Math.floor(Math.random() * methods.length)];
}
