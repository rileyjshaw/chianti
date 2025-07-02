# Implementation Guide for Hill Scene Project

## Step-by-Step Instructions for AI Agent

### Prerequisites

-   Node.js and npm installed
-   Basic knowledge of React, TypeScript, and Three.js
-   Understanding of React Three Fiber

### Step 1: Project Setup and Cleanup

#### 1.1 Clean up default Vite files

```bash
# Remove unnecessary files
rm src/App.css
rm src/index.css
rm -rf src/assets
```

#### 1.2 Update App.tsx

Replace the entire content of `src/App.tsx` with an interactive control interface:

```typescript
import { useState, useDeferredValue } from 'react';
import { HillScene } from './components/HillScene';
import { placementMethods } from './utils/plants';

function App() {
	// All controls that affect scene generation
	const [gridSize, setGridSize] = useState(24);
	const [plantSize, setPlantSize] = useState(0.5);
	const [cellSize, setCellSize] = useState(16);
	const [heightScale, setHeightScale] = useState(50);
	const [roughness, setRoughness] = useState(0.5);
	const [numHills, setNumHills] = useState(2);

	// Defer all values that affect scene generation to prevent UI blocking
	const deferredGridSize = useDeferredValue(gridSize);
	const deferredPlantSize = useDeferredValue(plantSize);
	const deferredCellSize = useDeferredValue(cellSize);
	const deferredHeightScale = useDeferredValue(heightScale);
	const deferredRoughness = useDeferredValue(roughness);
	const deferredNumHills = useDeferredValue(numHills);

	// Check if we're using deferred values (indicates pending update)
	const isPending =
		deferredGridSize !== gridSize ||
		deferredPlantSize !== plantSize ||
		deferredCellSize !== cellSize ||
		deferredHeightScale !== heightScale ||
		deferredRoughness !== roughness ||
		deferredNumHills !== numHills;

	return (
		<div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Control Panel */}
			<div style={{ padding: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
				<h2 style={{ margin: '0 0 15px 0', color: 'white' }}>
					Hill Scene Test
					{isPending && <span style={{ marginLeft: '10px', fontSize: '14px' }}>🔄 Updating scene...</span>}
				</h2>

				{/* Interactive controls for all parameters */}
				<div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexWrap: 'wrap' }}>
					{/* Grid Size Control */}
					<div style={{ background: 'rgba(255,255,255,0.95)', padding: '12px 16px', borderRadius: '8px' }}>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
							Grid Size: {gridSize}
						</label>
						<input
							type="range"
							min="4"
							max="32"
							value={gridSize}
							onChange={e => setGridSize(Number(e.target.value))}
							style={{ width: '100%' }}
						/>
					</div>

					{/* Add similar controls for other parameters */}
				</div>
			</div>

			{/* Scene */}
			<div style={{ flex: 1 }}>
				<HillScene
					gridX={deferredGridSize}
					gridY={deferredGridSize}
					cellX={deferredCellSize}
					cellY={deferredCellSize}
					plantSize={deferredPlantSize}
					heightScale={deferredHeightScale}
					roughness={deferredRoughness}
					numHills={deferredNumHills}
				/>
			</div>
		</div>
	);
}

export default App;
```

#### 1.3 Update main.tsx

Replace the entire content of `src/main.tsx` with:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
```

#### 1.4 Install additional dependencies

```bash
npm install @types/three simplex-noise
```

### Step 2: Create Type Definitions

#### 2.1 Create types directory and scene types

Create `src/types/scene.ts`:

```typescript
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
	heightScale?: number;
	numHills?: number;
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
```

### Step 3: Implement Noise Generation

#### 3.1 Create noise utilities

Create `src/utils/noise/fbm.ts`:

```typescript
import { createNoise2D } from 'simplex-noise';

