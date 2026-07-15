import { mulberry32, randomRange } from '../random';
import { generateFBM } from './fbm';
import { addHill } from './hill';

export interface HighestPoint {
	x: number;
	y: number;
	height: number;
}

/**
 * Generates a terrain heightmap by blending a few large rounded hills with
 * fBm noise, normalized so the highest point is 1. Fully deterministic for a
 * given (dimensions, roughness, numHills, seed).
 */
export function generateHeightmap(
	width: number,
	height: number,
	maxHillRadius: number,
	roughness: number,
	numHills: number = 2,
	seed: number = 0
): [Float32Array, HighestPoint] {
	const rng = mulberry32(seed);

	const hillSum = new Float32Array(width * height);
	for (let i = 0; i < numHills; i++) {
		const offsetAngle = randomRange(rng, 0, 2 * Math.PI);
		const offsetMagnitude = randomRange(rng, 0, maxHillRadius);
		const centerX = width / 2 + offsetMagnitude * Math.cos(offsetAngle);
		const centerY = height / 2 + offsetMagnitude * Math.sin(offsetAngle);
		const baseRadius = randomRange(rng, 0.5, 1) * maxHillRadius;
		const noiseRadius = 0.1 * baseRadius * randomRange(rng, 0.5, 1.5);
		addHill(hillSum, width, height, centerX, centerY, baseRadius, noiseRadius, 1 / numHills);
	}

	const fbm = generateFBM(width, height, rng, 50, 4, 2, 0.5);

	const out = new Float32Array(width * height);
	const highestPoint: HighestPoint = { x: 0, y: 0, height: -Infinity };

	for (let y = 0; y < height; ++y) {
		for (let x = 0; x < width; ++x) {
			const i = y * width + x;
			const h = hillSum[i] * 0.7 + fbm[i] * roughness * 0.3;
			out[i] = h;

			if (h > highestPoint.height) {
				highestPoint.x = x;
				highestPoint.y = y;
				highestPoint.height = h;
			}
		}
	}

	// Normalize so the highest point sits at exactly 1.
	if (highestPoint.height > 0) {
		const scale = 1 / highestPoint.height;
		for (let i = 0; i < out.length; i++) {
			out[i] *= scale;
		}
		highestPoint.height = 1;
	}

	return [out, highestPoint];
}
