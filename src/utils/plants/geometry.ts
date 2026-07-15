import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PlantType } from '../../types/scene';

/**
 * Shared unit-size geometry and material per plant type. Plant size is
 * applied per instance (via the instance matrix), so these are built once
 * and reused across every regeneration instead of being rebuilt and
 * re-uploaded to the GPU each time.
 */

export const PLANT_COLORS: Record<PlantType, number> = {
	[PlantType.BUSH]: 0x3a5f1e,
	[PlantType.BALE]: 0xf4d03f,
	[PlantType.CYPRESS]: 0x4a6f2e,
};

function createUnitGeometry(type: PlantType): THREE.BufferGeometry {
	switch (type) {
		case PlantType.BUSH:
			return new THREE.SphereGeometry(1.5, 10, 8);
		case PlantType.BALE: {
			// A cylinder rotated to lay on its side.
			const bale = new THREE.CylinderGeometry(1, 1, 2, 8);
			bale.rotateZ(Math.PI / 2);
			return bale;
		}
		case PlantType.CYPRESS: {
			// A hemisphere base with a tall cone on top.
			const hemisphere = new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
			const cone = new THREE.ConeGeometry(1.2, 7, 12);
			cone.translate(0, 3.5, 0);
			return mergeGeometries([hemisphere, cone]);
		}
	}
}

const geometryCache = new Map<PlantType, THREE.BufferGeometry>();
const materialCache = new Map<PlantType, THREE.Material>();

export function getPlantGeometry(type: PlantType): THREE.BufferGeometry {
	let geometry = geometryCache.get(type);
	if (!geometry) {
		geometry = createUnitGeometry(type);
		geometryCache.set(type, geometry);
	}
	return geometry;
}

export function getPlantMaterial(type: PlantType): THREE.Material {
	let material = materialCache.get(type);
	if (!material) {
		// White base color: the actual plant color is set per instance so
		// individual plants can vary in tone (see instancing.ts).
		material = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
		materialCache.set(type, material);
	}
	return material;
}
