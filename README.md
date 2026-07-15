# Chianti

A procedurally generated 3D hill scene built with React Three Fiber, featuring terrain with instanced plant objects arranged using a Voronoi cell system for natural distribution patterns. Includes interactive controls for real-time parameter adjustment.

I leaned on Cursor heavily for this; over half of the code is vibe-coded.

## Features

-   **Procedural Terrain Generation**: Uses multi-hill system with fractal Brownian motion (fBm) noise to create realistic hill landscapes
-   **Voronoi Plant Distribution**: Natural plant arrangement using Voronoi cells for organic distribution patterns
-   **Plant Instancing**: Efficient rendering of thousands of plants using THREE.InstancedMesh
-   **Multiple Placement Patterns**: Various plant arrangement methods (rows, columns, diagonal, checkerboard, etc.)
-   **Interactive Controls**: Real-time parameter adjustment with deferred updates to prevent UI blocking
-   **Extensible Plant System**: Easy to add new plant types and 3D models
-   **Performance Optimized**: Efficient instancing, memory management, and smooth interactions
-   **Realistic Sky**: HDR sky rendering with atmospheric effects
-   **Smart Camera**: Automatically positions camera at the highest terrain point for optimal viewing

## Technology Stack

-   **React 19** - UI framework with concurrent features
-   **TypeScript** - Type safety
-   **React Three Fiber** - React renderer for Three.js
-   **Three.js** - 3D graphics library
-   **Simplex Noise** - Procedural noise generation
-   **Vite** - Build tool and dev server

## Getting Started

### Prerequisites

-   Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser to the URL shown in the terminal

### Building for Production

```bash
npm run build
```

## Usage

### Interactive Controls

The application includes a control panel with sliders for:

-   **Grid Size** (16-1024): Number of grid cells in each direction
-   **Voronoi Cells** (4-256): Number of Voronoi cells for plant distribution
-   **Plant Size** (0.05-5): Size of individual plants
-   **Height Scale** (1-100): Vertical scaling of terrain
-   **Roughness** (0.1-1.0): Terrain roughness/mountainousness
-   **Number of Hills** (0-16): Number of hills to generate

All controls use React's `useDeferredValue` for smooth interaction without blocking the UI.

**Note**: Controls are hidden by default and can be enabled by setting `SHOW_CONFIG_CONTROLS` to `true` in `src/types/scene.ts`.

### Keyboard Controls

-   **R Key**: Regenerate terrain with current parameters
-   **WASD Keys**: Move the camera forward, left, backward, and right

### Basic Usage

```tsx
import { HillScene } from './components/HillScene';
import { DEFAULT_SCENE_CONFIG, PlantType } from './types/scene';
import { placementMethods } from './utils/plants';

function App() {
	return (
		<div style={{ width: '100vw', height: '100vh' }}>
			<HillScene
				config={DEFAULT_SCENE_CONFIG}
				seed={0}
				getPlantType={() => PlantType.BUSH}
				getPlantPlacement={() => placementMethods.random}
			/>
		</div>
	);
}
```

### Advanced Configuration

```tsx
import { HillScene } from './components/HillScene';
import { DEFAULT_SCENE_CONFIG, PlantType } from './types/scene';
import { placementMethods } from './utils/plants';

function App() {
	return (
		<HillScene
			config={{
				...DEFAULT_SCENE_CONFIG,
				gridSize: 400,
				voronoiCells: 64,
				plantSize: 0.5,
				roughness: 0.8,
				plantSpacing: 2,
				heightScale: 25,
				numHills: 3,
			}}
			seed={42}
			getPlantType={(_x, height) => (height > 0.4 ? PlantType.BUSH : PlantType.CYPRESS)}
			getPlantPlacement={plantType =>
				plantType === PlantType.BUSH ? placementMethods.dense : placementMethods.sparse
			}
		/>
	);
}
```

## Architecture

The project follows a modular architecture with clear separation of concerns:

