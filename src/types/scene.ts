import * as THREE from 'three';

// Default values for scene configuration
export const DEFAULT_GRID_SIZE = 400;
export const DEFAULT_NUM_VORONOI_CELLS = 64;
export const DEFAULT_PLANT_SIZE = 0.5;
export const DEFAULT_ROUGHNESS = 0.8;
export const DEFAULT_PLANT_SPACING = 2;
export const DEFAULT_MAX_HILL_RADIUS = 64;
export const DEFAULT_NUM_HILLS = 3;
export const DEFAULT_HEIGHT_SCALE = 25;
export const SHOW_CONFIG_CONTROLS = false;

export const PlantType = {
	BUSH: 'bush',
	BALE: 'bale',
	CYPRESS: 'cypress',
} as const;

export type PlantType = (typeof PlantType)[keyof typeof PlantType];

export interface PlantConfig {
	type: PlantType;
	geometry: THREE.BufferGeometry;
	material: THREE.Material;
}

export type PlacementMethod = (worldX: number, worldY: number) => boolean;

export interface HillSceneProps {
	gridWidth: number;
	gridHeight: number;
	numVoronoiCells: number;
	plantSize: number;
	roughness: number;
	plantSpacing: number;
	getPlantType: (x: number, y: number, z: number) => PlantType;
	getPlantPlacement: (plantType: PlantType, x: number, y: number, z: number) => PlacementMethod;
	heightScale: number;
}
