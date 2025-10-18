import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// The initScene function is now very simple again.
// It just creates the scene and some basic fallback lights.
export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5); // Start with a default background color

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);
  
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  return scene;
}

// --- THIS IS THE NEW, CORRECTED HDRI SETUP FUNCTION ---
// We use an async function to load the texture without blocking the main thread.
export async function setupHDRI(renderer, scene) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const hdrLoader = new HDRLoader();
  const hdriPath = './textures/aristea_wreck_puresky_1k.hdr';

  try {
    console.log("Starting to load HDRI...");
    // Use .loadAsync() which returns a Promise. This is non-blocking.
    const texture = await hdrLoader.loadAsync(hdriPath);
    
    console.log("HDRI file loaded in memory. Now compiling environment map...");
    
    // Process the texture to create the environment map
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    
    // Now that everything is ready, apply it to the scene
    scene.background = envMap;
    scene.environment = envMap;
    
    console.log("HDRI setup complete and applied to the scene.");

    // Clean up to free memory
    texture.dispose();
    pmremGenerator.dispose();

  } catch (error) {
    console.error("CRITICAL: Failed to load or process the HDRI file.", error);
    console.error(`Please ensure the file exists at the path: ${hdriPath}`);
  }
}