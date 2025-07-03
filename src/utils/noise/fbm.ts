import { createNoise2D } from 'simplex-noise';
import { performanceMonitor } from '../performance';

export function generateFBM(
	width: number,
	height: number,
	scale: number = 50,
	octaves: number = 4,
	lacunarity: number = 2,
	persistence: number = 0.5
): Float32Array {
	performanceMonitor.startOperation('generateFBM');

	const noise2D = createNoise2D();
	const heightmap = new Float32Array(width * height);

	// Calculate the max possible amplitude for normalization
	let maxAmplitude = 0;
	let amplitude = 1;
	for (let i = 0; i < octaves; i++) {
		maxAmplitude += amplitude;
		amplitude *= persistence;
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			amplitude = 1;
			let frequency = 1;
			let elevation = 0;

			for (let i = 0; i < octaves; i++) {
				const sampleX = (x / scale) * frequency;
				const sampleY = (y / scale) * frequency;
				elevation += noise2D(sampleX, sampleY) * amplitude;
				amplitude *= persistence;
				frequency *= lacunarity;
			}

			// Map from [-maxAmplitude, maxAmplitude] to [0, 1]
			heightmap[y * width + x] = elevation / (2 * maxAmplitude) + 0.5;
		}
	}

	performanceMonitor.endOperation('generateFBM', { width, height, octaves, totalPoints: width * height });
	return heightmap;
}
