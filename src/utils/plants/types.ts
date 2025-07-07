import * as THREE from 'three';
import { PlantType } from '../../types/scene';
import type { PlantConfig } from '../../types/scene';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createPlantConfig(type: PlantType, size: number = 1): PlantConfig {
	let geometry: THREE.BufferGeometry;

	switch (type) {
		case PlantType.BUSH:
			// Make bushes bigger and darker with slightly more segments
			geometry = new THREE.SphereGeometry(size * 1.5, 8, 6); // Increased from 6,4 to 8,6
			break;
		case PlantType.BALE:
			// Create a cylinder and rotate it 90 degrees to lay on its side with slightly more segments
			geometry = new THREE.CylinderGeometry(size, size, size * 2, 8); // Increased from 6 to 8
			geometry.rotateZ(Math.PI / 2); // Rotate 90 degrees to lay on its side
			break;
		case PlantType.CYPRESS: {
			const hemisphere = new THREE.SphereGeometry(size * 1.2, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
			const cone = new THREE.ConeGeometry(size * 1.2, size * 7, 12);
			// Move the cone up so it sits on top of the hemisphere
			cone.translate(0, size * 3.5, 0);

			// Merge the geometries using Three.js BufferGeometryUtils
			geometry = mergeGeometries([hemisphere, cone]);
			break;
		}
		default:
			geometry = new THREE.SphereGeometry(size, 6, 4);
	}

	let color;
	switch (type) {
		case PlantType.BALE:
			color = 0xf4d03f;
			break;
		case PlantType.BUSH:
			color = 0x3a5f1e;
			break;
		case PlantType.CYPRESS:
			color = 0x4a6f2e;
			break;
		default:
			color = 0xff0000;
	}

	const material = new THREE.MeshLambertMaterial({
		color,
		opacity: 1.0,
	});

	return {
		type,
		geometry,
		material,
	};
}
