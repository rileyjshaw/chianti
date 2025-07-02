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
