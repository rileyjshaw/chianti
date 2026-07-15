import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { DEFAULT_MAX_HILL_RADIUS } from '../types/scene';
import type { HillSceneProps } from '../types/scene';
import { createTerrainGeometry, getTerrainMaterial } from '../utils/mesh';
import { generateHeightmap } from '../utils/noise/heightmap';
import { createPlantMesh } from '../utils/plants';
import { generatePlantTransforms } from '../utils/plants/distribute';
import { mulberry32 } from '../utils/random';
import { generateVoronoiCells } from '../utils/voronoi';
import { RealisticSky } from './RealisticSky';

const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);

function CameraRig({ position, target, moveSpeed }: { position: THREE.Vector3; target: THREE.Vector3; moveSpeed: number }) {
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const activeKeys = useRef(new Set<string>());
	const forward = useRef(new THREE.Vector3());
	const right = useRef(new THREE.Vector3());
	const movement = useRef(new THREE.Vector3());

	useEffect(() => {
		const controls = controlsRef.current;
		if (controls) {
			controls.object.position.copy(position);
			controls.target.copy(target);
			controls.update();
		}
	}, [position, target]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!MOVEMENT_KEYS.has(event.code)) return;
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement && event.target.isContentEditable)
			) {
				return;
			}
			activeKeys.current.add(event.code);
		};
		const handleKeyUp = (event: KeyboardEvent) => activeKeys.current.delete(event.code);
		const clearKeys = () => activeKeys.current.clear();

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', clearKeys);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', clearKeys);
		};
	}, []);

	useFrame((_state, delta) => {
		const controls = controlsRef.current;
		if (!controls) return;

		const keys = activeKeys.current;
		if (keys.size === 0) {
			controls.autoRotate = true;
			return;
		}

		// Keep keyboard movement parallel to the ground and move the OrbitControls
		// target with the camera so mouse orbiting remains intuitive afterward.
		controls.autoRotate = false;
		controls.object.getWorldDirection(forward.current);
		forward.current.y = 0;
		if (forward.current.lengthSq() === 0) return;
		forward.current.normalize();
		right.current.crossVectors(forward.current, controls.object.up).normalize();

		movement.current.set(0, 0, 0);
		if (keys.has('KeyW')) movement.current.add(forward.current);
		if (keys.has('KeyS')) movement.current.sub(forward.current);
		if (keys.has('KeyD')) movement.current.add(right.current);
		if (keys.has('KeyA')) movement.current.sub(right.current);
		if (movement.current.lengthSq() === 0) return;

		movement.current.normalize().multiplyScalar(moveSpeed * Math.min(delta, 0.1));
		controls.object.position.add(movement.current);
		controls.target.add(movement.current);
		controls.update();
	});

	return (
		<OrbitControls
			ref={controlsRef}
			enableDamping
			dampingFactor={0.05}
			autoRotate
			autoRotateSpeed={0.25}
			maxPolarAngle={Math.PI / 2 - 0.02}
		/>
	);
}

function HillSceneContent({ config, seed, getPlantType, getPlantPlacement }: HillSceneProps) {
	const { gridSize, voronoiCells, plantSize, heightScale, roughness, plantSpacing, numHills } = config;

	const [heightmap, highestPoint] = useMemo(
		() => generateHeightmap(gridSize, gridSize, DEFAULT_MAX_HILL_RADIUS, roughness, numHills, seed),
		[gridSize, roughness, numHills, seed]
	);

	const voronoi = useMemo(
		() =>
			generateVoronoiCells(
				gridSize,
				gridSize,
				voronoiCells,
				getPlantType,
				getPlantPlacement,
				heightmap,
				mulberry32(seed ^ 0x9e3779b9)
			),
		[gridSize, voronoiCells, getPlantType, getPlantPlacement, heightmap, seed]
	);

	const terrainGeometry = useMemo(
		() => createTerrainGeometry(heightmap, gridSize, gridSize, plantSpacing, heightScale),
		[heightmap, gridSize, plantSpacing, heightScale]
	);

	const plantMeshes = useMemo(() => {
		const rng = mulberry32(seed ^ 0x51ed270b);
		const groups = generatePlantTransforms(
			heightmap,
			gridSize,
			gridSize,
			voronoi,
			plantSize,
			plantSpacing,
			heightScale,
			rng
		);
		return [...groups.entries()].map(([type, transforms]) => ({
			type,
			mesh: createPlantMesh(type, transforms, rng),
		}));
	}, [heightmap, gridSize, voronoi, plantSize, plantSpacing, heightScale, seed]);

	// Release GPU resources when a regeneration replaces them. Plant geometry
	// and materials are shared singletons; only per-scene buffers go.
	useEffect(() => () => terrainGeometry.dispose(), [terrainGeometry]);
	useEffect(() => () => plantMeshes.forEach(({ mesh }) => mesh.dispose()), [plantMeshes]);

	const [cameraPosition, cameraTarget] = useMemo(() => {
		// Perch the camera a fifth of the terrain away from the summit,
		// looking back at it.
		const offset = Math.round(gridSize / 5);
		const gridX = Math.min(gridSize - 1, Math.max(0, highestPoint.x - offset));
		const gridY = Math.min(gridSize - 1, Math.max(0, highestPoint.y - offset));
		const position = new THREE.Vector3(
			(gridX - gridSize / 2) * plantSpacing,
			heightmap[gridY * gridSize + gridX] * heightScale + plantSize * 8,
			(gridY - gridSize / 2) * plantSpacing
		);

		const target = new THREE.Vector3(
			(highestPoint.x - gridSize / 2) * plantSpacing,
			highestPoint.height * heightScale * 0.75,
			(highestPoint.y - gridSize / 2) * plantSpacing
		);

		return [position, target];
	}, [gridSize, plantSpacing, heightmap, heightScale, highestPoint, plantSize]);

	return (
		<>
			<RealisticSky />

			<mesh
				geometry={terrainGeometry}
				material={getTerrainMaterial()}
				rotation-x={-Math.PI / 2}
				position={[-plantSpacing / 2, 0, -plantSpacing / 2]}
			/>
			{plantMeshes.map(({ type, mesh }) => (
				<primitive key={type} object={mesh} />
			))}

			<CameraRig
				position={cameraPosition}
				target={cameraTarget}
				moveSpeed={Math.max(plantSpacing * 8, gridSize * plantSpacing * 0.1)}
			/>
		</>
	);
}

export function HillScene(props: HillSceneProps) {
	return (
		<Canvas camera={{ fov: 25 }} style={{ userSelect: 'none', touchAction: 'none' }}>
			<HillSceneContent {...props} />
		</Canvas>
	);
}
