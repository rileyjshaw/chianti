import * as THREE from 'three';

async function loadGroundTexture(): Promise<THREE.Texture> {
	const textureLoader = new THREE.TextureLoader();
	const map = textureLoader.load('/chianti/textures/forest_ground/forest_ground_04_diff_4k.jpg');
	map.wrapS = THREE.RepeatWrapping;
	map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(32, 32);
	map.generateMipmaps = true;

	return map;
}

export async function createTerrainMesh(
	heightmap: Float32Array,
	gridWidth: number,
	gridHeight: number,
	plantSpacing: number,
	heightScale: number
): Promise<THREE.Mesh> {
	const geometry = new THREE.PlaneGeometry(
		gridWidth * plantSpacing,
		gridHeight * plantSpacing,
		gridWidth - 1, // Subtract 1 to create gridWidth x gridHeight vertices.
		gridHeight - 1
	);

	geometry.attributes.position.array.forEach((_, i) =>
		geometry.attributes.position.setZ(i, heightmap[i] * heightScale)
	);
	geometry.attributes.position.needsUpdate = true;

	geometry.computeVertexNormals();

	const groundTexture = await loadGroundTexture();
	const material = new THREE.MeshLambertMaterial({
		map: groundTexture,
		side: THREE.DoubleSide,
		color: new THREE.Color('#c8a27d'), // Reddish-brown.
	});

	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = -Math.PI / 2; // Rotate so Y is up.

	// Small offset to align with plant positions (half cell spacing).
	mesh.position.set(-plantSpacing / 2, 0, -plantSpacing / 2);
	return mesh;
}