export function generateFBM(
	width: number,
	height: number,
	scale: number = 50,
	octaves: number = 4,
	lacunarity: number = 2,
	persistence: number = 0.5
): Float32Array {
	const noise2D = createNoise2D();
	const heightmap = new Float32Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let amplitude = 1.0;
			let frequency = 1.0;
			let elevation = 0.0;

			for (let i = 0; i < octaves; i++) {
				const sampleX = (x / scale) * frequency;
				const sampleY = (y / scale) * frequency;

				elevation += noise2D(sampleX, sampleY) * amplitude;

				amplitude *= persistence;
				frequency *= lacunarity;
			}

			heightmap[y * width + x] = elevation;
		}
	}

	return heightmap;
}
```

#### 3.2 Create hill generation

Create `src/utils/noise/hill.ts`:

```typescript
import { generateFBM } from './fbm';

export function generateHill(
	width: number,
	height: number,
	centerX: number,
	centerY: number,
	baseRadius: number,
	noiseRadius: number
): Float32Array {
	const heightmap = new Float32Array(width * height);
	const fbm = generateFBM(width, height, noiseRadius, 2, 2, 0.5);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
			const normalizedDistance = distance / baseRadius;

			// Create a smooth hill shape
			const hillHeight = Math.max(0, 1 - normalizedDistance ** 2);
			const noiseHeight = fbm[y * width + x] * 0.3;

			heightmap[y * width + x] = hillHeight + noiseHeight;
		}
	}

	return heightmap;
}
```

#### 3.3 Create heightmap generation

Create `src/utils/noise/heightmap.ts`:

```typescript
import { generateFBM } from './fbm';
import { generateHill } from './hill';

export interface HighestPoint {
	x: number;
	y: number;
	height: number;
}

export function generateHeightmap(
	width: number,
	height: number,
	maxHillRadius: number,
	roughness: number,
	numHills: number = 2
): [Float32Array, HighestPoint] {
	const hills = Array.from({ length: numHills }, () => {
		const offsetAngle = Math.random() * 2 * Math.PI;
		const offsetMagnitude = Math.random() * maxHillRadius;
		const centerX = width / 2 + offsetMagnitude * Math.cos(offsetAngle);
		const centerY = height / 2 + offsetMagnitude * Math.sin(offsetAngle);
		const baseRadius = (0.5 + Math.random() * 0.5) * maxHillRadius;
		const noiseRadius = 0.1 * baseRadius * (0.5 + Math.random());
		return generateHill(width, height, centerX, centerY, baseRadius, noiseRadius);
	});

	const hillSum = new Float32Array(width * height);
	for (const hill of hills) {
		for (let i = 0; i < hillSum.length; i++) {
			hillSum[i] += hill[i];
		}
	}

	const fbm = generateFBM(width, height, 50, 4, 2, 0.5);

	const out = new Float32Array(width * height);
	let highestPoint = null as unknown as HighestPoint;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const height = hillSum[index] * 0.6 + fbm[index] * 0.4 * roughness;
			out[index] = height;

			if (!highestPoint || height > highestPoint.height) {
				highestPoint = {
					x,
					y,
					height,
				};
			}
		}
	}

	return [out, highestPoint];
}
```

#### 3.4 Create noise index

Create `src/utils/noise/index.ts`:

```typescript
export { generateFBM } from './fbm';
export { generateHeightmap, type HighestPoint } from './heightmap';
export { generateHill } from './hill';
```

### Step 4: Implement Plant System

#### 4.1 Create placement methods

Create `src/utils/plants/placement.ts`:

```typescript
import { PlacementMethod } from '../../types/scene';

export const placementMethods: Record<string, PlacementMethod> = {
	placeEmpty: () => false,
	placeDense: () => true,
	placeRows: (x: number, y: number) => y % 2 === 0,
	placeColumns: (x: number, y: number) => x % 2 === 0,
	placeDiagonal: (x: number, y: number) => x === y,
	placeBackDiagonal: (x: number, y: number) => {
		// This will be adjusted based on actual cell dimensions
		return x + y === 63; // Assuming 64x64 cells
	},
	placeGrid: (x: number, y: number) => x % 2 === 0 && y % 2 === 0,
	placeCheckerboard: (x: number, y: number) => (x + y) % 2 === 0,
	placeRandom: (x: number, y: number) => Math.random() > 0.5,
	placeSparse: (x: number, y: number) => Math.random() > 0.8,
};

