/**
 * Deterministic pseudo-random number generation.
 *
 * All scene generation flows through a seeded PRNG so that a given
 * (config, seed) pair always produces the same landscape, and bumping the
 * seed regenerates everything (hills, noise, plant distribution) at once.
 */

/** Returns a float in [0, 1), like Math.random(). */
export type Rng = () => number;

/** Small, fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function randomRange(rng: Rng, min: number, max: number): number {
	return min + rng() * (max - min);
}
