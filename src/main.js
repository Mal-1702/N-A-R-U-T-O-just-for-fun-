/**
 * main.js — Application Entry Point
 *
 * Initializes the Three.js core (scene, camera, renderer),
 * attaches the renderer to the DOM, and starts the render loop.
 */

import { scene } from './core/scene.js';
import { camera } from './core/camera.js';
import { renderer } from './core/renderer.js';

// ── DOM Setup ──────────────────────────────────────────────
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#000';
document.body.appendChild(renderer.domElement);

// ── Responsive Resize ──────────────────────────────────────
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// ── Animation Loop ─────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ── Start ──────────────────────────────────────────────────
animate();
