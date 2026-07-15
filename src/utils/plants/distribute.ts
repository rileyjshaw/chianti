import { PlantType } from '../../types/scene';
import type { Rng } from '../random';
import { getCellForPosition, type VoronoiSystem } from '../voronoi';
import type { PlantTransform } from './instancing';

/**
 * Walks the grid and decides, per position, whether a plant grows there and
 * what it looks like. Returns transforms grouped by plant type so each type
 * renders as a single InstancedMesh.
 */
export function generatePlantTransforms(
	heightmap: Float32Array,
	gridWidth: number,
	gridHeight: number,
	voronoi: VoronoiSystem,
	plantSize: number,
	plantSpacing: number,
	heightScale: number,
	rng: Rng
): Map<PlantType, PlantTransform[]> {
	const groups = new Map<PlantType, PlantTransform[]>();

	// Skip the top and left edges: the terrain mesh is offset by half a cell,
	// so plants there would float past its rim.
	for (let y = 1; y < gridHeight; y++) {
		for (let x = 1; x < gridWidth; x++) {
			const { plantType, placementMethod } = getCellForPosition(x, y, voronoi);
			if (!placementMethod(x, y, rng)) continue;

			const groundHeight = heightmap[y * gridWidth + x] * heightScale;

			// Bales are machine-made with uniform size and heading. Vegetation
			// gets both size and orientation variety.
			const jitter = plantType === PlantType.BALE ? 1 : 0.85 + rng() * 0.3;
			const scale = plantSize * jitter;
			// Always draw so fixed bale headings do not alter the transforms
			// generated for subsequent vegetation.
			const rotationY = rng() * Math.PI * 2;

			// Bales rest on their (unit-radius) side; bushes and cypresses sit
			// slightly sunken so they hug the slope.
			const yOffset = plantType === PlantType.BALE ? scale : scale / 2;

			let group = groups.get(plantType);
			if (!group) {
				group = [];
				groups.set(plantType, group);
			}
			group.push({
				x: (x - gridWidth / 2) * plantSpacing,
				y: groundHeight + yOffset,
				z: (y - gridHeight / 2) * plantSpacing,
				rotationY: plantType === PlantType.BALE ? 0 : rotationY,
				scale,
			});
		}
	}

	return groups;
}
