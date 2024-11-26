import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const shadowScene = new THREE.Scene(); // Separate scene for shadow
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// EffectComposer for main dots
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3, // Subtle bloom for dots
    0.4,
    0.85
);
composer.addPass(bloomPass);

// EffectComposer for shadow blur
const shadowComposer = new EffectComposer(renderer);
shadowComposer.addPass(new RenderPass(shadowScene, camera));

const shadowBlurPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2, // Strength for shadow blur
    2.0, // Radius
    0.5  // Threshold
);
shadowComposer.addPass(shadowBlurPass);

// JSON Data and States
const states = ['company', 'homepage', 'partner', 'platform', 'solutions'];
const stateColors = {
    company: { colorA: 0x8faae2, colorB: 0xec5935, rotation: 45 },
    homepage: { colorA: 0x911c58, colorB: 0xec5935, rotation: 45 },
    partner: { colorA: 0x911c58, colorB: 0xf4b53f, rotation: 0 },
    platform: { colorA: 0x8faae2, colorB: 0xb1e088, rotation: -90 },
    solutions: { colorA: 0xec5935, colorB: 0xf4b53f, rotation: 90 },
};
let currentStateIndex = 0;
let frames = [];
let currentFrame = 0;

// Geometry and Materials
const totalSegments = 180;
const dotCount = 11;
const baseRadius = 100;
const maxAmplitude = 50;

// Create dots and shadow groups
const dots = new THREE.Group();
const shadow = new THREE.Group();
scene.add(dots);
shadowScene.add(shadow);

// Load JSON frames
async function loadFrames(state) {
    try {
        const response = await fetch(`${state}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${state}.json: ${response.statusText}`);
        }
        frames = await response.json();
    } catch (error) {
        console.error('Error loading frames:', error);
    }
}

// Compute Gradient Colors (Color A → Color B → Color A)
function getGradientColor(segmentIndex, totalSegments, colorA, colorB) {
    const halfSegments = totalSegments / 2;
    const ratio = segmentIndex <= halfSegments
        ? segmentIndex / halfSegments // From A to B
        : (segmentIndex - halfSegments) / halfSegments; // From B back to A

    const startColor = segmentIndex <= halfSegments ? colorA : colorB;
    const endColor = segmentIndex <= halfSegments ? colorB : colorA;

    const start = new THREE.Color(startColor);
    const end = new THREE.Color(endColor);

    return start.lerp(end, ratio);
}

// Initialize Dots and Shadow for the State
function initializeDots(state) {
    dots.clear();
    shadow.clear();

    const { colorA, colorB } = stateColors[state];

    for (let i = 0; i < totalSegments; i++) {
        const angle = (i / totalSegments) * Math.PI * 2;

        const segmentGroup = new THREE.Group();
        const shadowGroup = new THREE.Group();

        const color = getGradientColor(i, totalSegments, colorA, colorB);

        for (let j = 0; j < dotCount; j++) {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(1, 16, 16),
                new THREE.MeshBasicMaterial({ color })
            );
            const shadowDot = dot.clone();

            const distance = baseRadius + j * 10;
            dot.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance, 0);
            shadowDot.position.copy(dot.position);

            segmentGroup.add(dot);
            shadowGroup.add(shadowDot);
        }

        dots.add(segmentGroup);
        shadow.add(shadowGroup);
    }

    shadow.scale.set(1, -0.75, 1);
    shadow.position.y = -250;
}

// Apply Rotation
function applyRotation(state) {
    const rotation = stateColors[state].rotation;
    dots.rotation.z = THREE.MathUtils.degToRad(rotation); // Rotate only the main circle
    shadow.rotation.z = 0; // Keep shadow unrotated
}

// Update Dots and Shadow Colors
function updateColors(state) {
    const { colorA, colorB } = stateColors[state];
    dots.children.forEach((segmentGroup, i) => {
        const color = getGradientColor(i, totalSegments, colorA, colorB);
        segmentGroup.children.forEach((dot) => {
            dot.material.color.copy(color);
        });
    });
    shadow.children.forEach((segmentGroup, i) => {
        const color = getGradientColor(i, totalSegments, colorA, colorB);
        segmentGroup.children.forEach((shadowDot) => {
            shadowDot.material.color.copy(color);
        });
    });
}

// State Change Handler
async function changeState(newState) {
    currentStateIndex = states.indexOf(newState);
    await loadFrames(states[currentStateIndex]);
    initializeDots(newState);
    applyRotation(newState);
    updateColors(newState);
}

// Animate the Scene
function animate() {
    requestAnimationFrame(animate);

    if (frames.length > 0) {
        const amplitudes = frames[currentFrame] || [];
        currentFrame = (currentFrame + 1) % frames.length;

        dots.children.forEach((segmentGroup, i) => {
            const amplitude = amplitudes[i] || 0;
            segmentGroup.children.forEach((dot, j) => {
                const distance = baseRadius + j * 10 + amplitude * maxAmplitude;
                const angle = (i / totalSegments) * Math.PI * 2;

                dot.position.set(
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance,
                    0
                );
            });
        });

        shadow.children.forEach((segmentGroup, i) => {
            const amplitude = amplitudes[i] || 0;
            segmentGroup.children.forEach((dot, j) => {
                const distance = baseRadius + j * 10 + amplitude * maxAmplitude;
                const angle = (i / totalSegments) * Math.PI * 2;

                dot.position.set(
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance * -0.75,
                    0
                );
            });
        });
    }

    shadowComposer.render(); // Render the shadow
    composer.render();       // Render the main scene
}

// State Change
document.getElementById('next-btn').addEventListener('click', async () => {
    const nextIndex = (currentStateIndex + 1) % states.length;
    await changeState(states[nextIndex]);
});

document.getElementById('prev-btn').addEventListener('click', async () => {
    const prevIndex = (currentStateIndex - 1 + states.length) % states.length;
    await changeState(states[prevIndex]);
});

// Initialize
(async () => {
    await loadFrames(states[currentStateIndex]);
    initializeDots(states[currentStateIndex]);
    animate();
})();
