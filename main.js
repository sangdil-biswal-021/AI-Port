import * as THREE from 'three';
import { initScene, setupHDRI } from './scene.js';
import { initCamera, initKeyboardControls } from './camera.js';
import { AnimatedModel } from './loader.js';
import { InteractionManager } from './interactions.js';
import { animate } from './animate.js';

async function init() {
  // Get a reference to the loading screen
  const loadingScreen = document.getElementById('loading-screen');

  // Renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Scene
  const scene = initScene();

  // Camera + Controls
  const { camera, controls } = initCamera(renderer.domElement);
  
  // Await the HDRI setup
  await setupHDRI(renderer, scene);
  
  // Now that the environment is ready, load the models
  const animatedModels = [];
  
  // --- FIX: Pass the callback function to the AnimatedModel constructor ---
  animatedModels.push(new AnimatedModel('./model/scene.glb', scene, () => {
    // This code will now run AFTER the model has loaded successfully
    console.log("Model loaded. Fading out loading screen.");
    loadingScreen.classList.add('hidden');
  }));

  // Keyboard controls
  initKeyboardControls();

  // Interaction Manager
  const interactionManager = new InteractionManager(camera, scene, renderer.domElement, controls, animatedModels);

  // Clock
  const clock = new THREE.Clock();

  // Resize Listener
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start the continuous animation loop
  animate(renderer, scene, camera, controls, animatedModels, clock, interactionManager);
}

// Call the init function to start the app
init();