import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { performanceMonitor, logMemoryUsage, frameRateMonitor, trackRender } from '../utils/performance';
import {
	PlantType,
	DEFAULT_GRID_SIZE,
	DEFAULT_NUM_VORONOI_CELLS,
	DEFAULT_PLANT_SIZE,
	DEFAULT_ROUGHNESS,
	DEFAULT_CELL_SPACING,
	DEFAULT_MAX_HILL_RADIUS,
	DEFAULT_NUM_HILLS,
} from '../types/scene';
import type { HillSceneProps } from '../types/scene';
import { createTerrainMesh } from '../utils/mesh';
import { generateHeightmap, type HighestPoint } from '../utils/noise/heightmap';
import { createPlantConfig, PlantInstancer, getRandomPlacementMethod, placementMethods } from '../utils/plants';
import { clearPlacementCache } from '../utils/plants/placement';
import { generateVoronoiCells, getPlantDataForPosition } from '../utils/voronoi';
import { RealisticSky, Floor } from './RealisticSky';

interface HillSceneWithScaleProps extends Omit<HillSceneProps, 'gridX' | 'gridY'> {
	gridX: number;
	gridY: number;
	heightScale?: number;
}

// Function to get a random plant type with weighted probabilities
const getRandomPlantType = (): PlantType => {
	const random = Math.random();

	// 80% chance for bush, 10% chance for bale, 10% chance for cypress
	if (random < 0.8) {
		return PlantType.BUSH;
	} else if (random < 0.9) {
		return PlantType.BALE;
	} else {
		return PlantType.CYPRESS;
	}
};

function CameraController({ target, offsetSize }: { target: [number, number, number]; offsetSize: number }) {
	const controlsRef = useRef<any>(null);

	useEffect(() => {
		if (controlsRef.current) {
			controlsRef.current.object.position.set(target[0] - offsetSize, target[1] / 1.5, target[2] - offsetSize);
			controlsRef.current.target.set(...target);
			controlsRef.current.update();
		}
	}, [target, offsetSize]);

	return <OrbitControls ref={controlsRef} enableDamping={true} dampingFactor={0.05} />;
}

// Component to handle plant culling based on camera position and distance
function PlantCullingManager({
	plantInstancers,
	fogDistance = 100,
}: {
	plantInstancers: PlantInstancer[];
	fogDistance?: number;
}) {
	const { camera } = useThree();
	const frameId = useRef<number | undefined>(undefined);
	const lastCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3());
	const cullingThreshold = 10; // Only update culling if camera moves more than 10 units

	useEffect(() => {
		if (!camera || plantInstancers.length === 0) return;

		console.log(
			`🌫️  Enabling plant culling for ${plantInstancers.length} instancers with culling distance ${fogDistance}`
		);

		// Enable culling for all instancers
		plantInstancers.forEach(instancer => {
			instancer.enableCulling(camera, fogDistance);
		});

		// Update culling on each frame, but only if camera moved significantly
		const updateCulling = () => {
			const cameraMoved = camera.position.distanceTo(lastCameraPosition.current) > cullingThreshold;

			if (cameraMoved) {
				lastCameraPosition.current.copy(camera.position);
				plantInstancers.forEach(instancer => {
					instancer.updateCulling();
				});
			}

			frameId.current = requestAnimationFrame(updateCulling);
		};

		updateCulling();

		return () => {
			if (frameId.current) {
				cancelAnimationFrame(frameId.current);
			}
			// Disable culling when component unmounts
			plantInstancers.forEach(instancer => {
				instancer.disableCulling();
			});
			console.log('🌫️  Disabled plant culling');
		};
	}, [camera, plantInstancers, fogDistance]);

	return null; // This component doesn't render anything
}

// Component to display performance statistics overlay
function PerformanceStatsOverlay() {
	// Removed the overlay - culling is disabled
	return null;
}

