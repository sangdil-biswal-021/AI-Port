import * as THREE from 'three';
import { initScene, setupHDRI } from './scene.js';
import { initCamera, initKeyboardControls } from './camera.js';
import { AnimatedModel } from './loader.js';
import { InteractionManager } from './interactions.js';
import { animate } from './animate.js';

// --- Data for our scenes ---
const scenesData = [
  { name: 'The Port', path: './model/scene.glb', loopFrames: 900 },
  { name: 'Vehicle Management', path: './model/scene2.glb', loopFrames: 900 },
  { name: 'Predictive Maintenance', path: './model/scene3.glb', loopFrames: 600 },
];
let currentSceneIndex = 0;
let currentAnimatedModel = null;

async function init() {
  // --- UI Element References ---
  const loadingScreen = document.getElementById('loading-screen');
  const sceneTitle = document.getElementById('scene-title');
  const prevSceneBtn = document.getElementById('prev-scene-btn');
  const nextSceneBtn = document.getElementById('next-scene-btn');
  
  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Scene
  const scene = new THREE.Scene();
  
  // Camera + Controls
  const { camera, controls } = initCamera(renderer.domElement);
  
  // Setup HDRI once
  await setupHDRI(renderer, scene);
  
  // Keyboard controls & Clock
  initKeyboardControls();
  const clock = new THREE.Clock();

   // Pass the scene index getter to the InteractionManager
  const interactionManager = new InteractionManager(camera, scene, renderer.domElement, controls, [], () => currentSceneIndex);

  // --- Core Scene Loading Function ---
  const loadScene = async (index) => {
    // 1. Show loading screen
    loadingScreen.classList.remove('hidden');
    
    // 2. Clean up the previous model if it exists
    if (currentAnimatedModel) {
      currentAnimatedModel.dispose();
    }

    // 3. Update state and UI
    currentSceneIndex = index;
    sceneTitle.textContent = scenesData[index].name;
    
    // 4. Load the new model, wrapped in a Promise to await its completion
    await new Promise(resolve => {
      currentAnimatedModel = new AnimatedModel(
        scenesData[index].path,
        scene,
        () => resolve(),
        scenesData[index].loopFrames // The onLoad callback resolves the promise
      );
    });
    
    // 5. Update the Interaction Manager with the new model
    interactionManager.animatedModels = [currentAnimatedModel];
    
    console.log(`Scene '${scenesData[index].name}' loaded successfully.`);
    
    // 6. Hide loading screen
    loadingScreen.classList.add('hidden');
  };

  // --- Event Listeners for Arrow Buttons ---
  prevSceneBtn.addEventListener('click', () => {
    const newIndex = (currentSceneIndex - 1 + scenesData.length) % scenesData.length;
    loadScene(newIndex);
  });

  nextSceneBtn.addEventListener('click', () => {
    const newIndex = (currentSceneIndex + 1) % scenesData.length;
    loadScene(newIndex);
  });

  // Resize Listener
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start the continuous animation loop
  // Pass a function to get the current model, as it will change
  animate(renderer, scene, camera, controls, () => [currentAnimatedModel], clock, interactionManager);

  // --- Initial Load ---
  loadScene(0);
}

// Start the application
init();