export function getRandomPlacementMethod(): PlacementMethod {
	const methodNames = Object.keys(placementMethods);
	const randomMethod = methodNames[Math.floor(Math.random() * methodNames.length)];
	return placementMethods[randomMethod];
}
```

#### 4.2 Create plant types

Create `src/utils/plants/types.ts`:

```typescript
import * as THREE from 'three';
import { PlantType, PlantConfig } from '../../types/scene';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createPlantConfig(type: PlantType, size: number = 0.1): PlantConfig {
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
			// Create a hemisphere at the bottom (flipped so round part is down)
			const hemisphere = new THREE.SphereGeometry(size, 8, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
			// Create a much taller cone on top
			const cone = new THREE.ConeGeometry(size, size * 6, 8);
			// Move the cone up so it sits on top of the hemisphere
			cone.translate(0, size * 3.5, 0);

			// Merge the geometries using Three.js BufferGeometryUtils
			geometry = mergeGeometries([hemisphere, cone]);
			break;
		default:
			geometry = new THREE.SphereGeometry(size, 8, 6);
	}

	material = new THREE.MeshLambertMaterial({
		color: type === PlantType.BALE ? 0xf4d03f : 0x2d5016, // More yellow hay color for bale, dark green for others
		transparent: true,
		opacity: 0.9,
	});

	return {
		type,
		geometry,
		material,
		scale: 1.0,
	};
}
```

#### 4.3 Create instancing system

Create `src/utils/plants/instancing.ts`:

```typescript
import * as THREE from 'three';
import { PlantConfig } from '../../types/scene';

export class PlantInstancer {
	private instancedMesh: THREE.InstancedMesh;
	private matrix: THREE.Matrix4;
	private count: number;
	private maxCount: number;

	constructor(plantConfig: PlantConfig, maxInstances: number = 1000) {
		this.maxCount = maxInstances;
		this.count = 0;
		this.matrix = new THREE.Matrix4();

		this.instancedMesh = new THREE.InstancedMesh(plantConfig.geometry, plantConfig.material, maxInstances);
	}

	addInstance(position: THREE.Vector3, rotation?: THREE.Euler): number {
		if (this.count >= this.maxCount) {
			console.warn('PlantInstancer: Maximum instances reached');
			return -1;
		}

		this.matrix.setPosition(position);
		if (rotation) {
			this.matrix.makeRotationFromEuler(rotation);
		}

		this.instancedMesh.setMatrixAt(this.count, this.matrix);
		this.instancedMesh.instanceMatrix.needsUpdate = true;

		return this.count++;
	}

	updateInstance(index: number, position: THREE.Vector3, rotation?: THREE.Euler): void {
		if (index >= this.count) return;

		this.matrix.setPosition(position);
		if (rotation) {
			this.matrix.makeRotationFromEuler(rotation);
		}

		this.instancedMesh.setMatrixAt(index, this.matrix);
		this.instancedMesh.instanceMatrix.needsUpdate = true;
	}

	removeInstance(index: number): void {
		if (index >= this.count) return;

		// Move last instance to this position
		if (index < this.count - 1) {
			const lastMatrix = new THREE.Matrix4();
			this.instancedMesh.getMatrixAt(this.count - 1, lastMatrix);
			this.instancedMesh.setMatrixAt(index, lastMatrix);
		}

		this.count--;
		this.instancedMesh.instanceMatrix.needsUpdate = true;
	}

	getMesh(): THREE.InstancedMesh {
		return this.instancedMesh;
	}

	getCount(): number {
		return this.count;
	}

