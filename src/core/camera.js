/**
 * camera.js — Perspective Camera Setup
 *
 * Creates and exports a Three.js PerspectiveCamera
 * configured for the cinematic VFX scene.
 */

import * as THREE from 'three';

/**
 * Creates a new PerspectiveCamera.
 *
 * @param {number} fov    — Field of view in degrees
 * @param {number} near   — Near clipping plane
 * @param {number} far    — Far clipping plane
 * @returns {THREE.PerspectiveCamera}
 */
export function createCamera(fov = 60, near = 0.1, far = 100) {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 8);
    return camera;
}

// ── Default Instance ───────────────────────────────────────
export const camera = createCamera();
