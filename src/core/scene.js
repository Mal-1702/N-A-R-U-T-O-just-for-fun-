/**
 * scene.js — Three.js Scene Setup
 *
 * Creates and exports a configured THREE.Scene with
 * a black background and subtle depth fog.
 */

import * as THREE from 'three';

/**
 * Creates a new Three.js scene.
 *
 * @returns {THREE.Scene} Configured scene instance
 */
export function createScene() {
    const scene = new THREE.Scene();

    // Pure black background
    scene.background = new THREE.Color(0x000000);

    // Subtle fog for depth fade — objects blend into darkness at distance
    // near: 5 units, far: 30 units
    scene.fog = new THREE.Fog(0x000000, 5, 30);

    return scene;
}

// ── Default Instance ───────────────────────────────────────
export const scene = createScene();
