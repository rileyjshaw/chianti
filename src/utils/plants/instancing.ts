import * as THREE from 'three';
import { PlantType } from '../../types/scene';
import type { Rng } from '../random';
import { PLANT_COLORS, getPlantGeometry, getPlantMaterial } from './geometry';

export interface PlantTransform {
	x: number;
	y: number;
	z: number;
	rotationY: number;
	scale: number;
}

/**
 * Builds a single InstancedMesh for all plants of one type. Geometry and
 * material are shared module-level singletons, so disposing the mesh only
 * releases its per-instance buffers.
 */
export function createPlantMesh(type: PlantType, transforms: readonly PlantTransform[], rng: Rng): THREE.InstancedMesh {
	const geometry = getPlantGeometry(type);
	const mesh = new THREE.InstancedMesh(geometry, getPlantMaterial(type), transforms.length);

	const matrix = new THREE.Matrix4();
	const position = new THREE.Vector3();
	const quaternion = new THREE.Quaternion();
	const scale = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);
	const color = new THREE.Color();
	const baseColor = new THREE.Color(PLANT_COLORS[type]);

	for (let i = 0; i < transforms.length; i++) {
		const t = transforms[i];
		position.set(t.x, t.y, t.z);
		quaternion.setFromAxisAngle(up, t.rotationY);
		scale.setScalar(t.scale);
		matrix.compose(position, quaternion, scale);
		mesh.setMatrixAt(i, matrix);

		// Subtle per-instance tonal variation keeps large fields from reading
		// as a single flat color.
		color.copy(baseColor).offsetHSL(0, 0, (rng() - 0.5) * 0.08);
		mesh.setColorAt(i, color);
	}

	// Accurate frustum-culling bounds spanning every instance (stored on the
	// mesh, not the shared geometry).
	mesh.computeBoundingSphere();

	return mesh;
}
