# Hill Scene Design Document

## React Three Fiber Farm Plot Visualization

### Project Overview

Create a procedurally generated hill scene using React Three Fiber where the terrain is divided into grid squares ("farm plots") with instanced plant objects arranged in various patterns.

### Architecture & File Structure

```
src/
├── components/
│   └── HillScene.tsx          # Main scene component
├── utils/
│   ├── noise/
│   │   ├── index.ts           # Noise utilities export
│   │   ├── fbm.ts             # Fractal Brownian Motion
│   │   ├── heightmap.ts       # Heightmap generation with hill system
│   │   ├── hill.ts            # Individual hill generation
│   │   └── smootherstep.ts    # Smooth interpolation utilities
│   ├── erosion/
│   │   └── index.ts           # Erosion utilities export (placeholder)
│   ├── mesh/
│   │   ├── index.ts           # Mesh utilities export
│   │   └── terrain.ts         # Terrain mesh generation
│   └── plants/
│       ├── index.ts           # Plant utilities export
│       ├── placement.ts       # Plant placement methods
│       ├── types.ts           # Plant type definitions
│       └── instancing.ts      # Instanced mesh management
├── workers/                   # Web Workers (placeholder)
├── types/
│   └── scene.ts               # TypeScript type definitions
├── App.tsx                    # Main app component with interactive controls
└── main.tsx                   # Entry point
```

### Component Specifications

#### HillScene Component

```typescript
interface HillSceneProps {
	gridX?: number; // Number of plots in X direction (default: 24)
	gridY?: number; // Number of plots in Y direction (default: 24)
	cellX?: number; // Plants per plot in X direction (default: 64)
	cellY?: number; // Plants per plot in Y direction (default: 64)
	plantSize?: number; // Size of individual plants (default: 0.5)
	roughness?: number; // Terrain roughness/mountainousness (default: 0.5)
	cellSpacing?: number; // Empty space between plots (default: 2)
	heightScale?: number; // Vertical scaling of terrain (default: 10)
	numHills?: number; // Number of hills to generate (default: 2)
	fogColor?: string; // Color of atmospheric fog (default: '#87CEEB')
	fogNear?: number; // Distance where fog starts (default: 120)
	fogFar?: number; // Distance where fog is fully opaque (default: 400)
	getPlantType?: (gridX: number, gridY: number) => PlantType;
	getPlantPlacement?: (gridX: number, gridY: number, plantType: PlantType) => PlacementMethod;
}
```

#### Plant Types

```typescript
export const PlantType = {
	BUSH: 'bush',
	BALE: 'bale',
	CYPRESS: 'cypress',
} as const;

export type PlantType = (typeof PlantType)[keyof typeof PlantType];

interface PlantConfig {
	type: PlantType;
	geometry: THREE.BufferGeometry;
	material: THREE.Material;
	scale: number;
}
```

#### Placement Methods

```typescript
type PlacementMethod = (worldX: number, worldY: number) => boolean;

const placementMethods = {
	placeEmpty: () => false,
	placeDense: () => true,
	placeRows: (x: number, y: number) => y % 2 === 0,
	placeColumns: (x: number, y: number) => x % 2 === 0,
	placeDiagonal: (x: number, y: number) => x === y,
	placeBackDiagonal: (x: number, y: number) => x + y === cellX - 1,
	placeGrid: (x: number, y: number) => x % 2 === 0 && y % 2 === 0,
	placeCheckerboard: (x: number, y: number) => (x + y) % 2 === 0,
	placeRandom: (x: number, y: number) => Math.random() > 0.5,
	placeSparse: (x: number, y: number) => Math.random() > 0.8,
};
```

### Implementation Instructions

#### Phase 1: Project Setup & Cleanup

1. **Clean up default Vite files:**

    - Remove `App.css`, `index.css`, `assets/` directory
    - Update `App.tsx` to include interactive controls
    - Rewrite `README.md` with project description

2. **Install additional dependencies:**
    ```bash
    npm install @types/three simplex-noise
    ```

#### Phase 2: Core Utilities Implementation

##### 2.1 Noise Generation (`src/utils/noise/`)

```typescript
// fbm.ts
export function generateFBM(
	width: number,
	height: number,
	scale: number = 50,
	octaves: number = 4,
	lacunarity: number = 2,
	persistence: number = 0.5
): Float32Array;

// heightmap.ts
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
): [Float32Array, HighestPoint];

// hill.ts
export function generateHill(
	width: number,
	height: number,
	centerX: number,
	centerY: number,
	baseRadius: number,
	noiseRadius: number
): Float32Array;
```

##### 2.2 Plant System (`src/utils/plants/`)

```typescript
// placement.ts
export const placementMethods: Record<string, PlacementMethod>;

// instancing.ts
export class PlantInstancer {
	constructor(plantConfig: PlantConfig, maxInstances: number = 1000);
	addInstance(position: THREE.Vector3, rotation?: THREE.Euler): number;
	updateInstance(index: number, position: THREE.Vector3, rotation?: THREE.Euler): void;
	removeInstance(index: number): void;
	getMesh(): THREE.InstancedMesh;
	dispose(): void;
}
```

##### 2.3 Mesh Generation (`src/utils/mesh/`)

