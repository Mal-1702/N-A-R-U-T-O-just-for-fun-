/**
 * rasengan.js — Multi-Layer Rasengan Particle Effect
 *
 * Three concentric particle layers simulate a dense,
 * rotating, glowing energy sphere:
 *   1. Core  — tight, bright white-cyan center
 *   2. Shell — swirling medium-density vortex
 *   3. Glow  — sparse, large, faint outer halo
 *
 * Each layer has independent rotation speed, compression,
 * turbulence, and respawn logic.
 */

import * as THREE from 'three';
import { createGlowTexture, randomSpherePoint } from '../utils/particle.js';

// ── Layer Configuration ────────────────────────────────────
const LAYERS = [
    {
        name: 'core',
        count: 2000,
        radius: 0.3,
        color: 0xccffff,
        size: 0.025,
        opacity: 0.95,
        swirlSpeed: 3.5,
        inward: 0.988,
        turbulence: 0.002,
        minR: 0.015,
    },
    {
        name: 'shell',
        count: 3000,
        radius: 0.8,
        color: 0x00aaff,
        size: 0.04,
        opacity: 0.7,
        swirlSpeed: 1.8,
        inward: 0.993,
        turbulence: 0.003,
        minR: 0.04,
    },
    {
        name: 'glow',
        count: 600,
        radius: 1.3,
        color: 0x0066ff,
        size: 0.14,
        opacity: 0.2,
        swirlSpeed: 0.6,
        inward: 0.997,
        turbulence: 0.004,
        minR: 0.08,
    },
];

// ── Shared Constants ───────────────────────────────────────
const PULSE_AMPLITUDE = 0.07;
const PULSE_FREQUENCY = 3.0;

/**
 * Creates a Rasengan particle effect.
 *
 * @returns {{ particles: THREE.Group, update: (time: number) => void }}
 */
export function createRasengan() {
    const group = new THREE.Group();
    const glowTex = createGlowTexture();
    const layerData = [];

    // ── Build Each Layer ───────────────────────────────────
    for (const cfg of LAYERS) {
        const positions = new Float32Array(cfg.count * 3);
        const baseRadii = new Float32Array(cfg.count);

        for (let i = 0; i < cfg.count; i++) {
            const p = randomSpherePoint(cfg.radius);
            const i3 = i * 3;
            positions[i3]     = p.x;
            positions[i3 + 1] = p.y;
            positions[i3 + 2] = p.z;
            baseRadii[i]      = p.r;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: cfg.color,
            size: cfg.size,
            map: glowTex,
            transparent: true,
            opacity: cfg.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        group.add(points);

        layerData.push({
            geometry,
            baseRadii,
            count: cfg.count,
            radius: cfg.radius,
            swirlSpeed: cfg.swirlSpeed,
            inward: cfg.inward,
            turbulence: cfg.turbulence,
            minR: cfg.minR,
        });
    }

    // ── Update Function ────────────────────────────────────
    function update(time) {
        const pulse = 1.0 + PULSE_AMPLITUDE * Math.sin(time * PULSE_FREQUENCY);

        for (const layer of layerData) {
            const arr = layer.geometry.attributes.position.array;
            const angle = layer.swirlSpeed * 0.016;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            for (let i = 0; i < layer.count; i++) {
                const i3 = i * 3;
                let x = arr[i3];
                let y = arr[i3 + 1];
                let z = arr[i3 + 2];

                // Swirl (XY plane)
                const xr = x * cosA - y * sinA;
                const yr = x * sinA + y * cosA;
                x = xr;
                y = yr;

                // Inward pull
                x *= layer.inward;
                y *= layer.inward;
                z *= layer.inward;

                // Turbulence
                const t = layer.turbulence;
                x += (Math.random() - 0.5) * t;
                y += (Math.random() - 0.5) * t;
                z += (Math.random() - 0.5) * t;

                // Pulsation
                x *= pulse;
                y *= pulse;
                z *= pulse;

                // Respawn collapsed particles
                const dist = Math.sqrt(x * x + y * y + z * z);
                if (dist < layer.minR) {
                    const r = layer.baseRadii[i] * (0.6 + Math.random() * 0.4);
                    const th = Math.random() * Math.PI * 2;
                    const ph = Math.acos(2 * Math.random() - 1);
                    x = r * Math.sin(ph) * Math.cos(th);
                    y = r * Math.sin(ph) * Math.sin(th);
                    z = r * Math.cos(ph);
                }

                arr[i3]     = x;
                arr[i3 + 1] = y;
                arr[i3 + 2] = z;
            }

            layer.geometry.attributes.position.needsUpdate = true;
        }
    }

    return { particles: group, update };
}
