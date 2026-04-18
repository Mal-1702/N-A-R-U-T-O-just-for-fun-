/**
 * noise.js — Lightweight Procedural Noise Utilities
 *
 * Provides simple noise functions for organic particle motion.
 * Not a full Perlin/Simplex implementation — just enough for
 * smooth, natural-looking animation.
 */

/**
 * Hash-based 2D pseudo-noise.
 * Returns a value in [0, 1].
 */
export function noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * Smooth sine-based 3D noise.
 * Returns a value in roughly [-0.5, 0.5].
 * Good for organic drift and turbulence.
 */
export function smoothNoise3D(x, y, z) {
    return (
        Math.sin(x * 1.3 + z * 0.7) *
        Math.cos(y * 1.7 + z * 0.5) *
        0.5
    );
}

/**
 * Fractal Brownian Motion (layered noise).
 * Returns a value in roughly [-1, 1].
 *
 * @param {number} x
 * @param {number} y
 * @param {number} octaves — Number of noise layers
 */
export function fbm(x, y, octaves = 3) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
        value += amplitude * (noise2D(x * frequency, y * frequency) * 2 - 1);
        amplitude *= 0.5;
        frequency *= 2;
    }

    return value;
}