```typescript
// terrain.ts
export function createTerrainMesh(
	heightmap: Float32Array,
	width: number,
	height: number,
	cellSpacing: number,
	heightScale: number = 10
): THREE.Mesh;
```

#### Phase 3: Main Component Implementation

##### 3.1 HillScene Component

```typescript
// components/HillScene.tsx
export function HillScene(props: HillSceneProps) {
	const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
	const [plantInstancers, setPlantInstancers] = useState<PlantInstancer[]>([]);

	// Memoized heightmap generation
	const [heightmap, highestPoint] = useMemo(() => {
		const totalCellsX = gridX * cellX;
		const totalCellsY = gridY * cellY;
		return generateHeightmap(totalCellsX, totalCellsY, Math.min(cellX, cellY) * 8, roughness, numHills);
	}, [gridX, gridY, cellX, cellY, roughness, numHills]);

	// Camera automatically positioned at highest point
	const cameraTarget: [number, number, number] = [
		worldHighestPointX,
		(worldHighestPointY * 2) / 3,
		worldHighestPointZ,
	];

	return (
		<Canvas
			camera={{ fov: 35 }}
			style={{ background: fogColor }}
			scene={{ fog: new THREE.Fog(fogColor, fogNear, fogFar) }}
		>
			<ambientLight intensity={0.6} />
			<directionalLight position={[10, 10, 5]} intensity={0.8} />
			{terrainMesh && <primitive object={terrainMesh} />}
			{plantInstancers.map((instancer, index) => (
				<primitive key={index} object={instancer.getMesh()} />
			))}
			<CameraController target={cameraTarget} cellSizeX={cellSizeX} cellSizeY={cellSizeY} />
		</Canvas>
	);
}
```

#### Phase 4: Interactive Controls (App.tsx)

The main App component includes interactive controls for:

-   Grid Size (4-32)
-   Cell Size (8-32, step 8)
-   Plant Size (0.05-5)
-   Height Scale (10-100)
-   Roughness (0-1)
-   Number of Hills (1-5)

All controls use `useDeferredValue` for smooth interaction without blocking the UI.

### Performance Optimizations

1. **Instancing Strategy:**

    - Group plants by type and placement method
    - Use `THREE.InstancedMesh` for each unique combination
    - Pre-allocate instance buffers based on maximum possible plants

2. **Deferred Updates:**

    - Use `useDeferredValue` for all scene generation parameters
    - Prevents UI blocking during heavy computations
    - Visual feedback during updates

3. **Memory Management:**
    - Proper disposal of geometries and materials
    - Cleanup of plant instancers on unmount
    - Efficient heightmap generation with multiple hills

### Current Implementation Status

#### ✅ Implemented Features

1. **Core Terrain Generation**: Multi-hill system with FBM noise
2. **Plant Instancing**: Efficient rendering with THREE.InstancedMesh
3. **Interactive Controls**: Real-time parameter adjustment
4. **Camera System**: Automatic positioning at highest terrain point
5. **Atmospheric Effects**: Configurable fog system
6. **Performance Optimizations**: Deferred updates and proper cleanup

#### 🔄 Partially Implemented

1. **Erosion System**: Placeholder directory exists but not implemented
2. **Web Workers**: Placeholder directory exists but not implemented

#### ❌ Not Yet Implemented

1. **LOD System**: Level of Detail for distant plants
2. **Advanced Culling**: Frustum and occlusion culling
3. **Shader-Based Generation**: Real-time terrain updates
4. **Texture Mapping**: Advanced materials and textures

### Feedback & Recommendations

#### Strengths of Current Implementation

1. **Interactive Experience**: Real-time parameter adjustment provides excellent user feedback
2. **Multi-Hill System**: More realistic terrain generation than single hill
3. **Performance Focus**: Deferred updates prevent UI blocking
4. **Extensible Design**: Plant types and placement methods can be easily extended
5. **Automatic Camera**: Smart positioning at highest point for best viewing

#### Potential Improvements

##### 1. **Erosion Implementation**

**Current Status:** Placeholder directory exists
**Recommendation:** Implement hydraulic and thermal erosion for more realistic terrain

##### 2. **Web Worker Integration**

**Current Status:** Placeholder directory exists
**Recommendation:** Move heightmap generation to Web Workers for better performance

##### 3. **LOD System**

**Recommendation:** Implement distance-based Level of Detail to improve performance with large scenes

##### 4. **Advanced Materials**

**Recommendation:** Add texture mapping and more sophisticated materials for terrain and plants

### Implementation Priority

1. **High Priority:** Complete erosion system, Web Worker integration
2. **Medium Priority:** LOD system, advanced culling
3. **Low Priority:** Shader-based generation, texture mapping

### Testing Strategy

1. **Performance Tests:** Measure frame rates with different parameter combinations
2. **Memory Tests:** Monitor memory usage with large grid sizes
3. **Visual Tests:** Ensure terrain looks realistic across all parameter ranges
4. **Interaction Tests:** Verify smooth control updates without blocking

This design document reflects the current state of the implementation, which has evolved significantly from the original design to include interactive controls, multi-hill terrain generation, and sophisticated camera positioning.
