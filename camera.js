import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SETTINGS } from './settings.js';

export function initCamera(rendererDom) {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Top/angled view: slightly above, looking down
  camera.position.set(6, 80, 60); // X, Y (height), Z
  camera.lookAt(0, 0, 0); // look at scene center

  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = true;

   // --- NEW: CAMERA CONSTRAINTS ---
  // 1. Limit Zoom Out
  controls.maxDistance = 50;

  // 2. Limit Zoom In
  controls.minDistance = 1;

  // 3. Prevent going below the ground
  // Math.PI / 2 is the horizon (90 degrees). A slightly smaller value
  // prevents the camera from going perfectly level with the ground.
  controls.maxPolarAngle = Math.PI / 2.1;
  // --- END NEW ---

  return { camera, controls };
}


// Keyboard movement
export const keysPressed = {};

export function initKeyboardControls() {
  window.addEventListener('keydown', e => keysPressed[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keysPressed[e.key.toLowerCase()] = false);
}

export function updateCameraPosition(camera) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;

  const right = new THREE.Vector3();
  right.crossVectors(camera.up, forward).normalize();

  if (keysPressed['w'] || keysPressed['arrowup']) camera.position.add(forward.clone().multiplyScalar(SETTINGS.cameraSpeed));
  if (keysPressed['s'] || keysPressed['arrowdown']) camera.position.add(forward.clone().multiplyScalar(-SETTINGS.cameraSpeed));
  if (keysPressed['a'] || keysPressed['arrowleft']) camera.position.add(right.clone().multiplyScalar(SETTINGS.cameraSpeed));
  if (keysPressed['d'] || keysPressed['arrowright']) camera.position.add(right.clone().multiplyScalar(-SETTINGS.cameraSpeed));
}
