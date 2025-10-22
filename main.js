import * as THREE from "three";
import { initScene, setupHDRI } from "./scene.js";
import { initCamera, initKeyboardControls } from "./camera.js";
import { AnimatedModel } from "./loader.js";
import { InteractionManager } from "./interactions.js";
import { animate } from "./animate.js";

// --- Data for our scenes (Updated with 'hdri' property) ---
const scenesData = [
  {
    name: "The Port",
    path: "./model/scene.glb",
    loopFrames: 900,
    hdri: "default",
    cameraPos: { x: 6, y: 80, z: 60 },
    exposure: 1.0
    
  },
  {
    name: "Vehicle Management",
    path: "./model/scene2.glb",
    loopFrames: 900,
    hdri: "default",
    cameraPos: { x: 6, y: 80, z: 60 },
    exposure: 1.0
  },
  {
    name: "Predictive Maintenance",
    path: "./model/scene3.glb",
    loopFrames: 600,
    hdri: "default",
    cameraPos: { x: 6, y: 80, z: 60 },
    exposure: 1.0
  },
  {
    name: "Smart Energy Management",
    path: "./model/scene4.glb",
    loopFrames: 600,
    hdri: "qwantani_moon_noon_puresky_1k.hdr",
    cameraPos: { x: 150, y: 100, z: 150 },
     exposure: 0.3 
  },
];
let currentSceneIndex = 0;
let currentAnimatedModel = null;

// --- NEW: Variables to manage camera state ---
let defaultCamera = null;
let sceneCamera = null; // Will hold the camera from the GLB
let activeCamera = null;

async function init() {
  // --- UI Element References (Unchanged) ---
  const loadingScreen = document.getElementById("loading-screen");
  const sceneTitle = document.getElementById("scene-title");
  const prevSceneBtn = document.getElementById("prev-scene-btn");
  const nextSceneBtn = document.getElementById("next-scene-btn");

  // Renderer (Unchanged)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Scene (Unchanged)
  const scene = new THREE.Scene();

   // --- UPDATED: Store the default camera ---
  const { camera, controls } = initCamera(renderer.domElement);
  defaultCamera = camera;
  activeCamera = defaultCamera; // Start with the default camera

  // Keyboard controls & Clock (Unchanged)
  initKeyboardControls();
  const clock = new THREE.Clock();

  // InteractionManager (Unchanged - correctly uses renderer.domElement)
  const interactionManager = new InteractionManager(
    camera,
    scene,
    renderer.domElement,
    controls,
    [],
    () => currentSceneIndex
  );

  // --- Core Scene Loading Function (Updated with HDRI and Overlay logic) ---
  const loadScene = async (index) => {
    loadingScreen.classList.remove("hidden");

    if (currentAnimatedModel) {
      currentAnimatedModel.dispose();
    }
    // Also reset any active interactions from the previous scene
    interactionManager.unfocusObject();
    interactionManager.stopTrackingObject();

    // --- NEW: Reset camera state on scene change ---
    activeCamera = defaultCamera; // Always switch back to default when changing scenes
    controls.enabled = true;
    sceneCamera = null; // Clear the reference to the old scene's camera

    currentSceneIndex = index;
    const sceneData = scenesData[index];
    sceneTitle.textContent = sceneData.name;

    
    // --- NEW: Set camera position for the new scene ---
    camera.position.set(sceneData.cameraPos.x, sceneData.cameraPos.y, sceneData.cameraPos.z);
    controls.target.set(0, 0, 0); // Reset orbit target to the center

    // NEW: Load the correct HDRI for the new scene
    await setupHDRI(renderer, scene, sceneData.hdri, sceneData.exposure);

    await new Promise((resolve) => {
      currentAnimatedModel = new AnimatedModel(
        sceneData.path,
        scene,
        () => resolve(),
        sceneData.loopFrames
      );
    });

    const cameraNameInCode = 'Fixed_Shot_Cam_Orientation';
    console.log(`Searching for camera named: "${cameraNameInCode}"`);

     // --- NEW: After loading, check for a camera in the new model ---
   if (currentAnimatedModel.cameras.length > 0) {
      // Find the camera by the EXACT name.
      sceneCamera = currentAnimatedModel.cameras.find(cam => cam.name === cameraNameInCode);
      
      if (sceneCamera) {
        console.log(`SUCCESS: Found '${cameraNameInCode}' in the scene.`);
      } else {
        console.error(`ERROR: Could not find camera named '${cameraNameInCode}'. Check Blender name and case-sensitivity.`);
      }
    } else {
      console.log("INFO: No cameras were found in this GLB file.");
    }

    interactionManager.animatedModels = [currentAnimatedModel];
    console.log(`Scene '${sceneData.name}' loaded successfully.`);
    loadingScreen.classList.add("hidden");

    // NEW: Show or hide the energy grid overlay based on the scene index
    interactionManager.toggleEnergyGridOverlay(index === 3); // index 3 is "Smart Energy Management"
  };


  // --- NEW: Add keydown event listener for camera switching ---
  window.addEventListener('keydown', (e) => {
    // Check for the '0' key, only in scene 4, and only if a scene camera exists
    if (e.key === '0' && currentSceneIndex === 3 && sceneCamera) {
      if (activeCamera === defaultCamera) {
        // Switch TO the scene camera
        activeCamera = sceneCamera;
        controls.enabled = false; // Disable orbit controls for the fixed shot
        console.log("Switched to scene camera.");
      } else {
        // Switch BACK to the default camera
        activeCamera = defaultCamera;
        controls.enabled = true; // Re-enable orbit controls
        console.log("Switched back to default camera.");
      }
    }
  });

  // --- Event Listeners for Arrow Buttons (Unchanged) ---
  prevSceneBtn.addEventListener("click", () => {
    const newIndex =
      (currentSceneIndex - 1 + scenesData.length) % scenesData.length;
    loadScene(newIndex);
  });

  nextSceneBtn.addEventListener("click", () => {
    const newIndex = (currentSceneIndex + 1) % scenesData.length;
    loadScene(newIndex);
  });

  // Resize Listener (Unchanged)
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start the continuous animation loop (Unchanged)
  animate(
    renderer,
    scene,
    () => activeCamera,
    controls,
    () => [currentAnimatedModel],
    clock,
    interactionManager
  );

  // --- Initial Load ---
  // We remove the initial HDRI load from here, as loadScene now handles it.
  loadScene(0);
}

// Start the application (Unchanged)
init();