	dispose(): void {
		this.instancedMesh.geometry.dispose();
		(this.instancedMesh.material as THREE.Material).dispose();
	}
}
```

#### 4.4 Create plants index

Create `src/utils/plants/index.ts`:

```typescript
export { placementMethods, getRandomPlacementMethod } from './placement';
export { createPlantConfig } from './types';
export { PlantInstancer } from './instancing';
```

### Step 5: Implement Mesh Generation

#### 5.1 Create terrain mesh generation

Create `src/utils/mesh/terrain.ts`:

```typescript
import * as THREE from 'three';

export function createTerrainMesh(
	heightmap: Float32Array,
	width: number,
	height: number,
	cellSpacing: number,
	heightScale: number = 10
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
```

#### 5.2 Create mesh index

Create `src/utils/mesh/index.ts`:

```typescript
export { createTerrainMesh } from './terrain';
```

### Step 6: Implement Main Component

#### 6.1 Create HillScene component

Create `src/components/HillScene.tsx`:

```typescript
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PlantType } from '../types/scene';
import type { HillSceneProps } from '../types/scene';
import { createTerrainMesh } from '../utils/mesh';
import { generateHeightmap, type HighestPoint } from '../utils/noise/heightmap';
import { createPlantConfig, PlantInstancer, getRandomPlacementMethod, placementMethods } from '../utils/plants';

interface HillSceneWithScaleProps extends HillSceneProps {
	heightScale?: number;
	numHills?: number;
	fogColor?: string;
	fogNear?: number;
	fogFar?: number;
}

// Function to get a random plant type
const getRandomPlantType = (): PlantType => {
	const plantTypes = Object.values(PlantType);
	const randomIndex = Math.floor(Math.random() * plantTypes.length);
	return plantTypes[randomIndex];
};

function CameraController({
	target,
	cellSizeX,
	cellSizeY,
}: {
	target: [number, number, number];
	cellSizeX: number;
	cellSizeY: number;
}) {
	const controlsRef = useRef<any>(null);

	useEffect(() => {
		if (controlsRef.current) {
			controlsRef.current.object.position.set(
				target[0] - cellSizeX * 4,
				target[1] * 2,
				target[2] - cellSizeY * 4
			);
			controlsRef.current.target.set(...target);
			controlsRef.current.update();
		}
	}, [target, cellSizeX, cellSizeY]);

	return <OrbitControls ref={controlsRef} enableDamping={true} dampingFactor={0.05} />;
}

