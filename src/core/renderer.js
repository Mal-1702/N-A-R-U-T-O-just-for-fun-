/**
 * renderer.js — WebGL Renderer Setup
 *
 * Creates and exports a Three.js WebGLRenderer with
 * cinematic rendering settings.
 */

import * as THREE from 'three';

/**
 * Creates a new WebGLRenderer.
 *
 * @returns {THREE.WebGLRenderer}
 */
export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.setClearColor(0x000000, 1);

    return renderer;
}

// ── Default Instance ───────────────────────────────────────
export const renderer = createRenderer();
