import * as THREE from 'three';
import { PlantType } from '../../types/scene';
import type { PlantConfig } from '../../types/scene';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createPlantConfig(type: PlantType, size: number = 1): PlantConfig {
	let geometry: THREE.BufferGeometry;
	let material: THREE.Material;

	switch (type) {
		case PlantType.BUSH:
			geometry = new THREE.SphereGeometry(size, 8, 6);
			break;
		case PlantType.BALE:
			// Create a cylinder and rotate it 90 degrees to lay on its side
			geometry = new THREE.CylinderGeometry(size, size, size * 2, 8);
			geometry.rotateZ(Math.PI / 2); // Rotate 90 degrees to lay on its side
			break;
		case PlantType.CYPRESS:
			const hemisphere = new THREE.SphereGeometry(size, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
			const cone = new THREE.ConeGeometry(size, size * 6, 8);
			// Move the cone up so it sits on top of the hemisphere
			cone.translate(0, size * 3, 0);

			// Merge the geometries using Three.js BufferGeometryUtils
			geometry = mergeGeometries([hemisphere, cone]);
			break;
		default:
			geometry = new THREE.SphereGeometry(size, 8, 6);
	}

	material = new THREE.MeshLambertMaterial({
		color: type === PlantType.BALE ? 0xf4d03f : 0x00ff00, // More yellow hay color for bale, green for others
		transparent: true,
		opacity: 1.0,
	});

	return {
		type,
		geometry,
		material,
		scale: 1.0,
	};
}
