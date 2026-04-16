/**
 * rasengan.js — Procedural Rasengan Particle Effect
 *
 * Generates a dense, rotating, glowing energy sphere using
 * a high-performance BufferGeometry particle system.
 * The effect simulates vortex rotation, inward compression,
 * turbulence, and sinusoidal pulsation.
 */

import * as THREE from 'three';

// ── Constants ──────────────────────────────────────────────
const PARTICLE_COUNT = 4500;
const SPHERE_RADIUS = 1.0;
const PARTICLE_SIZE = 0.035;
const SWIRL_SPEED = 1.8;
const INWARD_FACTOR = 0.993;
const TURBULENCE_INTENSITY = 0.003;
const PULSE_AMPLITUDE = 0.08;
const PULSE_FREQUENCY = 3.0;
const MIN_RADIUS = 0.05;

/**
 * Creates a Rasengan particle system.
 *
 * @returns {{ particles: THREE.Points, update: (time: number) => void }}
 */
export function createRasengan() {

    // ── Geometry ───────────────────────────────────────────
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    // Store base radii so we can reset particles that collapse too far
    const baseRadii = new Float32Array(PARTICLE_COUNT);

    // Random spherical distribution
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Uniform volume distribution via cube-root scaling
        const r = SPHERE_RADIUS * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;       // azimuthal
        const phi = Math.acos(2 * Math.random() - 1);    // polar

        positions[i3]     = r * Math.sin(phi) * Math.cos(theta); // x
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
        positions[i3 + 2] = r * Math.cos(phi);                   // z

        baseRadii[i] = r;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // ── Material ───────────────────────────────────────────
    const material = new THREE.PointsMaterial({
        color: 0x00aaff,
        size: PARTICLE_SIZE,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    // ── Mesh ───────────────────────────────────────────────
    const particles = new THREE.Points(geometry, material);

    // ── Update Function ────────────────────────────────────
    /**
     * Advances the Rasengan animation by one frame.
     * Applies swirl rotation, inward pull, turbulence, and pulsation.
     *
     * @param {number} time — elapsed time in seconds (e.g. clock.getElapsedTime())
     */
    function update(time) {
        const posAttr = geometry.attributes.position;
        const arr = posAttr.array;

        // Pre-compute swirl angle for this frame
        const angle = SWIRL_SPEED * 0.016; // ~per-frame rotation at 60 fps
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Pulsation scale factor
        const pulse = 1.0 + PULSE_AMPLITUDE * Math.sin(time * PULSE_FREQUENCY);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;

            let x = arr[i3];
            let y = arr[i3 + 1];
            let z = arr[i3 + 2];

            // ── A. Swirl Rotation (XY plane) ───────────────
            const xRot = x * cosA - y * sinA;
            const yRot = x * sinA + y * cosA;
            x = xRot;
            y = yRot;

            // ── B. Inward Energy Pull ──────────────────────
            x *= INWARD_FACTOR;
            y *= INWARD_FACTOR;
            z *= INWARD_FACTOR;

            // ── C. Turbulence ──────────────────────────────
            x += (Math.random() - 0.5) * TURBULENCE_INTENSITY;
            y += (Math.random() - 0.5) * TURBULENCE_INTENSITY;
            z += (Math.random() - 0.5) * TURBULENCE_INTENSITY;

            // ── D. Pulsation ───────────────────────────────
            x *= pulse;
            y *= pulse;
            z *= pulse;

            // ── Respawn collapsed particles ────────────────
            // If a particle falls below the minimum radius,
            // re-emit it at its original shell distance
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist < MIN_RADIUS) {
                const r = baseRadii[i] * (0.7 + Math.random() * 0.3);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
            }

            arr[i3]     = x;
            arr[i3 + 1] = y;
            arr[i3 + 2] = z;
        }

        posAttr.needsUpdate = true;
    }

    // ── Public API ─────────────────────────────────────────
    return { particles, update };
}


// ═══════════════════════════════════════════════════════════
// TESTING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════
//
// To test this effect inside src/main.js:
//
// 1. Import:
//    import { createRasengan } from './effects/rasengan.js';
//
// 2. Initialize (after scene/camera/renderer setup):
//    const rasengan = createRasengan();
//
// 3. Add to scene:
//    scene.add(rasengan.particles);
//
// 4. Inside the animation loop, pass elapsed time:
//    const clock = new THREE.Clock();
//
//    function animate() {
//        requestAnimationFrame(animate);
//        const time = clock.getElapsedTime();
//        rasengan.update(time);
//        renderer.render(scene, camera);
//    }
//    animate();
//
// 5. Expected Output:
//    - A glowing cyan-blue rotating particle sphere
//    - Continuous inward spiraling motion
//    - Smooth vortex-like animation with subtle turbulence
//    - Particles respawn when they collapse to the core,
//      maintaining consistent density
//
// ═══════════════════════════════════════════════════════════
