import * as THREE from 'three';

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
	scale: number;
}

export type PlacementMethod = (worldX: number, worldY: number) => boolean;

export interface HillSceneProps {
	gridX?: number;
	gridY?: number;
	cellX?: number;
	cellY?: number;
	plantSize?: number;
	roughness?: number;
	cellSpacing?: number;
	fogColor?: string;
	fogNear?: number;
	fogFar?: number;
	getPlantType?: (gridX: number, gridY: number) => PlantType;
	getPlantPlacement?: (gridX: number, gridY: number, plantType: PlantType) => PlacementMethod;
}

export interface SceneData {
	heightmap: Float32Array;
	plantPositions: Array<{
		position: THREE.Vector3;
		type: PlantType;
		placementMethod: string;
	}>;
}
