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

// --- THIS IS THE UPDATED HDRI SETUP FUNCTION ---
// It now accepts a filename to allow for scene-specific backgrounds.
export async function setupHDRI(renderer, scene, hdriName, exposure = 1.0) {
  
  renderer.toneMappingExposure = exposure;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const hdrLoader = new HDRLoader();


  // --- NEW LOGIC TO CHOOSE THE CORRECT HDRI ---
  // If hdriName is 'default' or not provided, use the original HDRI.
  // Otherwise, use the new name passed from main.js.
  const defaultHdri = 'aristea_wreck_puresky_1k.hdr';
  const filename = (hdriName && hdriName !== 'default') ? hdriName : defaultHdri;
  const hdriPath = `./textures/${filename}`;
  // --- END NEW LOGIC ---

  try {
    console.log("Starting to load HDRI..."); // This log is preserved
    // Use .loadAsync() which returns a Promise. This is non-blocking.
    const texture = await hdrLoader.loadAsync(hdriPath);
    
    console.log("HDRI file loaded in memory. Now compiling environment map..."); // This log is preserved
    
    // Process the texture to create the environment map
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    
    // Now that everything is ready, apply it to the scene
    scene.background = envMap;
    scene.environment = envMap;
    
    console.log("HDRI setup complete and applied to the scene."); // This log is preserved

    // Clean up to free memory
    texture.dispose();
    pmremGenerator.dispose();

  } catch (error) {
    console.error("CRITICAL: Failed to load or process the HDRI file.", error); // This log is preserved
    console.error(`Please ensure the file exists at the path: ${hdriPath}`); // This log is preserved
  }
}