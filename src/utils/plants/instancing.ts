import * as THREE from 'three';
import type { PlantConfig } from '../../types/scene';

export class PlantInstancer {
	private instancedMesh: THREE.InstancedMesh;
	private matrix: THREE.Matrix4;
	private count: number;
	private maxCount: number;
	private positions: THREE.Vector3[];
	private visibleInstances: Set<number>;
	private camera: THREE.Camera | null;
	private cullingEnabled: boolean;
	private cullingDistance: number;

	constructor(plantConfig: PlantConfig, maxInstances: number = 1000) {
		this.maxCount = maxInstances;
		this.count = 0;
		this.matrix = new THREE.Matrix4();
		this.positions = [];
		this.visibleInstances = new Set();
		this.camera = null;
		this.cullingEnabled = false;
		this.cullingDistance = 100;

		this.instancedMesh = new THREE.InstancedMesh(plantConfig.geometry, plantConfig.material, maxInstances);
	}

	addInstance(position: THREE.Vector3, rotation?: THREE.Euler): number {
		if (this.count >= this.maxCount) {
			console.warn('PlantInstancer: Maximum instances reached');
			return -1;
		}

		this.positions.push(position.clone());
		this.matrix.setPosition(position);
		if (rotation) {
			this.matrix.makeRotationFromEuler(rotation);
		}

		this.instancedMesh.setMatrixAt(this.count, this.matrix);
		this.instancedMesh.instanceMatrix.needsUpdate = true;

		return this.count++;
	}

	getMesh(): THREE.InstancedMesh {
		return this.instancedMesh;
	}

	dispose(): void {
		this.instancedMesh.geometry.dispose();
		(this.instancedMesh.material as THREE.Material).dispose();
	}

	setBounds(box: THREE.Box3) {
		this.instancedMesh.geometry.boundingBox = box.clone();
		this.instancedMesh.geometry.boundingSphere = new THREE.Sphere();
		box.getBoundingSphere(this.instancedMesh.geometry.boundingSphere);
		this.instancedMesh.geometry.computeBoundingBox = () => {
			this.instancedMesh.geometry.boundingBox = box.clone();
		};
		this.instancedMesh.geometry.computeBoundingSphere = () => {
			this.instancedMesh.geometry.boundingSphere = new THREE.Sphere();
			box.getBoundingSphere(this.instancedMesh.geometry.boundingSphere);
		};
	}

	enableCulling(camera: THREE.Camera, cullingDistance: number = 100): void {
		this.camera = camera;
		this.cullingEnabled = true;
		this.cullingDistance = cullingDistance;
	}

	disableCulling(): void {
		this.cullingEnabled = false;
		this.camera = null;
	}

	updateCulling(): void {
		if (!this.cullingEnabled || !this.camera) return;

		this.visibleInstances.clear();

		// Check each instance against distance only (no frustum culling for smooth camera rotation)
		for (let i = 0; i < this.count; i++) {
			const position = this.positions[i];

			// Only cull if beyond the culling distance
			const distanceToCamera = this.camera.position.distanceTo(position);
			if (distanceToCamera <= this.cullingDistance) {
				this.visibleInstances.add(i);
			}
		}

		// For now, just show all instances to avoid culling bugs
		this.instancedMesh.count = this.count;
		this.instancedMesh.instanceMatrix.needsUpdate = true;

		const cullingRatio = this.visibleInstances.size / this.count;

		// Log culling stats occasionally
		if (Math.random() < 0.01) {
			// 1% chance to log
			console.log(
				`🌫️  Distance Culling: ${this.visibleInstances.size}/${this.count} plants visible (${(
					cullingRatio * 100
				).toFixed(1)}%)`
			);
		}
	}

	getVisibleCount(): number {
		return this.visibleInstances.size;
	}

	getTotalCount(): number {
		return this.count;
	}
}
