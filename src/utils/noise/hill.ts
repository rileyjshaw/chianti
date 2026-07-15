import { smootherstep } from './smootherstep';

/**
 * Accumulates a single rounded hill into `target` (weighted), touching only
 * the bounding box the hill can actually reach.
 */
export function addHill(
	target: Float32Array,
	width: number,
	height: number,
	centerX: number,
	centerY: number,
	radius: number,
	noiseRadius: number,
	weight: number
): void {
	// The wobbled outline never extends past radius + noiseRadius.
	const maxRadius = radius + noiseRadius;
	const minX = Math.max(0, Math.floor(centerX - maxRadius));
	const maxX = Math.min(width - 1, Math.ceil(centerX + maxRadius));
	const minY = Math.max(0, Math.floor(centerY - maxRadius));
	const maxY = Math.min(height - 1, Math.ceil(centerY + maxRadius));

	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const dx = x - centerX;
			const dy = y - centerY;
			const dist = Math.sqrt(dx * dx + dy * dy);

			// Wobble the outline so hills aren't perfect circles.
			const angle = Math.atan2(dy, dx);
			const noise = Math.sin(angle * 8) * noiseRadius * 0.5 + Math.cos(angle * 5) * noiseRadius * 0.5;
			const effectiveRadius = radius + noise;
			if (dist >= effectiveRadius) continue;

			// t = 0 at edge, t = 1 at center.
			const t = 1 - dist / effectiveRadius;
			target[y * width + x] += smootherstep(Math.max(0, Math.min(1, t))) * weight;
		}
	}
}
