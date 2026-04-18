/**
 * chidori.js — Cinematic Chidori Blade Formation Effect
 *
 * Simulates a full transformation sequence:
 *   Particle cloud → Compressed energy → Neon lightning blade
 *
 * Three internal phases drive the behavior:
 *   1. "cluster"     — particles loosely distributed with slow random drift
 *   2. "compression" — particles contract toward the center, density increases
 *   3. "blade"       — particles align into a vertical lightning blade shape
 *
 * The final blade form features aggressive per-frame jitter for a
 * crackling lightning aesthetic with a tapered silhouette (sharp top,
 * wider base).
 */

import * as THREE from 'three';
import { createGlowTexture, randomSpherePoint } from '../utils/particle.js';

// ── Constants ──────────────────────────────────────────────
const PARTICLE_COUNT = 3200;
const CLUSTER_RADIUS = 1.2;

// Blade geometry constants
const BLADE_HEIGHT    = 3.0;   // total Y extent
const BLADE_WIDTH_MAX = 0.18;  // widest XZ spread (at base)
const BLADE_WIDTH_MIN = 0.02;  // narrowest XZ spread (at tip)

// Phase transition speed (lerp factor per frame)
const LERP_SPEED = 0.035;

// Lightning jitter intensities
const CLUSTER_JITTER     = 0.006;
const COMPRESSION_JITTER = 0.004;
const BLADE_JITTER       = 0.045;  // aggressive for crackling feel

/**
 * Creates a cinematic Chidori particle effect with phase-based
 * transformation from particle cloud to lightning blade.
 *
 * @returns {{
 *   particles: THREE.Points,
 *   update:    (time: number) => void,
 *   setPhase:  (mode: 'cluster' | 'compression' | 'blade') => void,
 * }}
 */
