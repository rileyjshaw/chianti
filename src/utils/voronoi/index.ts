import * as THREE from 'three';
import { PlantType } from '../../types/scene';
import type { PlacementMethod } from '../../types/scene';

export interface VoronoiCell {
	id: number;
	center: THREE.Vector2;
	plantType: PlantType;
	placementMethod: PlacementMethod;
}

export interface VoronoiSystem {
	cells: VoronoiCell[];
	width: number;
	height: number;
	// Spatial grid for efficient lookup
	grid: Map<string, VoronoiCell[]>;
	gridSize: number;
}

/**
 * Generate Voronoi cells with random centers distributed across the terrain
 */
export function generateVoronoiCells(
	width: number,
	height: number,
	numCells: number,
	getPlantType: (x: number, y: number, z: number) => PlantType,
	getPlacementMethod: (plantType: PlantType, x: number, y: number, z: number) => PlacementMethod,
	heightmap: Float32Array
): VoronoiSystem {
	const cells: VoronoiCell[] = [];

	// Generate random cell centers with some minimum distance
	const centers: THREE.Vector2[] = [];
	const minDistance = (Math.min(width, height) / Math.sqrt(numCells)) * 0.8; // 80% of theoretical minimum

	for (let i = 0; i < numCells; i++) {
		let attempts = 0;
		let center: THREE.Vector2;

		do {
			center = new THREE.Vector2(Math.random() * width, Math.random() * height);
			attempts++;
		} while (attempts < 100 && centers.some(existing => center.distanceTo(existing) < minDistance));

		centers.push(center);

		const iX = Math.round(center.x);
		const iZ = Math.round(center.y);
		// X, Y, Z are normalized coordinates in the range [0, 1].
		const x = center.x / width;
		const y = heightmap[iX + iZ * width];
		const z = center.y / height;

		const plantType = getPlantType(x, y, z);
		const placementMethod = getPlacementMethod(plantType, x, y, z);

		cells.push({
			id: i,
			center,
			plantType,
			placementMethod,
		});
	}

	// Build spatial grid for efficient lookup
	const gridSize = Math.max(minDistance * 2, 50); // Grid size based on minimum cell distance
	const grid = buildSpatialGrid(cells, width, height, gridSize);

	return {
		cells,
		width,
		height,
		grid,
		gridSize,
	};
}

/**
 * Build a spatial grid to accelerate cell lookups
 */
function buildSpatialGrid(
	cells: VoronoiCell[],
	width: number,
	height: number,
	gridSize: number
): Map<string, VoronoiCell[]> {
	const grid = new Map<string, VoronoiCell[]>();

	// For each cell, add it to all grid cells it could influence
	for (const cell of cells) {
		// Calculate the range of grid cells this cell could influence
		// We need to check a bit beyond the cell's center to account for Voronoi boundaries
		const influenceRadius = gridSize * 1.5;
		const minX = Math.max(0, Math.floor((cell.center.x - influenceRadius) / gridSize));
		const maxX = Math.min(Math.floor(width / gridSize), Math.floor((cell.center.x + influenceRadius) / gridSize));
		const minY = Math.max(0, Math.floor((cell.center.y - influenceRadius) / gridSize));
		const maxY = Math.min(Math.floor(height / gridSize), Math.floor((cell.center.y + influenceRadius) / gridSize));

		for (let gx = minX; gx <= maxX; gx++) {
			for (let gy = minY; gy <= maxY; gy++) {
				const key = `${gx},${gy}`;
				if (!grid.has(key)) {
					grid.set(key, []);
				}
				grid.get(key)!.push(cell);
			}
		}
	}

	return grid;
}

/**
 * Find which Voronoi cell a point belongs to using spatial grid optimization
 */
function findCellForPoint(point: THREE.Vector2, voronoiSystem: VoronoiSystem): VoronoiCell | null {
	if (voronoiSystem.cells.length === 0) return null;

	// Find the grid cell containing this point
	const gridWidth = Math.floor(point.x / voronoiSystem.gridSize);
	const gridHeight = Math.floor(point.y / voronoiSystem.gridSize);
	const key = `${gridWidth},${gridHeight}`;

	// Get cells in this grid cell and neighboring cells
	const candidates: VoronoiCell[] = [];

	// Check current grid cell and 8 neighbors (3x3 grid)
	for (let dx = -1; dx <= 1; dx++) {
		for (let dy = -1; dy <= 1; dy++) {
			const neighborKey = `${gridWidth + dx},${gridHeight + dy}`;
			const neighborCells = voronoiSystem.grid.get(neighborKey);
			if (neighborCells) {
				candidates.push(...neighborCells);
			}
		}
	}

	// Remove duplicates (cells can be in multiple grid cells)
	const uniqueCandidates = candidates.filter((cell, index) => candidates.findIndex(c => c.id === cell.id) === index);

	// Find closest among candidates
	if (uniqueCandidates.length === 0) {
		// Fallback to checking all cells if no candidates found
		return findCellForPointFallback(point, voronoiSystem);
	}

	let closestCell = uniqueCandidates[0];
	let closestDistance = point.distanceTo(closestCell.center);

	for (let i = 1; i < uniqueCandidates.length; i++) {
		const cell = uniqueCandidates[i];
		const distance = point.distanceTo(cell.center);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestCell = cell;
		}
	}

	return closestCell;
}

/**
 * Fallback method that checks all cells (used if spatial grid fails)
 */
function findCellForPointFallback(point: THREE.Vector2, voronoiSystem: VoronoiSystem): VoronoiCell | null {
	let closestCell = voronoiSystem.cells[0];
	let closestDistance = point.distanceTo(closestCell.center);

	for (let i = 1; i < voronoiSystem.cells.length; i++) {
		const cell = voronoiSystem.cells[i];
		const distance = point.distanceTo(cell.center);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestCell = cell;
		}
	}

	return closestCell;
}

/**
 * Get plant type and placement method for a world position
 */
export function getPlantDataForPosition(
	x: number,
	y: number,
	voronoiSystem: VoronoiSystem
): { plantType: PlantType; placementMethod: PlacementMethod } | null {
	const point = new THREE.Vector2(x, y);
	const cell = findCellForPoint(point, voronoiSystem);

	if (!cell) return null;

	return {
		plantType: cell.plantType,
		placementMethod: cell.placementMethod,
	};
}
