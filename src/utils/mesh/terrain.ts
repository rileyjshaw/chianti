import * as THREE from 'three';

export function createTerrainMesh(
	heightmap: Float32Array,
	width: number,
	height: number,
	cellSpacing: number,
	heightScale: number = 10 // New parameter for scaling Z
): THREE.Mesh {
	const geometry = new THREE.PlaneGeometry(width * cellSpacing, height * cellSpacing, width - 1, height - 1);

	// Apply heightmap to geometry
	const positions = geometry.attributes.position;
	for (let i = 0; i < positions.count; i++) {
		const x = Math.floor(i % width);
		const y = Math.floor(i / width);
		const heightIndex = y * width + x;

		if (heightIndex < heightmap.length) {
			positions.setZ(i, heightmap[heightIndex] * heightScale);
		}
	}

	positions.needsUpdate = true;
	geometry.computeVertexNormals();

	const material = new THREE.MeshLambertMaterial({
		color: 0xe6d7b8, // Lighter, yellower brown for dry dirt
		side: THREE.DoubleSide,
	});

	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = -Math.PI / 2; // Rotate so Y is up

	// Small offset to align with plant positions (half cell spacing)
	mesh.position.set(-cellSpacing / 2, 0, -cellSpacing / 2);

	return mesh;
}
