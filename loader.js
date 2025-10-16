import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { SETTINGS } from './settings.js';

export class AnimatedModel {
  constructor(path, scene) {
    this.mixer = null;
    this.model = null;
    this.load(path, scene);
  }

  load(path, scene) {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      this.model = gltf.scene;
      scene.add(this.model);

      if (gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.model);
        gltf.animations.forEach(clip => {
          const action = this.mixer.clipAction(clip);
          action.play();
          action.setLoop(SETTINGS.animationLoop);
        });
      }
    }, undefined, (err) => console.error('Error loading model:', err));
  }

  update(delta) {
    if (this.mixer) this.mixer.update(delta);
  }
}
