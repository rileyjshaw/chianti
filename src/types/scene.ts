import type { PlacementMethod } from '../utils/plants/placement';
import type { Rng } from '../utils/random';

export const PlantType = {
	BUSH: 'bush',
	BALE: 'bale',
	CYPRESS: 'cypress',
} as const;

export type PlantType = (typeof PlantType)[keyof typeof PlantType];

/** Everything that parameterizes scene generation. */
export interface SceneConfig {
	/** Heightmap resolution (cells per side). */
	gridSize: number;
	/** Number of Voronoi regions used for plant distribution. */
	voronoiCells: number;
	/** Base size of individual plants. */
	plantSize: number;
	/** Vertical scaling of the terrain. */
	heightScale: number;
	/** How strongly fBm noise roughens the hills (0-1). */
	roughness: number;
	/** World-space distance between grid cells. */
	plantSpacing: number;
	/** Number of large hills blended into the terrain. */
	numHills: number;
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
	gridSize: 400,
	voronoiCells: 64,
	plantSize: 0.5,
	heightScale: 25,
	roughness: 0.8,
	plantSpacing: 2,
	numHills: 3,
};

export const DEFAULT_MAX_HILL_RADIUS = 64;
export const SHOW_CONFIG_CONTROLS = false;

export interface HillSceneProps {
	config: SceneConfig;
	/** Bump to regenerate the whole scene deterministically. */
	seed: number;
	/** Picks a plant type from normalized terrain coordinates (all in [0, 1]). */
	getPlantType: (x: number, y: number, z: number, rng: Rng) => PlantType;
	/** Picks how a Voronoi region arranges plants of the given type. */
	getPlantPlacement: (plantType: PlantType, x: number, y: number, z: number, rng: Rng) => PlacementMethod;
}
