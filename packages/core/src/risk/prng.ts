/**
 * Deterministic pseudo-random number generation for the Monte Carlo pass
 * (`docs/05_architecture_data.md` §8, `docs/03_estimation_model.md` §8).
 *
 * The simulation must be reproducible from a fixed seed, so it never touches
 * `Math.random()` or the wall clock. `mulberry32` is a small, fast 32-bit
 * generator with a full 2^32 period; `normalPair` converts two uniforms into two
 * independent standard normal deviates with the Box–Muller transform.
 */

/**
 * Creates a mulberry32 generator seeded with `seed`.
 *
 * Returns a function that yields a float in `[0, 1)` on every call and advances
 * an internal 32-bit state. Two generators built from the same seed produce the
 * same sequence.
 */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws a pair of independent standard normal deviates via Box–Muller.
 *
 * Consumes two uniforms from `rng`. `1 - u1` keeps the logarithm argument in
 * `(0, 1]`, so the draw never evaluates `Math.log(0)`.
 */
export function normalPair(rng: () => number): [number, number] {
  const u1 = rng();
  const u2 = rng();
  const radius = Math.sqrt(-2 * Math.log(1 - u1));
  const angle = 2 * Math.PI * u2;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