function HillSceneContent(props: HillSceneWithScaleProps & { heightmap: Float32Array; highestPoint: HighestPoint }) {
	const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
	const [plantInstancers, setPlantInstancers] = useState<PlantInstancer[]>([]);

	// Create a stable random plant type function
	const stableRandomPlantType = useCallback(() => getRandomPlantType(), []);

	const {
		gridX = 24,
		gridY = 24,
		cellX = 64,
		cellY = 64,
		plantSize = 0.5,
		cellSpacing = 2,
		getPlantType = stableRandomPlantType,
		getPlantPlacement = () => getRandomPlacementMethod(),
		heightScale = 10,
		heightmap,
		highestPoint,
	} = props;

	const sceneData = useMemo(() => {
		const totalCellsX = gridX * cellX;
		const totalCellsY = gridY * cellY;

		// Create terrain mesh using the heightmap
		const terrain = createTerrainMesh(heightmap, totalCellsX, totalCellsY, cellSpacing, heightScale);

		// Group plants by type and placement method for efficient instancing
		const plantGroups = new Map<string, Array<THREE.Vector3>>();

		for (let plotY = 0; plotY < gridY; plotY++) {
			for (let plotX = 0; plotX < gridX; plotX++) {
				const plantType = getPlantType(plotX, plotY);
				// Use sparse random placement for haybales, random placement for other plants
				const placementMethod =
					plantType === PlantType.BALE ? placementMethods.placeSparse : getRandomPlacementMethod();
				const methodName = placementMethod.name || 'unknown';

				const groupKey = `${plantType}-${methodName}`;
				if (!plantGroups.has(groupKey)) {
					plantGroups.set(groupKey, []);
				}

				// Calculate plant positions within this grid cell
				const startX = plotX * cellX;
				const startY = plotY * cellY;

				for (let y = 0; y < cellY; y++) {
					for (let x = 0; x < cellX; x++) {
						if (placementMethod(x, y)) {
							const worldX = startX + x;
							const worldY = startY + y;
							const heightIndex = worldY * totalCellsX + worldX;
							const height = heightmap[heightIndex] * heightScale;
							// Y is up, so use (x, height, y)
							const position = new THREE.Vector3(
								worldX * cellSpacing - (totalCellsX * cellSpacing) / 2,
								height + plantSize * 2,
								worldY * cellSpacing - (totalCellsY * cellSpacing) / 2
							);
							plantGroups.get(groupKey)!.push(position);
						}
					}
				}
			}
		}

		// Create instancers for each group
		const instancers: PlantInstancer[] = [];
		plantGroups.forEach((positions, groupKey) => {
			const [plantType] = groupKey.split('-');
			const config = createPlantConfig(plantType as PlantType, plantSize);
			const instancer = new PlantInstancer(config, positions.length);
			positions.forEach(position => {
				instancer.addInstance(position);
			});
			instancers.push(instancer);
		});

		return {
			terrainMesh: terrain,
			plantInstancers: instancers,
		};
	}, [gridX, gridY, cellX, cellY, plantSize, cellSpacing, getPlantPlacement, heightScale, heightmap]);

	useEffect(() => {
		setTerrainMesh(sceneData.terrainMesh);
		setPlantInstancers(sceneData.plantInstancers);
	}, [sceneData]);

	useEffect(() => {
		return () => {
			plantInstancers.forEach(instancer => instancer.dispose());
		};
	}, [plantInstancers]);

	// Calculate world coordinates for camera target
	const totalCellsX = gridX * cellX;
	const totalCellsY = gridY * cellY;
	const worldHighestPointX = highestPoint.x * cellSpacing - (totalCellsX * cellSpacing) / 2;
	const worldHighestPointZ = highestPoint.y * cellSpacing - (totalCellsY * cellSpacing) / 2;
	const worldHighestPointY = highestPoint.height * heightScale;

	const cellSizeX = cellX * cellSpacing;
	const cellSizeY = cellY * cellSpacing;
	// Always look at the highest point
	const cameraTarget: [number, number, number] = [
		worldHighestPointX,
		(worldHighestPointY * 2) / 3,
		worldHighestPointZ,
	];

	return (
		<>
			<ambientLight intensity={0.6} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			{terrainMesh && <primitive object={terrainMesh} />}
			{plantInstancers.map((instancer, index) => (
				<primitive key={index} object={instancer.getMesh()} />
			))}
			<CameraController target={cameraTarget} cellSizeX={cellSizeX} cellSizeY={cellSizeY} />
		</>
	);
}

