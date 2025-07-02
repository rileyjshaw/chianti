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
	numHills: number = 2
): [Float32Array, HighestPoint] {
	const hills = Array.from({ length: numHills }, () => {
		const offsetAngle = Math.random() * 2 * Math.PI;
		const offsetMagnitude = Math.random() * maxHillRadius;
		const centerX = width / 2 + offsetMagnitude * Math.cos(offsetAngle);
		const centerY = height / 2 + offsetMagnitude * Math.sin(offsetAngle);
		const baseRadius = (0.5 + Math.random() * 0.5) * maxHillRadius;
		const noiseRadius = 0.1 * baseRadius * (0.5 + Math.random());
		return generateHill(width, height, centerX, centerY, baseRadius, noiseRadius);
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
