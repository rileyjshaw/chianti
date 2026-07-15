import { PlantType } from '../../types/scene';
import type { PlacementMethod } from '../plants/placement';
import type { Rng } from '../random';
import { randomRange } from '../random';

export interface VoronoiCell {
	plantType: PlantType;
	placementMethod: PlacementMethod;
}

export interface VoronoiSystem {
	cells: VoronoiCell[];
	/** Index into `cells` for every grid position (y * width + x). */
	cellIndices: Uint16Array;
	width: number;
	height: number;
}

/**
 * Partitions the grid into Voronoi regions around randomly scattered seed
 * points, and assigns each region a plant type + placement method.
 *
 * The full assignment map is precomputed once with a bucketed
 * nearest-neighbor search, so per-position lookups during plant placement
 * are a single array read.
 */
export function generateVoronoiCells(
	width: number,
	height: number,
	numCells: number,
	getPlantType: (x: number, y: number, z: number, rng: Rng) => PlantType,
	getPlacementMethod: (plantType: PlantType, x: number, y: number, z: number, rng: Rng) => PlacementMethod,
	heightmap: Float32Array,
	rng: Rng
): VoronoiSystem {
	// Scatter seed points, rejecting ones that crowd existing seeds.
	const centersX = new Float32Array(numCells);
	const centersY = new Float32Array(numCells);
	const minDistance = (Math.min(width, height) / Math.sqrt(numCells)) * 0.8;
	const minDistanceSq = minDistance * minDistance;

	for (let i = 0; i < numCells; i++) {
		let x = 0;
		let y = 0;
		for (let attempts = 0; attempts < 100; attempts++) {
			x = randomRange(rng, 0, width);
			y = randomRange(rng, 0, height);
			let crowded = false;
			for (let j = 0; j < i; j++) {
				const dx = x - centersX[j];
				const dy = y - centersY[j];
				if (dx * dx + dy * dy < minDistanceSq) {
					crowded = true;
					break;
				}
			}
			if (!crowded) break;
		}
		centersX[i] = x;
		centersY[i] = y;
	}

	const cells: VoronoiCell[] = [];
	for (let i = 0; i < numCells; i++) {
		// Normalized [0, 1] coordinates: x/z across the terrain, y = elevation.
		const nx = centersX[i] / width;
		const nz = centersY[i] / height;
		const ix = Math.min(width - 1, Math.round(centersX[i]));
		const iz = Math.min(height - 1, Math.round(centersY[i]));
		const ny = heightmap[iz * width + ix];

		const plantType = getPlantType(nx, ny, nz, rng);
		cells.push({ plantType, placementMethod: getPlacementMethod(plantType, nx, ny, nz, rng) });
	}

	return {
		cells,
		cellIndices: assignNearestCells(width, height, centersX, centersY),
		width,
		height,
	};
}

/**
 * For every grid position, finds the index of the nearest seed point.
 * Seeds are bucketed into a coarse grid; each query scans outward in rings
 * of buckets and stops as soon as no closer seed can exist.
 */
function assignNearestCells(width: number, height: number, centersX: Float32Array, centersY: Float32Array): Uint16Array {
	const numCells = centersX.length;
	const assignment = new Uint16Array(width * height);
	if (numCells === 0) return assignment;

	// Bucket size ≈ expected seed spacing, so most queries touch ring 0-1.
	const bucketSize = Math.max(1, Math.round(Math.min(width, height) / Math.sqrt(numCells)));
	const bucketsX = Math.ceil(width / bucketSize);
	const bucketsY = Math.ceil(height / bucketSize);
	const maxRing = Math.max(bucketsX, bucketsY);

	const buckets: number[][] = Array.from({ length: bucketsX * bucketsY }, () => []);
	for (let i = 0; i < numCells; i++) {
		const bx = Math.min(bucketsX - 1, Math.floor(centersX[i] / bucketSize));
		const by = Math.min(bucketsY - 1, Math.floor(centersY[i] / bucketSize));
		buckets[by * bucketsX + bx].push(i);
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const bx = Math.min(bucketsX - 1, Math.floor(x / bucketSize));
			const by = Math.min(bucketsY - 1, Math.floor(y / bucketSize));

			let best = -1;
			let bestDistSq = Infinity;

			for (let ring = 0; ring <= maxRing; ring++) {
				// Any seed in ring r+1 is at least r * bucketSize away, so once
				// the current best beats that bound we can stop expanding.
				if (best !== -1) {
					const bound = (ring - 1) * bucketSize;
					if (bound > 0 && bound * bound > bestDistSq) break;
				}

				const minBX = Math.max(0, bx - ring);
				const maxBX = Math.min(bucketsX - 1, bx + ring);
				const minBY = Math.max(0, by - ring);
				const maxBY = Math.min(bucketsY - 1, by + ring);

				for (let gy = minBY; gy <= maxBY; gy++) {
					for (let gx = minBX; gx <= maxBX; gx++) {
						// Only scan the ring perimeter; inner buckets are done.
						if (ring > 0 && gx !== minBX && gx !== maxBX && gy !== minBY && gy !== maxBY) continue;

						for (const i of buckets[gy * bucketsX + gx]) {
							const dx = x - centersX[i];
							const dy = y - centersY[i];
							const distSq = dx * dx + dy * dy;
							if (distSq < bestDistSq) {
								bestDistSq = distSq;
								best = i;
							}
						}
					}
				}
			}

			assignment[y * width + x] = best;
		}
	}

	return assignment;
}

/** Returns the Voronoi cell governing a grid position. */
export function getCellForPosition(x: number, y: number, system: VoronoiSystem): VoronoiCell {
	return system.cells[system.cellIndices[y * system.width + x]];
}
