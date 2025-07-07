# Hill Scene Design Document

## React Three Fiber Farm Plot Visualization

### Project Overview

Create a procedurally generated hill scene using React Three Fiber where the terrain is divided into grid squares with instanced plant objects arranged using a Voronoi cell system for natural distribution patterns.

### Architecture & File Structure

```
src/
├── components/
│   ├── HillScene.tsx          # Main scene component with camera control
│   └── RealisticSky.tsx       # HDR sky rendering
├── utils/
│   ├── noise/
│   │   ├── index.ts           # Noise utilities export
│   │   ├── fbm.ts             # Fractal Brownian Motion
│   │   ├── heightmap.ts       # Heightmap generation with hill system
│   │   ├── hill.ts            # Individual hill generation
│   │   └── smootherstep.ts    # Smooth interpolation utilities
│   ├── erosion/               # Terrain erosion algorithms (placeholder)
│   ├── mesh/
│   │   ├── index.ts           # Mesh utilities export
│   │   └── terrain.ts         # Terrain mesh generation
│   ├── plants/
│   │   ├── index.ts           # Plant utilities export
│   │   ├── placement.ts       # Plant placement methods
│   │   ├── types.ts           # Plant type definitions
│   │   └── instancing.ts      # Instanced mesh management
│   └── voronoi/
│       └── index.ts           # Voronoi cell system for plant distribution
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
	gridWidth: number; // Number of grid cells in X direction
	gridHeight: number; // Number of grid cells in Y direction
	numVoronoiCells: number; // Number of Voronoi cells for plant distribution
	plantSize: number; // Size of individual plants
	roughness: number; // Terrain roughness/mountainousness
	plantSpacing: number; // Space between grid cells
	heightScale: number; // Vertical scaling of terrain
	getPlantType: (x: number, y: number, z: number) => PlantType;
	getPlantPlacement: (plantType: PlantType, x: number, y: number, z: number) => PlacementMethod;
}
```

#### Plant Types

```typescript
export const PlantType = {
	BUSH: 'bush', // Sphere geometry with green material
	BALE: 'bale', // Cylinder rotated to lay on its side
	CYPRESS: 'cypress', // Complex geometry with hemisphere base and cone top
} as const;
```

#### Placement Methods

```typescript
type PlacementMethod = (worldX: number, worldY: number) => boolean;

const placementMethods = {
	placeEmpty: () => false,
	placeFull: () => true,
	placeRows: (x: number, y: number) => x % 2 === 0,
	placeColumns: (x: number, y: number) => y % 2 === 0,
	placeCheckerboard: (x: number, y: number) => (x + y) % 2 === 0,
	placeDiagonal: (x: number, y: number) => (x + y) % 3 === 0,
	placeDense: () => Math.random() < 0.8,
	placeRandom: () => Math.random() < 0.5,
	placeSparse: () => Math.random() < 0.2,
};
```

### Key Features

#### Voronoi Cell System

-   Divides terrain into Voronoi cells for natural plant distribution
-   Each cell has a specific plant type and placement method
-   Efficient spatial lookup using grid-based acceleration

#### Multi-Hill Terrain Generation

-   Uses fractal Brownian motion (fBm) noise for realistic terrain
-   Supports multiple overlapping hills with configurable parameters
-   Automatic heightmap generation with highest point detection

#### Plant Instancing

-   Efficient rendering using THREE.InstancedMesh
-   Plants grouped by type for optimal performance
-   Configurable culling and visibility management

#### Interactive Controls

-   Real-time parameter adjustment with deferred updates
-   Keyboard regeneration trigger (R key)
-   Smooth UI interaction without blocking

### Performance Optimizations

1. **Instancing Strategy**: Plants grouped by type to minimize draw calls
2. **Deferred Updates**: All scene generation parameters use `useDeferredValue`
3. **Memory Management**: Proper disposal of geometries and materials
4. **Spatial Optimization**: Voronoi system with grid-based lookup
5. **Batch Processing**: Plant placement with yielding to prevent blocking

### Current Implementation Status

#### ✅ Implemented Features

1. **Core Terrain Generation**: Multi-hill system with FBM noise
2. **Voronoi Plant Distribution**: Natural plant arrangement using Voronoi cells
3. **Plant Instancing**: Efficient rendering with THREE.InstancedMesh
4. **Interactive Controls**: Real-time parameter adjustment
5. **Camera System**: Automatic positioning at highest terrain point
6. **Realistic Sky**: HDR sky rendering with atmospheric effects
7. **Performance Optimizations**: Deferred updates and proper cleanup

#### 🔄 Partially Implemented

1. **Erosion System**: Placeholder directory exists but not implemented
2. **Web Workers**: Placeholder directory exists but not implemented

#### ❌ Not Yet Implemented

1. **LOD System**: Level of Detail for distant plants
2. **Advanced Culling**: Frustum and occlusion culling
3. **Shader-Based Generation**: Real-time terrain updates
4. **Texture Mapping**: Advanced materials and textures

### Future Enhancements

1. **High Priority**: Complete erosion system, Web Worker integration
2. **Medium Priority**: LOD system, advanced culling
3. **Low Priority**: Shader-based generation, texture mapping

This design document reflects the current state of the implementation, which has evolved to include a sophisticated Voronoi cell system for natural plant distribution and improved performance optimizations.
