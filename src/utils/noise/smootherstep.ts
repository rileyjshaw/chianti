export function smootherstep(t: number): number {
	return t * t * t * (t * (6 * t - 15) + 10);
}
