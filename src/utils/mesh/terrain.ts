import * as THREE from 'three';
import { performanceMonitor } from '../performance';

// Bilinear interpolation for heightmap
function getHeightBilinear(heightmap: Float32Array, mapWidth: number, mapHeight: number, x: number, y: number): number {
	// Clamp to valid range
	x = Math.max(0, Math.min(mapWidth - 1, x));
	y = Math.max(0, Math.min(mapHeight - 1, y));

	const x0 = Math.floor(x);
	const x1 = Math.min(mapWidth - 1, Math.ceil(x));
	const y0 = Math.floor(y);
	const y1 = Math.min(mapHeight - 1, Math.ceil(y));

	const q11 = heightmap[y0 * mapWidth + x0];
	const q21 = heightmap[y0 * mapWidth + x1];
	const q12 = heightmap[y1 * mapWidth + x0];
	const q22 = heightmap[y1 * mapWidth + x1];

	const tx = x - x0;
	const ty = y - y0;

	const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
	const top = lerp(q11, q21, tx);
	const bottom = lerp(q12, q22, tx);
	return lerp(top, bottom, ty);
}

// Load just the diffuse texture for ground
async function loadGroundTexture(): Promise<THREE.Texture> {
	const textureLoader = new THREE.TextureLoader();

	// Load diffuse texture (albedo)
	const map = textureLoader.load('/textures/forest_ground/forest_ground_04_diff_4k.jpg');
	map.wrapS = THREE.RepeatWrapping;
	map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(32, 32);
	map.generateMipmaps = true;

	return map;
}

export async function createTerrainMesh(
	heightmap: Float32Array,
	mapWidth: number,
	mapHeight: number,
	cellSpacing: number,
	heightScale: number = 10
): Promise<THREE.Mesh> {
	performanceMonitor.startOperation('createTerrainMesh');

	// Use moderate mesh complexity for heightmap displacement
	const meshSegments = Math.min(128, Math.max(32, Math.floor(Math.sqrt(mapWidth * mapHeight) / 4)));
	performanceMonitor.startOperation('createTerrainGeometry');
	const geometry = new THREE.PlaneGeometry(
		mapWidth * cellSpacing,
		mapHeight * cellSpacing,
		meshSegments,
		meshSegments
	);
	performanceMonitor.endOperation('createTerrainGeometry', {
		meshSegments,
		vertices: geometry.attributes.position.count,
	});

	// Apply interpolated heightmap to geometry
	performanceMonitor.startOperation('applyHeightmap');
	const positions = geometry.attributes.position;
	for (let i = 0; i < positions.count; i++) {
		// Get normalized (u, v) in [0, 1]
		const ix = i % (meshSegments + 1);
		const iy = Math.floor(i / (meshSegments + 1));
		const u = ix / meshSegments;
		const v = iy / meshSegments;

		// Map to heightmap coordinates
		const hx = u * (mapWidth - 1);
		const hy = v * (mapHeight - 1);
		const h = getHeightBilinear(heightmap, mapWidth, mapHeight, hx, hy);
		positions.setZ(i, h * heightScale);
	}

	positions.needsUpdate = true;
	performanceMonitor.endOperation('applyHeightmap', { vertices: positions.count });

	performanceMonitor.startOperation('computeNormals');
	geometry.computeVertexNormals();
	performanceMonitor.endOperation('computeNormals');

	// Load just the diffuse texture
	performanceMonitor.startOperation('loadTexture');
	const groundTexture = await loadGroundTexture();
	performanceMonitor.endOperation('loadTexture');

	// Create simple material with just the diffuse texture
	performanceMonitor.startOperation('createMaterial');
	const material = new THREE.MeshLambertMaterial({
		map: groundTexture,
		side: THREE.DoubleSide,
		color: new THREE.Color('#c8a27d'), // Warm reddish-brown tint
	});
	performanceMonitor.endOperation('createMaterial');

	performanceMonitor.startOperation('createMesh');
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = -Math.PI / 2; // Rotate so Y is up

	// Small offset to align with plant positions (half cell spacing)
	mesh.position.set(-cellSpacing / 2, 0, -cellSpacing / 2);
	performanceMonitor.endOperation('createMesh');

	performanceMonitor.endOperation('createTerrainMesh', { mapWidth, mapHeight, meshSegments });
	return mesh;
}
