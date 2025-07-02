# Hill Scene - React Three Fiber Farm Visualization

A procedurally generated 3D hill scene built with React Three Fiber, featuring farm plots with instanced plant objects arranged in various patterns. Includes interactive controls for real-time parameter adjustment.

## Features

-   **Procedural Terrain Generation**: Uses multi-hill system with fractal Brownian motion (fBm) noise to create realistic hill landscapes
-   **Grid-Based Farm Plots**: Terrain divided into configurable grid squares representing farm plots
-   **Plant Instancing**: Efficient rendering of thousands of plants using THREE.InstancedMesh
-   **Multiple Placement Patterns**: Various plant arrangement methods (rows, columns, diagonal, checkerboard, etc.)
-   **Interactive Controls**: Real-time parameter adjustment with deferred updates to prevent UI blocking
-   **Extensible Plant System**: Easy to add new plant types and 3D models
-   **Performance Optimized**: Efficient instancing, memory management, and smooth interactions
-   **Atmospheric Fog**: Configurable fog effects for enhanced depth perception and atmosphere
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

-   **Grid Size** (4-32): Number of plots in each direction
-   **Cell Size** (8-32): Number of plants per plot
-   **Plant Size** (0.05-5): Size of individual plants
-   **Height Scale** (10-100): Vertical scaling of terrain
-   **Roughness** (0-1): Terrain roughness/mountainousness
-   **Number of Hills** (1-5): Number of hills to generate

All controls use React's `useDeferredValue` for smooth interaction without blocking the UI.

### Basic Usage

```tsx
import { HillScene } from './components/HillScene';

function App() {
	return (
		<div style={{ width: '100vw', height: '100vh' }}>
			<HillScene />
		</div>
	);
}
```

### Advanced Configuration

```tsx
import { HillScene } from './components/HillScene';
import { PlantType } from './types/scene';

function App() {
	return (
		<HillScene
			gridX={32} // Number of plots in X direction
			gridY={32} // Number of plots in Y direction
			cellX={64} // Plants per plot in X direction
			cellY={64} // Plants per plot in Y direction
			plantSize={0.5} // Size of individual plants
			roughness={0.7} // Terrain roughness (0-1)
			cellSpacing={2} // Space between plots
			heightScale={50} // Vertical scaling of terrain
			numHills={3} // Number of hills to generate
			fogColor="#87CEEB" // Fog color (default: sky blue)
			fogNear={120} // Distance where fog starts
			fogFar={400} // Distance where fog is fully opaque
			getPlantType={(gridX, gridY) => PlantType.BUSH}
			getPlantPlacement={(gridX, gridY, plantType) => placementMethods.placeRows}
		/>
	);
}
```

## Architecture

The project follows a modular architecture with clear separation of concerns:

```
src/
├── components/          # React components
│   └── HillScene.tsx   # Main scene component with camera control
├── utils/
│   ├── noise/          # Noise generation and heightmap creation
│   │   ├── fbm.ts      # Fractal Brownian Motion
│   │   ├── heightmap.ts # Multi-hill heightmap generation
│   │   ├── hill.ts     # Individual hill generation
│   │   └── smootherstep.ts # Smooth interpolation utilities
│   ├── erosion/        # Terrain erosion algorithms (placeholder)
│   ├── mesh/           # Mesh generation and deformation
│   └── plants/         # Plant placement and instancing
├── workers/            # Web Workers (placeholder)
└── types/              # TypeScript type definitions
```

### Key Components

-   **HillScene**: Main component that orchestrates the entire scene with automatic camera positioning
-   **PlantInstancer**: Manages instanced meshes for efficient plant rendering
-   **Multi-Hill System**: Creates realistic terrain using multiple overlapping hills
-   **Placement Methods**: Various algorithms for arranging plants within plots
-   **CameraController**: Automatically positions camera at the highest terrain point

## Plant Types

The system supports three plant types:

```typescript
export const PlantType = {
	BUSH: 'bush', // Simple sphere geometry
	BALE: 'bale', // Cylinder rotated to lay on its side
	CYPRESS: 'cypress', // Complex geometry with hemisphere base and cone top
} as const;
```

## Performance Considerations

-   **Instancing**: Plants are grouped by type and placement method to minimize draw calls
-   **Deferred Updates**: All scene generation parameters use `useDeferredValue` to prevent UI blocking
-   **Memory Management**: Proper disposal of geometries and materials
-   **Efficient Heightmap**: Multi-hill system with optimized noise generation
-   **Smart Camera**: Automatic positioning reduces manual camera setup

## Customization

### Adding New Plant Types

1. Add the new type to the `PlantType` object in `src/types/scene.ts`
2. Update the `createPlantConfig` function in `src/utils/plants/types.ts`
3. Add the corresponding geometry and material creation logic

### Adding New Placement Methods

1. Add the new method to `placementMethods` in `src/utils/plants/placement.ts`
2. The method should follow the signature: `(worldX: number, worldY: number) => boolean`

### Custom Terrain Generation

1. Modify the hill generation parameters in `src/utils/noise/hill.ts`
2. Adjust the multi-hill system in `src/utils/noise/heightmap.ts`
3. Add erosion effects in `src/utils/erosion/` (when implemented)

## Development

### Project Structure

-   **Design Document**: `DESIGN_DOCUMENT.md` - Comprehensive design overview
-   **Implementation Guide**: `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation instructions

### Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run lint` - Run ESLint
-   `npm run preview` - Preview production build

## Current Implementation Status

### ✅ Implemented Features

1. **Core Terrain Generation**: Multi-hill system with FBM noise
2. **Plant Instancing**: Efficient rendering with THREE.InstancedMesh
3. **Interactive Controls**: Real-time parameter adjustment with deferred updates
4. **Camera System**: Automatic positioning at highest terrain point
5. **Atmospheric Effects**: Configurable fog system
6. **Performance Optimizations**: Deferred updates and proper cleanup

### 🔄 Partially Implemented

1. **Erosion System**: Placeholder directory exists but not implemented
2. **Web Workers**: Placeholder directory exists but not implemented

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