function HillSceneContent(
	props: HillSceneWithScaleProps & { heightmap: Float32Array; highestPoint: HighestPoint; voronoiSystem: any }
) {
	// Track React renders
	trackRender('HillSceneContent', {
		gridX: props.gridX,
		gridY: props.gridY,
		plantSize: props.plantSize,
	});

	const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
	const [plantInstancers, setPlantInstancers] = useState<PlantInstancer[]>([]);

	// Create a stable random plant type function
	const stableRandomPlantType = useCallback(() => getRandomPlantType(), []);

	const {
		gridX,
		gridY,
		numVoronoiCells = DEFAULT_NUM_VORONOI_CELLS,
		plantSize = DEFAULT_PLANT_SIZE,
		cellSpacing = DEFAULT_CELL_SPACING,
		getPlantType = stableRandomPlantType,
		getPlantPlacement = () => getRandomPlacementMethod(),
		heightScale = 10,
		heightmap,
		highestPoint,
	} = props;

	// Use Voronoi system passed from parent component
	const voronoiSystem = props.voronoiSystem;

	// Handle async terrain creation and plant generation
	useEffect(() => {
		let isCancelled = false;

		// Log the effect trigger
		console.log(`🎯 Scene creation effect triggered with:`, {
			gridX,
			gridY,
			numVoronoiCells,
			plantSize,
			cellSpacing,
			heightScale,
			heightmapLength: heightmap.length,
			highestPoint,
		});

		// Always create scene when heightmap changes, but clean up existing terrain first
		if (terrainMesh !== null) {
			console.log(`🔄 Cleaning up existing terrain for regeneration`);
			setTerrainMesh(null);
			setPlantInstancers([]);
			// Return early to let the effect run again with clean state
			return;
		}

		const createScene = async () => {
			// Determine session type based on whether we have existing data
			const sessionType = 'initial';
			performanceMonitor.start(sessionType);
			logMemoryUsage(`Scene creation start - ${sessionType}`);

			try {
				// Create terrain mesh using the heightmap (now async)
				const terrain = await createTerrainMesh(heightmap, gridX, gridY, cellSpacing, heightScale);

				if (isCancelled) return;

				// Group plants by type and placement method for efficient instancing
				performanceMonitor.startOperation('groupPlants');
				const plantGroups = new Map<string, Array<THREE.Vector3>>();

				// Pre-calculate heightmap positions to avoid repeated calculations
				const heightmapPositions = new Map<string, number>();
				for (let worldY = 0; worldY < gridY; worldY++) {
					for (let worldX = 0; worldX < gridX; worldX++) {
						const heightIndex = worldY * gridX + worldX;
						const height = heightmap[heightIndex] * heightScale;
						heightmapPositions.set(`${worldX},${worldY}`, height);
					}
				}

				// Batch process plant placement with yielding
				const batchSize = 1000;
				let processedCount = 0;

				for (let worldY = 0; worldY < gridY; worldY++) {
					for (let worldX = 0; worldX < gridX; worldX++) {
						// Get plant data for this position from Voronoi system
						const plantData = getPlantDataForPosition(worldX, worldY, voronoiSystem);

						if (!plantData) continue;

						const { plantType, placementMethod } = plantData;
						const methodName = placementMethod.name || 'unknown';

						const groupKey = `${plantType}-${methodName}`;
						if (!plantGroups.has(groupKey)) {
							plantGroups.set(groupKey, []);
						}

						// Check if we should place a plant at this position
						if (placementMethod(worldX, worldY)) {
							const height = heightmapPositions.get(`${worldX},${worldY}`)!;
							const yPosition = height + (plantType === PlantType.BALE ? plantSize : plantSize / 2);

							// Y is up, so use (x, height, y)
							const position = new THREE.Vector3(
								worldX * cellSpacing - (gridX * cellSpacing) / 2,
								yPosition,
								worldY * cellSpacing - (gridY * cellSpacing) / 2
							);
							plantGroups.get(groupKey)!.push(position);
						}

						processedCount++;
						if (processedCount % batchSize === 0) {
							// Yield to main thread to prevent blocking
							await new Promise(resolve => setTimeout(resolve, 0));
						}
					}
				}
				performanceMonitor.endOperation('groupPlants', {
					totalGroups: plantGroups.size,
					totalPlants: Array.from(plantGroups.values()).reduce((sum, positions) => sum + positions.length, 0),
					processedPositions: processedCount,
				});

				// Create instancers for each group
				performanceMonitor.startOperation('createInstancers');
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
				performanceMonitor.endOperation('createInstancers', { numInstancers: instancers.length });

				// Set bounding box for all instancers to cover the whole terrain
				const terrainWidth = gridX * cellSpacing;
				const terrainHeight = gridY * cellSpacing;
				const min = new THREE.Vector3(-terrainWidth / 2, 0, -terrainHeight / 2);
				const max = new THREE.Vector3(
					terrainWidth / 2,
					highestPoint.height * heightScale + plantSize,
					terrainHeight / 2
				);
				const box = new THREE.Box3(min, max);
				instancers.forEach(instancer => instancer.setBounds(box));

				if (!isCancelled) {
					setTerrainMesh(terrain);
					setPlantInstancers(instancers);

					logMemoryUsage('Scene creation end');
					performanceMonitor.end();

					// Log final scene statistics
					console.log('📈 Scene Statistics:');
					console.log(`  - Grid size: ${gridX}x${gridY}`);
					console.log(`  - Voronoi cells: ${numVoronoiCells}`);
					console.log(`  - Plant size: ${plantSize}`);
					console.log(`  - Height scale: ${heightScale}`);
					console.log(
						`  - Total plant instances: ${instancers.reduce(
							(sum, instancer) => sum + instancer.getTotalCount(),
							0
						)}`
					);
					console.log(`  - Terrain vertices: ${terrain.geometry.attributes.position.count}`);
				}
			} catch (error) {
				console.error('Error creating scene:', error);
				performanceMonitor.end();
			}
		};

		createScene();

		return () => {
			isCancelled = true;
		};
	}, [
		gridX,
		gridY,
		numVoronoiCells,
		plantSize,
		cellSpacing,
		getPlantType,
		getPlantPlacement,
		heightScale,
		heightmap,
		voronoiSystem,
		highestPoint,
	]);

	useEffect(() => {
		return () => {
			console.log(`🧹 Disposing ${plantInstancers.length} plant instancers`);
			plantInstancers.forEach(instancer => instancer.dispose());
		};
	}, [plantInstancers]);

	// Note: Terrain reset is now handled within the scene creation effect

	// Cleanup frame rate monitor on unmount
	useEffect(() => {
		return () => {
			console.log('🛑 Stopping frame rate monitor');
			frameRateMonitor.stop();
		};
	}, []);

	// Calculate world coordinates for camera target
	const worldHighestPointX = highestPoint.x * cellSpacing - (gridX * cellSpacing) / 2;
	const worldHighestPointZ = highestPoint.y * cellSpacing - (gridY * cellSpacing) / 2;
	const worldHighestPointY = highestPoint.height * heightScale;

	// Always look at the highest point
	const cameraTarget: [number, number, number] = [
		worldHighestPointX,
		(worldHighestPointY * 2) / 3,
		worldHighestPointZ,
	];

	return (
		<>
			{/* HDR Skybox */}
			<RealisticSky />

			{terrainMesh && <primitive object={terrainMesh} />}
			{plantInstancers.map((instancer, index) => (
				<primitive key={index} object={instancer.getMesh()} />
			))}

			{/* Plant culling manager - temporarily disabled */}
			{/* <PlantCullingManager plantInstancers={plantInstancers} fogDistance={500} /> */}

			<CameraController target={cameraTarget} offsetSize={(gridX * cellSpacing) / 6} />
		</>
	);
}

