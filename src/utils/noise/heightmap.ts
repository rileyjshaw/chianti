import { generateFBM } from './fbm';
import { generateHill } from './hill';

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
	numHills: number = 2,
	seed: number = 0
): [Float32Array, HighestPoint] {
	// Create a seeded random number generator
	const seededRandom = (min: number, max: number) => {
		const x = Math.sin(seed++) * 10000;
		return min + (x - Math.floor(x)) * (max - min);
	};

	const hills = Array.from({ length: numHills }, (_, i) => {
		const offsetAngle = seededRandom(0, 2 * Math.PI);
		const offsetMagnitude = seededRandom(0, maxHillRadius);
		const centerX = width / 2 + offsetMagnitude * Math.cos(offsetAngle);
		const centerY = height / 2 + offsetMagnitude * Math.sin(offsetAngle);
		const baseRadius = (0.5 + seededRandom(0, 0.5)) * maxHillRadius;
		const noiseRadius = 0.1 * baseRadius * (0.5 + seededRandom(0, 1));
		const hill = generateHill(width, height, centerX, centerY, baseRadius, noiseRadius);
		return hill;
	});

	const hillSum = new Float32Array(width * height);
	for (const hill of hills) {
		for (let i = 0; i < hillSum.length; i++) {
			hillSum[i] += hill[i];
		}
	}

	const fbm = generateFBM(width, height, 50, 4, 2, 0.5);

	const out = new Float32Array(width * height);
	let highestPoint = null as unknown as HighestPoint;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const height = hillSum[index] * 0.6 + fbm[index] * 0.4 * roughness;
			out[index] = height;

			if (!highestPoint || height > highestPoint.height) {
				highestPoint = {
					x,
					y,
					height,
				};
			}
		}
	}

	return [out, highestPoint];
}
