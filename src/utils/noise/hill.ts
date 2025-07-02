import { smootherstep } from './smootherstep';

export function generateHill(
	width: number,
	height: number,
	centerX: number,
	centerY: number,
	radius: number,
	noiseRadius: number
): Float32Array {
	const heights = new Float32Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dx = x - centerX;
			const dy = y - centerY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			// Noisy outline: add random noise to the radius
			// (for now, just a simple random, can be replaced with perlin/simplex)
			const angle = Math.atan2(dy, dx);
			const noise = Math.sin(angle * 8) * noiseRadius * 0.5 + Math.cos(angle * 5) * noiseRadius * 0.5;
			const effectiveRadius = radius + noise;
			if (dist > effectiveRadius) {
				heights[y * width + x] = 0;
			} else {
				// t = 0 at edge, t = 1 at center
				const t = 1 - dist / effectiveRadius;
				heights[y * width + x] = smootherstep(Math.max(0, Math.min(1, t)));
			}
		}
	}
	return heights;
}
