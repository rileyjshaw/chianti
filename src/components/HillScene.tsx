import { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { PlantType, DEFAULT_MAX_HILL_RADIUS } from '../types/scene';
import type { HillSceneProps } from '../types/scene';
import { createTerrainMesh } from '../utils/mesh';
import { generateHeightmap, type HighestPoint } from '../utils/noise/heightmap';
import { createPlantConfig, PlantInstancer } from '../utils/plants';
import { generateVoronoiCells, getPlantDataForPosition, type VoronoiSystem } from '../utils/voronoi';
import { RealisticSky } from './RealisticSky';

function CameraController({ position, target }: { position: THREE.Vector3; target: THREE.Vector3 }) {
	const controlsRef = useRef<OrbitControlsImpl>(null);

	useEffect(() => {
		if (controlsRef.current) {
			controlsRef.current.object.position.set(position.x, position.y, position.z);
			controlsRef.current.target.set(target.x, target.y, target.z);
			controlsRef.current.update();
		}
	}, [position, target]);

	return <OrbitControls ref={controlsRef} enableDamping={true} dampingFactor={0.05} />;
}

function HillSceneContent(
	props: HillSceneProps & {
		heightmap: Float32Array;
		highestPoint: HighestPoint;
		voronoiSystem: VoronoiSystem;
		regenerationCounter: number;
	}
) {
	const [terrainMesh, setTerrainMesh] = useState<THREE.Mesh | null>(null);
	const [plantInstancers, setPlantInstancers] = useState<PlantInstancer[]>([]);

	const {
		gridWidth,
		gridHeight,
		numVoronoiCells,
		plantSize,
		plantSpacing,
		getPlantType,
		getPlantPlacement,
		heightScale,
		heightmap,
		highestPoint,
		regenerationCounter,
	} = props;

	// Use Voronoi system passed from parent component
	const voronoiSystem = props.voronoiSystem;

	// Handle async terrain creation and plant generation
	useEffect(() => {
		let isCancelled = false;

		// Clean up existing terrain and plants when dependencies change
		if (terrainMesh !== null) {
			setTerrainMesh(null);
			setPlantInstancers([]);
		}

		const createScene = async () => {
			try {
				const terrain = await createTerrainMesh(heightmap, gridWidth, gridHeight, plantSpacing, heightScale);
				if (isCancelled) return;

				// Group plants by type for efficient instancing.
				const plantGroups = new Map<PlantType, Array<THREE.Vector3>>();

				// Batch process plant placement with yielding
				const batchSize = 1000;
				let processedCount = 0;
				// Place plants at every grid position, excluding top and left edges.
				for (let y = 1; y < gridHeight; y++) {
					for (let x = 1; x < gridWidth; x++) {
						// Get plant data for this position from Voronoi system
						const plantData = getPlantDataForPosition(x, y, voronoiSystem);
						if (!plantData) continue;

						const { plantType, placementMethod } = plantData;

						if (!plantGroups.has(plantType)) {
							plantGroups.set(plantType, []);
						}
						// Check if we should place a plant at this position
						if (placementMethod(x, y)) {
							const i = y * gridWidth + x;
							const height = heightmap[i] * heightScale;

							const xPosition = (x - gridWidth / 2) * plantSpacing;
							const yPosition = height + (plantType === PlantType.BALE ? plantSize : plantSize / 2);
							const zPosition = (y - gridHeight / 2) * plantSpacing;

							const position = new THREE.Vector3(xPosition, yPosition, zPosition);
							plantGroups.get(plantType)!.push(position);
						}

						processedCount++;
						if (processedCount % batchSize === 0) {
							// Yield to main thread to prevent blocking
							await new Promise(resolve => setTimeout(resolve, 0));
						}
					}
				}
				// Create instancers for each group
				const instancers: PlantInstancer[] = [];
				plantGroups.forEach((positions, plantType) => {
					const config = createPlantConfig(plantType, plantSize);
					const instancer = new PlantInstancer(config, positions.length);
					positions.forEach(position => {
						instancer.addInstance(position);
					});
					instancers.push(instancer);
				});

				// Set bounding box for all instancers to cover the whole terrain
				const terrainWidth = gridWidth * plantSpacing;
				const terrainHeight = gridHeight * plantSpacing;
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
				}
			} catch (error) {
				console.error('Error creating scene:', error);
			}
		};

		createScene();

		return () => {
			isCancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		gridWidth,
		gridHeight,
		numVoronoiCells,
		plantSize,
		plantSpacing,
		getPlantType,
		getPlantPlacement,
		heightScale,
		heightmap,
		voronoiSystem,
		highestPoint,
		regenerationCounter,
		// terrainMesh,
	]);

	useEffect(() => {
		return () => {
			plantInstancers.forEach(instancer => instancer.dispose());
		};
	}, [plantInstancers]);

	const [cameraPosition, cameraTarget] = useMemo(() => {
		const cameraOffset = Math.round(gridWidth / 5);
		const cameraPositionX = highestPoint.x - cameraOffset;
		const cameraPositionZ = highestPoint.y - cameraOffset;
		const cameraPositionY = heightmap[cameraPositionZ * gridWidth + cameraPositionX] * heightScale + plantSize * 8;
		const cameraPositionWorldX = (cameraPositionX - gridWidth / 2) * plantSpacing;
		const cameraPositionWorldZ = (cameraPositionZ - gridHeight / 2) * plantSpacing;
		const cameraPosition = new THREE.Vector3(cameraPositionWorldX, cameraPositionY, cameraPositionWorldZ);

		// Always look at the highest point.
		const highestPointWorldX = (highestPoint.x - gridWidth / 2) * plantSpacing;
		const highestPointWorldZ = (highestPoint.y - gridHeight / 2) * plantSpacing;
		const highestPointWorldY = highestPoint.height * heightScale;
		const cameraTarget = new THREE.Vector3(highestPointWorldX, (highestPointWorldY * 3) / 4, highestPointWorldZ);

		return [cameraPosition, cameraTarget];
	}, [gridWidth, gridHeight, plantSpacing, heightmap, heightScale, highestPoint, plantSize]);

	return (
		<>
			<RealisticSky />

			{terrainMesh && <primitive object={terrainMesh} />}
			{plantInstancers.map((instancer, index) => (
				<primitive key={index} object={instancer.getMesh()} />
			))}

			<CameraController position={cameraPosition} target={cameraTarget} />
		</>
	);
}

export function HillScene(
	props: HillSceneProps & {
		numHills: number;
		regenerationCounter: number;
	}
) {
	const { gridWidth, gridHeight, roughness, numHills, regenerationCounter = 0, getPlantType } = props;

	const [heightmap, highestPoint] = useMemo(() => {
		return generateHeightmap(
			gridWidth,
			gridHeight,
			DEFAULT_MAX_HILL_RADIUS,
			roughness,
			numHills,
			regenerationCounter
		);
	}, [gridWidth, gridHeight, roughness, numHills, regenerationCounter]);

	// Memoize Voronoi system to prevent redundant generation
	const voronoiSystem = useMemo(() => {
		return generateVoronoiCells(
			gridWidth,
			gridHeight,
			props.numVoronoiCells,
			getPlantType,
			props.getPlantPlacement,
			heightmap
		);
	}, [gridWidth, gridHeight, props.numVoronoiCells, getPlantType, props.getPlantPlacement, heightmap]);

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
			>
				<HillSceneContent
					{...props}
					heightmap={heightmap}
					highestPoint={highestPoint}
					voronoiSystem={voronoiSystem}
					regenerationCounter={regenerationCounter}
				/>
			</Canvas>
		</div>
	);
}
