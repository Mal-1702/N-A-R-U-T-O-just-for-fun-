/**
 * main.js — Application Entry Point
 *
 * Orchestrates the full Naruto VFX cinematic experience:
 *   - Rasengan (left) vs Chidori (right)
 *   - Ambient background energy particles
 *   - GSAP-driven overlay intro + camera cinematics
 *   - Dynamic camera orbit after user starts
 */

import * as THREE from 'three';
import gsap from 'gsap';

import { scene } from './core/scene.js';
import { camera } from './core/camera.js';
import { renderer } from './core/renderer.js';
import { createRasengan } from './effects/rasengan.js';
import { createChidori } from './effects/chidori.js';

import './style.css';

// ── State ──────────────────────────────────────────────────
const clock = new THREE.Clock();
let currentPage = 1;

// ── DOM ────────────────────────────────────────────────────
document.body.appendChild(renderer.domElement);

const overlay  = document.getElementById('overlay');
const titleEl  = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const startBtn = document.getElementById('start-btn');

// ── Effects ────────────────────────────────────────────────
const rasengan = createRasengan();
rasengan.particles.position.set(-2.5, 0, 0);
scene.add(rasengan.particles);

const chidori = createChidori();
chidori.particles.position.set(2.5, 0, 0);
scene.add(chidori.particles);

// ── Ambient Background Particles ───────────────────────────
const AMBIENT_COUNT = 1500;
const ambientGeo = new THREE.BufferGeometry();
const ambientPositions = new Float32Array(AMBIENT_COUNT * 3);
const ambientVelocities = new Float32Array(AMBIENT_COUNT * 3);

for (let i = 0; i < AMBIENT_COUNT; i++) {
    const i3 = i * 3;
    ambientPositions[i3]     = (Math.random() - 0.5) * 25;
    ambientPositions[i3 + 1] = (Math.random() - 0.5) * 18;
    ambientPositions[i3 + 2] = (Math.random() - 0.5) * 18;
    ambientVelocities[i3]     = (Math.random() - 0.5) * 0.003;
    ambientVelocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
    ambientVelocities[i3 + 2] = (Math.random() - 0.5) * 0.002;
}

ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));

const ambientMat = new THREE.PointsMaterial({
    color: 0x3355aa,
    size: 0.018,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
});

const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
scene.add(ambientParticles);

// ── Page/State Logic ───────────────────────────────────────

function updatePage() {
    if (currentPage === 1) {
        // Show intro UI only
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
            
            if (titleEl) gsap.from(titleEl,  { y: 40, opacity: 0, duration: 1.6, ease: 'power3.out', delay: 0.3 });
            if (subtitle) gsap.from(subtitle, { y: 25, opacity: 0, duration: 1.3, ease: 'power3.out', delay: 0.9 });
            if (startBtn) gsap.from(startBtn, { y: 15, opacity: 0, duration: 1.0, ease: 'power3.out', delay: 1.4 });
        }
        
        rasengan.particles.visible = false;
        chidori.particles.visible = false;
        ambientParticles.visible = false;

        camera.position.set(0, 0, 10);
    } 
    else if (currentPage === 2) {
        // Show Rasengan + Chidori particles
        if (overlay) {
            gsap.to(overlay, {
                opacity: 0,
                duration: 1.0,
                ease: 'power2.inOut',
                onComplete: () => { overlay.style.display = 'none'; },
            });
        }

        rasengan.particles.visible = true;
        chidori.particles.visible = true;
        ambientParticles.visible = true;

        if (chidori.setPhase) chidori.setPhase('compression');

        gsap.to(camera.position, {
            z: 5,
            duration: 3.5,
            ease: 'power2.inOut',
        });
    } 
    else if (currentPage === 3) {
        // Show Chidori zoom scene
        if (overlay) overlay.style.display = 'none';
        
        rasengan.particles.visible = false;
        chidori.particles.visible = true;
        ambientParticles.visible = true;

        // Animate Chidori to center
        gsap.to(chidori.particles.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: 2.0,
            ease: 'power3.inOut'
        });

        // Trigger blade phase
        if (chidori.setPhase) chidori.setPhase('blade');

        // Zoom camera in
        gsap.to(camera.position, {
            z: 2.5,
            duration: 2.5,
            ease: 'power3.inOut'
        });
    }
}

// Initialize first page
updatePage();

// ── Raycasting Setup ───────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// Increase intersection threshold since particles represent points, making them easier to click
raycaster.params.Points.threshold = 0.5;

// ── Event Listener: Interactions ───────────────────────────
window.addEventListener('click', (event) => {
    if (currentPage === 1) {
        // Click anywhere on intro to go to page 2 (clash)
        currentPage = 2;
        updatePage();
    } else if (currentPage === 2) {
        // Use raycasting to detect click specifically on Chidori
        // Convert mouse position to normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set the picking ray from the camera position and mouse coordinates
        raycaster.setFromCamera(mouse, camera);

        // Check for intersections against the Chidori particle boundary
        const intersects = raycaster.intersectObject(chidori.particles);

        // If clicked, transition to page 3 (zoom scene)
        if (intersects.length > 0) {
            currentPage = 3;
            updatePage();
        }
    }
});

// ── Dynamic Camera ─────────────────────────────────────────
function updateCamera(time) {
    if (currentPage === 1) return;

    // Smooth lerped orbit
    const targetX = Math.sin(time * 0.15) * 1.6;
    const targetY = Math.sin(time * 0.1) * 0.9;
    
    // Avoid fighting GSAP Z tween by only modifying X/Y orbit rotation
    camera.position.x += (targetX - camera.position.x) * 0.012;
    camera.position.y += (targetY - camera.position.y) * 0.012;

    camera.lookAt(0, 0, 0);
}

// ── Ambient Particle Drift ─────────────────────────────────
function updateAmbient() {
    if (currentPage === 1) return;

    const arr = ambientGeo.attributes.position.array;

    for (let i = 0; i < AMBIENT_COUNT; i++) {
        const i3 = i * 3;
        arr[i3]     += ambientVelocities[i3];
        arr[i3 + 1] += ambientVelocities[i3 + 1];
        arr[i3 + 2] += ambientVelocities[i3 + 2];

        if (Math.abs(arr[i3])     > 12.5) ambientVelocities[i3]     *= -1;
        if (Math.abs(arr[i3 + 1]) > 9)    ambientVelocities[i3 + 1] *= -1;
        if (Math.abs(arr[i3 + 2]) > 9)    ambientVelocities[i3 + 2] *= -1;
    }

    ambientGeo.attributes.position.needsUpdate = true;
}

// ── Resize ─────────────────────────────────────────────────
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

// ── Render Loop ────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    if (currentPage > 1) {
        if (rasengan.particles.visible) rasengan.update(time);
        if (chidori.particles.visible) chidori.update(time);
        updateAmbient();
        updateCamera(time);
    }

    renderer.render(scene, camera);
}

animate();
