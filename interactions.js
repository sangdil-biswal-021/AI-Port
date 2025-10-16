import * as THREE from 'three';
import { SETTINGS } from './settings.js';

export class InteractionManager {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    domElement.addEventListener('click', this.onClick.bind(this));
  }

  onClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      this.handleClick(intersects[0].object);
    }
  }

  handleClick(object) {
    console.log('Clicked:', object.name || object.uuid);
    if (object.material) {
      const original = object.material.color.clone();
      object.material.color.set(SETTINGS.highlightColor);
      setTimeout(() => object.material.color.copy(original), 500);
    }
  }
}
