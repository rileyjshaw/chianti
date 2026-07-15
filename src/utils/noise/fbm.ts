import { createNoise2D } from 'simplex-noise';
import type { Rng } from '../random';

/**
 * Fills a heightmap with fractal Brownian motion noise, normalized to [0, 1].
 * The noise field is seeded via `rng` so generation is reproducible.
 */
export function generateFBM(
	width: number,
	height: number,
	rng: Rng,
	scale: number = 50,
	octaves: number = 4,
	lacunarity: number = 2,
	persistence: number = 0.5
): Float32Array {
	const noise2D = createNoise2D(rng);
	const heightmap = new Float32Array(width * height);

	// Max possible amplitude, for normalization.
	let maxAmplitude = 0;
	for (let i = 0, amplitude = 1; i < octaves; i++, amplitude *= persistence) {
		maxAmplitude += amplitude;
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let amplitude = 1;
			let frequency = 1;
			let elevation = 0;

			for (let i = 0; i < octaves; i++) {
				elevation += noise2D((x / scale) * frequency, (y / scale) * frequency) * amplitude;
				amplitude *= persistence;
				frequency *= lacunarity;
			}

			// Map from [-maxAmplitude, maxAmplitude] to [0, 1].
			heightmap[y * width + x] = elevation / (2 * maxAmplitude) + 0.5;
		}
	}

	return heightmap;
}