export function HillScene(
	props: HillSceneProps & {
		heightScale?: number;
		numHills?: number;
		fogColor?: string;
		fogNear?: number;
		fogFar?: number;
	}
) {
	const {
		gridX = 24,
		gridY = 24,
		cellX = 64,
		cellY = 64,
		roughness = 0.5,
		numHills = 2,
		fogColor = '#87CEEB',
		fogNear = 120,
		fogFar = 400,
	} = props;

	// Memoize heightmap generation - only regenerate when roughness or numHills change
	const [heightmap, highestPoint] = useMemo(() => {
		const totalCellsX = gridX * cellX;
		const totalCellsY = gridY * cellY;
		return generateHeightmap(totalCellsX, totalCellsY, Math.min(cellX, cellY) * 8, roughness, numHills);
	}, [gridX, gridY, cellX, cellY, roughness, numHills]);

	return (
		<Canvas
			camera={{
				fov: 35,
			}}
			style={
				{
					background: fogColor,
					userSelect: 'none',
					WebkitUserSelect: 'none',
					MozUserSelect: 'none',
					msUserSelect: 'none',
					WebkitTouchCallout: 'none',
					KhtmlUserSelect: 'none',
				} as React.CSSProperties
			}
			scene={{ fog: new THREE.Fog(fogColor, fogNear, fogFar) }}
			onDragStart={e => e.preventDefault()}
			onDrag={e => e.preventDefault()}
			onDragEnd={e => e.preventDefault()}
			onMouseDown={e => e.preventDefault()}
			onContextMenu={e => e.preventDefault()}
		>
			<HillSceneContent {...props} heightmap={heightmap} highestPoint={highestPoint} />
		</Canvas>
	);
}
```

### Step 7: Testing and Optimization

#### 7.1 Test basic functionality

1. Start the development server: `npm run dev`
2. Verify the scene renders with terrain and plants
3. Check that different placement methods work
4. Test with different grid sizes
5. Verify interactive controls work smoothly

#### 7.2 Performance optimization

1. Monitor frame rate with React DevTools
2. Verify deferred updates prevent UI blocking
3. Check memory usage with large grid sizes
4. Ensure proper cleanup of resources

#### 7.3 Memory optimization

1. Monitor memory usage in browser dev tools
2. Verify proper disposal of geometries and materials
3. Check for memory leaks with repeated parameter changes

### Step 8: Advanced Features (Future Enhancements)

#### 8.1 Erosion System

Create `src/utils/erosion/hydraulic.ts`:

```typescript
export function hydraulicErosion(
	heightmap: Float32Array,
	width: number,
	height: number,
	iterations: number = 1000,
	erosionRadius: number = 3
): Float32Array {
	const result = new Float32Array(heightmap);

	for (let i = 0; i < iterations; i++) {
		// Simplified hydraulic erosion
		// In a real implementation, you'd simulate water droplets
		// flowing down the terrain and carrying sediment

		const x = Math.floor(Math.random() * width);
		const y = Math.floor(Math.random() * height);

		if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
			const center = result[y * width + x];
			const neighbors = [
				result[y * width + (x - 1)],
				result[y * width + (x + 1)],
				result[(y - 1) * width + x],
				result[(y + 1) * width + x],
			];

			const minNeighbor = Math.min(...neighbors);
			if (center > minNeighbor) {
				const erosion = (center - minNeighbor) * 0.1;
				result[y * width + x] -= erosion;
			}
		}
	}

	return result;
}
```

#### 8.2 Web Workers for heavy computations

Create `src/workers/heightmap.worker.ts`:

```typescript
import { generateHeightmap } from '../utils/noise/heightmap';

self.onmessage = e => {
	const { width, height, maxHillRadius, roughness, numHills } = e.data;
	const [heightmap, highestPoint] = generateHeightmap(width, height, maxHillRadius, roughness, numHills);
	self.postMessage({ heightmap, highestPoint });
};
```

### Common Issues and Solutions

#### Issue 1: Plants not appearing

-   Check that placement methods return true for some positions
-   Verify plant size is not too small
-   Ensure camera is positioned correctly

#### Issue 2: Poor performance

-   Reduce number of plants or grid size
-   Use deferred values for all controls
-   Monitor memory usage

#### Issue 3: Memory leaks

-   Properly dispose of geometries and materials
-   Clean up plant instancers on unmount
-   Remove event listeners

#### Issue 4: Terrain looks flat

-   Increase roughness parameter
-   Adjust height scale
-   Increase number of hills

#### Issue 5: UI blocking during updates

-   Ensure all controls use `useDeferredValue`
-   Check that heavy computations are properly memoized
-   Consider moving to Web Workers for very large scenes

This implementation guide provides a complete path from setup to a working hill scene with interactive controls. The current implementation includes multi-hill terrain generation, efficient plant instancing, and smooth interactive controls with deferred updates.