```
src/
├── components/          # React components
│   ├── ControlPanel.tsx # Optional scene configuration controls
│   ├── HillScene.tsx   # Main scene component with camera control
│   └── RealisticSky.tsx # HDR sky rendering
├── utils/
│   ├── noise/          # Noise generation and heightmap creation
│   ├── mesh/           # Mesh generation and deformation
│   ├── plants/         # Plant placement and instancing
│   ├── voronoi/        # Voronoi cell system for plant distribution
│   └── random.ts       # Seeded random number generation
└── types/              # TypeScript type definitions
```

### Key Components

-   **HillScene**: Main component that orchestrates the entire scene with automatic camera positioning
-   **Plant mesh utilities**: Build shared plant geometry/materials and per-scene instanced meshes
-   **Voronoi System**: Creates natural plant distribution using Voronoi cells
-   **Multi-Hill System**: Creates realistic terrain using multiple overlapping hills
-   **RealisticSky**: HDR sky rendering with atmospheric effects

## Plant Types

The system supports three plant types:

```typescript
export const PlantType = {
	BUSH: 'bush', // Sphere geometry with green material
	BALE: 'bale', // Cylinder rotated to lay on its side
	CYPRESS: 'cypress', // Complex geometry with hemisphere base and cone top
} as const;
```

## Performance Considerations

-   **Instancing**: Plants are grouped by type to minimize draw calls
-   **Deferred Updates**: All scene generation parameters use `useDeferredValue` to prevent UI blocking
-   **Memory Management**: Shared geometry/materials with per-scene GPU buffer cleanup
-   **Spatial Optimization**: Precomputed Voronoi assignment map with bucketed nearest-seed lookup
-   **Bounded Terrain Work**: Hill accumulation only visits each hill's bounding box
-   **Deterministic Generation**: A seeded PRNG drives terrain, Voronoi regions, and plant variation

## Customization

### Adding New Plant Types

1. Add the new type to the `PlantType` object in `src/types/scene.ts`
2. Add its color and unit geometry in `src/utils/plants/geometry.ts`
3. Update any plant-specific transform rules in `src/utils/plants/distribute.ts`

### Adding New Placement Methods

1. Add the new method to `placementMethods` in `src/utils/plants/placement.ts`
2. The method should follow the signature: `(gridX: number, gridY: number, rng: Rng) => boolean`

### Custom Terrain Generation

1. Modify the hill generation parameters in `src/utils/noise/hill.ts`
2. Adjust the multi-hill system in `src/utils/noise/heightmap.ts`
3. Add erosion effects in `src/utils/erosion/` (when implemented)

## Development

### Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run lint` - Run ESLint
-   `npm run preview` - Preview production build

## Current Implementation Status

### ✅ Implemented Features

1. **Core Terrain Generation**: Multi-hill system with FBM noise
2. **Voronoi Plant Distribution**: Natural plant arrangement using Voronoi cells
3. **Plant Instancing**: Efficient rendering with THREE.InstancedMesh
4. **Interactive Controls**: Real-time parameter adjustment with deferred updates
5. **Camera System**: Automatic positioning at highest terrain point
6. **Realistic Sky**: HDR sky rendering with atmospheric effects
7. **Performance Optimizations**: Deferred updates and proper cleanup

### ❌ Not Yet Implemented

1. **LOD System**: Level of Detail for distant plants
2. **Advanced Culling**: Frustum and occlusion culling
3. **Shader-Based Generation**: Real-time terrain updates
4. **Texture Mapping**: Advanced materials and textures

## Future Enhancements

-   [ ] Level of Detail (LOD) system for distant plants
-   [ ] Advanced erosion algorithms (thermal, hydraulic)
-   [ ] Web Worker integration for heavy computations
-   [ ] Shader-based terrain generation
-   [ ] Texture mapping and materials
-   [ ] Animation and growth simulation
-   [ ] Weather effects and seasons
-   [ ] Export functionality for generated scenes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