export function createChidori() {
    const glowTex = createGlowTexture();

    // ════════════════════════════════════════════════════════
    // GEOMETRY & BUFFERS
    // ════════════════════════════════════════════════════════

    const geometry  = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    // Pre-computed target positions for each phase (never reallocated)
    const clusterTargets     = new Float32Array(PARTICLE_COUNT * 3);
    const compressionTargets = new Float32Array(PARTICLE_COUNT * 3);
    const bladeTargets       = new Float32Array(PARTICLE_COUNT * 3);

    // Per-particle random seeds for deterministic jitter variation
    const seeds = new Float32Array(PARTICLE_COUNT);

    // ── Initialise cluster positions (random sphere) ───────
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const p  = randomSpherePoint(CLUSTER_RADIUS);

        positions[i3]     = p.x;
        positions[i3 + 1] = p.y;
        positions[i3 + 2] = p.z;

        // Cluster target = same initial position
        clusterTargets[i3]     = p.x;
        clusterTargets[i3 + 1] = p.y;
        clusterTargets[i3 + 2] = p.z;

        seeds[i] = Math.random() * Math.PI * 2;
    }

    // ── Pre-compute compression targets (tight core) ───────
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const p  = randomSpherePoint(CLUSTER_RADIUS * 0.12);

        compressionTargets[i3]     = p.x;
        compressionTargets[i3 + 1] = p.y;
        compressionTargets[i3 + 2] = p.z;
    }

    // ── Pre-compute blade targets (tapered vertical shape) ─
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Normalised height [0..1] — 0 = bottom, 1 = tip
        const t = i / PARTICLE_COUNT;

        // Y: distribute along blade height, centered at origin
        const y = -BLADE_HEIGHT * 0.35 + t * BLADE_HEIGHT;

        // Width tapers: wider at bottom (t≈0), sharp at top (t≈1)
        // Use quadratic falloff for a convincing blade silhouette
        const widthAtT = BLADE_WIDTH_MAX * (1.0 - t * t) + BLADE_WIDTH_MIN;

        // Random offset within the width envelope
        const angle  = Math.random() * Math.PI * 2;
        const radius = Math.random() * widthAtT;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        bladeTargets[i3]     = x;
        bladeTargets[i3 + 1] = y;
        bladeTargets[i3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // ════════════════════════════════════════════════════════
    // MATERIAL
    // ════════════════════════════════════════════════════════

    const material = new THREE.PointsMaterial({
        color: 0xccddff,
        size: 0.04,
        map: glowTex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);

    // ════════════════════════════════════════════════════════
    // PHASE STATE
    // ════════════════════════════════════════════════════════

    let currentPhase = 'cluster';
    let activeTargets = clusterTargets;

    /**
     * Switch the transformation phase.
     * @param {'cluster' | 'compression' | 'blade'} mode
     */
    function setPhase(mode) {
        currentPhase = mode;

        switch (mode) {
            case 'cluster':
                activeTargets = clusterTargets;
                material.color.setHex(0xccddff);
                material.size    = 0.04;
                material.opacity = 0.9;
                break;

            case 'compression':
                activeTargets = compressionTargets;
                material.color.setHex(0xaaccff);
                material.size    = 0.035;
                material.opacity = 0.92;
                break;

            case 'blade':
                activeTargets = bladeTargets;
                material.color.setHex(0xeeffff);
                material.size    = 0.032;
                material.opacity = 0.96;
                break;

            default:
                console.warn(`[Chidori] Unknown phase: "${mode}"`);
        }
    }

    // ════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ════════════════════════════════════════════════════════

    /**
     * Per-frame update. Lerps particles toward current phase
     * targets and applies phase-appropriate jitter.
     *
     * @param {number} time — elapsed time in seconds
     */
    function update(time) {
        const arr = geometry.attributes.position.array;

        // Select jitter intensity based on phase
        let jitterAmt;
        switch (currentPhase) {
            case 'cluster':
                jitterAmt = CLUSTER_JITTER;
                break;
            case 'compression':
                jitterAmt = COMPRESSION_JITTER + 0.008 * Math.sin(time * 8);
                break;
            case 'blade':
                jitterAmt = BLADE_JITTER;
                break;
            default:
                jitterAmt = CLUSTER_JITTER;
        }

        // Dynamic lerp: faster when further from target
        const baseLerp = LERP_SPEED;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const seed = seeds[i];

            // ── Target positions ───────────────────────────
            let tx = activeTargets[i3];
            let ty = activeTargets[i3 + 1];
            let tz = activeTargets[i3 + 2];

            // ── Phase-specific behaviour modifiers ─────────
            if (currentPhase === 'cluster') {
                // Slow organic drift around rest position
                const drift = 0.15;
                tx += Math.sin(time * 0.4 + seed)           * drift;
                ty += Math.cos(time * 0.35 + seed * 1.3)    * drift;
                tz += Math.sin(time * 0.45 + seed * 0.7)    * drift;
            }

            if (currentPhase === 'compression') {
                // Pulsing compression — breathes slightly
                const pulse = 1.0 + 0.15 * Math.sin(time * 5 + seed);
                tx *= pulse;
                ty *= pulse;
                tz *= pulse;
            }

            if (currentPhase === 'blade') {
                // Aggressive high-frequency lightning offsets
                // X/Z get chaotic jitter, Y stays mostly stable
                const freq  = 18.0;
                const phase = seed + time * freq;

                tx += Math.sin(phase)           * jitterAmt * 1.2;
                tz += Math.cos(phase * 1.37)    * jitterAmt * 1.2;
                ty += Math.sin(phase * 0.5)     * jitterAmt * 0.25;

                // Additional per-frame random crackle
                tx += (Math.random() - 0.5) * jitterAmt * 0.8;
                tz += (Math.random() - 0.5) * jitterAmt * 0.8;
            }

            // ── Lerp toward target ─────────────────────────
            const dx = tx - arr[i3];
            const dy = ty - arr[i3 + 1];
            const dz = tz - arr[i3 + 2];

            // Adaptive lerp: accelerate when distance is large
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const lerp = Math.min(baseLerp + dist * 0.02, 0.12);

            arr[i3]     += dx * lerp;
            arr[i3 + 1] += dy * lerp;
            arr[i3 + 2] += dz * lerp;

            // ── Base jitter (always present, scaled by phase) ──
            arr[i3]     += (Math.random() - 0.5) * jitterAmt;
            arr[i3 + 1] += (Math.random() - 0.5) * jitterAmt * 0.5;
            arr[i3 + 2] += (Math.random() - 0.5) * jitterAmt;
        }

        // ── Blade-mode emissive brightness boost ───────────
        if (currentPhase === 'blade') {
            // Flickering brightness for lightning crackle
            const flicker = 0.88 + 0.12 * Math.sin(time * 30);
            material.opacity = flicker;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    // ════════════════════════════════════════════════════════
    // RETURN PUBLIC API
    // ════════════════════════════════════════════════════════

    return { particles, update, setPhase };
}

// ──────────────────────────────────────────────────────────────
// TESTING INSTRUCTIONS
// ──────────────────────────────────────────────────────────────
//
// 1. Import:
//    import { createChidori } from './effects/chidori.js';
//
// 2. Initialize:
//    const chidori = createChidori();
//
// 3. Add to scene:
//    scene.add(chidori.particles);
//
// 4. In animation loop:
//    chidori.update(time);
//
// 5. Trigger phases manually:
//    chidori.setPhase("cluster");       // loose particle cloud
//    chidori.setPhase("compression");   // particles contract to core
//    chidori.setPhase("blade");         // vertical lightning blade
//
// Expected Output:
//   - Starts as a glowing particle cloud
//   - "compression" pulls everything into a dense core
//   - "blade" stretches particles into a vertical lightning blade
//     with aggressive crackling jitter and brightness flicker
//
// Performance:
//   - No allocations inside update loop
//   - All targets pre-computed at creation time
//   - Uses existing Float32Array buffers exclusively
// ──────────────────────────────────────────────────────────────
