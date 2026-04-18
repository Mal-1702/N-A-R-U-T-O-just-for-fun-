/**
 * particle.js — Particle System Utilities
 *
 * Shared helpers for creating particle effects.
 * Used by both Rasengan and Chidori modules.
 */

import * as THREE from 'three';

/**
 * Creates a soft radial-gradient glow texture via canvas.
 * This replaces the default square point sprite with a
 * smooth, gaussian-like circle that fakes bloom.
 *
 * @param {number} size — Texture resolution (px)
 * @returns {THREE.CanvasTexture}
 */
export function createGlowTexture(size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);

    gradient.addColorStop(0.0,  'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.12, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1.0,  'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Returns a random point INSIDE a sphere (uniform volume distribution).
 * Uses cube-root scaling so particles don't cluster at center.
 *
 * @param {number} radius
 * @returns {{ x: number, y: number, z: number, r: number }}
 */
export function randomSpherePoint(radius = 1) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        r,
    };
}

/**
 * Returns a random point ON the surface of a sphere.
 *
 * @param {number} radius
 * @returns {{ x: number, y: number, z: number }}
 */
export function randomSphereSurface(radius = 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
    };
}