export function HillScene(
	props: Partial<HillSceneProps> & {
		heightScale?: number;
		numHills?: number;
		regenerationCounter?: number;
	}
) {
	// Track React renders
	trackRender('HillScene', {
		gridX: props.gridX,
		gridY: props.gridY,
		regenerationCounter: props.regenerationCounter,
	});

	const {
		gridX = DEFAULT_GRID_SIZE,
		gridY = DEFAULT_GRID_SIZE,
		roughness = DEFAULT_ROUGHNESS,
		numHills = DEFAULT_NUM_HILLS,
		regenerationCounter = 0,
	} = props;

	// Memoize heightmap generation - regenerate when roughness, numHills, or regenerationCounter changes
	const [heightmap, highestPoint] = useMemo(() => {
		console.log(
			`🗺️  Generating heightmap - Grid: ${gridX}x${gridY}, Hills: ${numHills}, Roughness: ${roughness}, Regeneration: ${regenerationCounter}`
		);

		// Check if this is a redundant calculation
		const heightmapKey = `${gridX}x${gridY}_${numHills}_${roughness}_${regenerationCounter}`;
		console.log(`🔑 Heightmap key: ${heightmapKey}`);

		// Clear placement cache when regenerating
		if (regenerationCounter > 0) {
			clearPlacementCache();
		}

		return generateHeightmap(gridX, gridY, DEFAULT_MAX_HILL_RADIUS, roughness, numHills, regenerationCounter);
	}, [gridX, gridY, roughness, numHills, regenerationCounter]);

	// Memoize Voronoi system to prevent redundant generation
	const voronoiSystem = useMemo(() => {
		console.log(
			`🔷 Generating Voronoi cells - Grid: ${gridX}x${gridY}, Cells: ${
				props.numVoronoiCells || DEFAULT_NUM_VORONOI_CELLS
			}`
		);
		return generateVoronoiCells(
			gridX,
			gridY,
			props.numVoronoiCells || DEFAULT_NUM_VORONOI_CELLS,
			props.getPlantType || getRandomPlantType,
			props.getPlantPlacement || (() => placementMethods.placeRandom)
		);
	}, [gridX, gridY, props.numVoronoiCells, props.getPlantType, props.getPlantPlacement]);

	return (
		<div style={{ position: 'relative', width: '100%', height: '100%' }}>
			<Canvas
				camera={{
					fov: 25,
				}}
				style={
					{
						background: 'transparent',
						userSelect: 'none',
						WebkitUserSelect: 'none',
						MozUserSelect: 'none',
						msUserSelect: 'none',
						WebkitTouchCallout: 'none',
						KhtmlUserSelect: 'none',
					} as React.CSSProperties
				}
				onDragStart={e => e.preventDefault()}
				onDrag={e => e.preventDefault()}
				onDragEnd={e => e.preventDefault()}
				onMouseDown={e => e.preventDefault()}
				onContextMenu={e => e.preventDefault()}
				onCreated={() => {
					console.log('🎬 Starting frame rate monitoring...');
					frameRateMonitor.start();
				}}
			>
				<HillSceneContent
					{...props}
					gridX={gridX}
					gridY={gridY}
					heightmap={heightmap}
					highestPoint={highestPoint}
					voronoiSystem={voronoiSystem}
				/>
			</Canvas>

			{/* Performance stats overlay */}
			<PerformanceStatsOverlay />
		</div>
	);
}
