import * as THREE from 'three';
import { SETTINGS } from './settings.js';

export class InteractionManager {
  constructor(camera, scene, domElement) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Popup elements
    this.popup = document.getElementById('popup');
    this.popupText = document.getElementById('popup-text');
    this.popupClose = document.getElementById('popup-close');

    this.popupClose.addEventListener('click', () => this.hidePopup());

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

    // Highlight
    if (object.material) {
      const original = object.material.color.clone();
      object.material.color.set(0xff0000);
      setTimeout(() => object.material.color.copy(original), 500);
    }

    // Show popup with info
    const name = object.name || "Unknown Object";
    this.showPopup(`You clicked: ${name}`);
  }

  showPopup(text) {
    this.popupText.innerText = text;
    this.popup.style.display = 'block';

    
  }

  hidePopup() {
    this.popup.style.display = 'none';
  }
}
