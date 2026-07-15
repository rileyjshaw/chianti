import * as THREE from 'three';

const GROUND_TEXTURE_URL = `${import.meta.env.BASE_URL}textures/forest_ground/forest_ground_04_diff_4k.jpg`;

let groundMaterial: THREE.MeshLambertMaterial | null = null;

/**
 * Shared terrain material. The texture starts loading on first use and pops
 * in when ready; the material itself is reused across regenerations so the
 * (large) ground texture is only ever fetched and uploaded once.
 */
export function getTerrainMaterial(): THREE.MeshLambertMaterial {
	if (!groundMaterial) {
		const map = new THREE.TextureLoader().load(GROUND_TEXTURE_URL);
		map.wrapS = THREE.RepeatWrapping;
		map.wrapT = THREE.RepeatWrapping;
		map.repeat.set(32, 32);
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = 4;

		groundMaterial = new THREE.MeshLambertMaterial({
			map,
			color: new THREE.Color('#c8a27d'), // Reddish-brown tint.
		});
	}
	return groundMaterial;
}

/**
 * Builds the terrain geometry from a heightmap. The plane lies in the XY
 * plane (Z = elevation); the caller rotates it flat via the mesh transform.
 */
export function createTerrainGeometry(
	heightmap: Float32Array,
	gridWidth: number,
	gridHeight: number,
	spacing: number,
	heightScale: number
): THREE.PlaneGeometry {
	const geometry = new THREE.PlaneGeometry(
		(gridWidth - 1) * spacing,
		(gridHeight - 1) * spacing,
		gridWidth - 1, // gridWidth x gridHeight vertices.
		gridHeight - 1
	);

	const position = geometry.attributes.position;
	for (let i = 0; i < gridWidth * gridHeight; i++) {
		position.setZ(i, heightmap[i] * heightScale);
	}
	geometry.computeVertexNormals();

	return geometry;
}
