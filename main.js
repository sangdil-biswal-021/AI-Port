import * as THREE from 'three';
import { initScene } from './scene.js';
import { initCamera, initKeyboardControls } from './camera.js';
import { AnimatedModel } from './loader.js';
import { InteractionManager } from './interactions.js';
import { animate } from './animate.js';

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Scene
const scene = initScene();

// Camera + Controls
const { camera, controls } = initCamera(renderer.domElement);

// Keyboard controls
initKeyboardControls();

// Interaction Manager
const interactionManager = new InteractionManager(camera, scene, renderer.domElement);

// Load models
const animatedModels = [];
animatedModels.push(new AnimatedModel('./model/scene.glb', scene));

// Clock
const clock = new THREE.Clock();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation loop
animate(renderer, scene, camera, controls, animatedModels, clock);
