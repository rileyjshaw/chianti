import * as THREE from 'three';
import type { PlantConfig } from '../../types/scene';

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
