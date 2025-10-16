import * as THREE from 'three';

export function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  // Lights
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0x404040));

  return scene;
}
