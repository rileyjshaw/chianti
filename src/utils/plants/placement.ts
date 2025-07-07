export interface PlacementMethod {
	(worldX: number, worldY: number): boolean;
	name?: string;
}

// Simple placement methods
export const placementMethods = {
	placeEmpty: function placeEmpty(): boolean {
		return false;
	} as PlacementMethod,

	placeFull: function placeFull(): boolean {
		return true;
	} as PlacementMethod,

	placeRows: function placeRows(worldX: number, _worldY: number): boolean {
		return worldX % 2 === 0;
	} as PlacementMethod,

	placeColumns: function placeColumns(_worldX: number, worldY: number): boolean {
		return worldY % 2 === 0;
	} as PlacementMethod,

	placeCheckerboard: function placeCheckerboard(worldX: number, worldY: number): boolean {
		return (worldX + worldY) % 2 === 0;
	} as PlacementMethod,

	placeDiagonal: function placeDiagonal(worldX: number, worldY: number): boolean {
		return (worldX + worldY) % 3 === 0;
	} as PlacementMethod,

	placeDense: function placeDense(): boolean {
		return Math.random() < 0.8;
	} as PlacementMethod,

	placeRandom: function placeRandom(): boolean {
		return Math.random() < 0.5;
	} as PlacementMethod,

	placeSparse: function placeSparse(): boolean {
		return Math.random() < 0.2;
	} as PlacementMethod,
};

export function getRandomPlacementMethod(): PlacementMethod {
	const methods = Object.values(placementMethods);
	return methods[Math.floor(Math.random() * methods.length)];
}
