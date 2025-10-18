import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export class AnimatedModel {
  // --- FIX 1: Add 'onLoad' to the constructor's parameters ---
  constructor(path, scene, onLoad) {
    this.mixer = null;
    this.model = null;
    this.animations = new Map();
    this.loopingActions = [];
    this.activeAction = null;
    this.isOneShotPlaying = false;

    // --- FIX 2: Pass 'onLoad' down to the load method ---
    this.load(path, scene, onLoad);
  }

  // --- FIX 3: Add 'onLoad' to the load method's parameters ---
  load(path, scene, onLoad) {
    const loader = new GLTFLoader();
    loader.load(path, 
      // onSuccess callback
      (gltf) => {
        this.model = gltf.scene;
        this.model.name = 'CraneModelContainer';
        scene.add(this.model);

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          console.log("Animation Mixer Initialized.");

          gltf.animations.forEach(clip => {
            const action = this.mixer.clipAction(clip);
            this.animations.set(clip.name, action);

            if (clip.name !== 'pop_up' && clip.name !== 'pop_down') {
              action.setLoop(THREE.LoopRepeat);
              action.play();
              this.loopingActions.push(action);
            } else {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            }
          });
          
          console.log(`${this.loopingActions.length} animations started in a loop.`);

          this.mixer.addEventListener('finished', (e) => {
            const finishedClipName = e.action.getClip().name;
            if (finishedClipName === 'pop_down') {
              this.resumeLoopingAnimations();
              this.isOneShotPlaying = false;
            }
            if (finishedClipName === 'pop_up') {
              this.isOneShotPlaying = false; 
            }
          });
        } else {
          console.warn("No animations found in the GLTF file!");
        }

        // --- FIX 4: Call the 'onLoad' function now that the model is ready ---
        if (onLoad) {
          onLoad();
        }

      },
      // onProgress callback (optional)
      undefined,
      // onError callback
      (err) => {
          console.error('Error loading model:', err);
          // Also call onLoad on error to hide the loading screen and not get stuck
          if (onLoad) {
              onLoad();
          }
      }
    );
  }

  playPopUp() {
    if (this.isOneShotPlaying) return;
    const popUpAction = this.animations.get('pop_up');
    if (!popUpAction) {
      console.warn("'pop_up' animation not found. Only camera will move.");
      return;
    }
    this.isOneShotPlaying = true;
    this.loopingActions.forEach(action => action.fadeOut(0.5));
    popUpAction.reset().fadeIn(0.5).play();
    this.activeAction = popUpAction;
  }

  playPopDown() {
    if (this.isOneShotPlaying) return;
    const popDownAction = this.animations.get('pop_down');
    if (!popDownAction) {
      console.warn("'pop_down' animation not found. Resuming loops directly.");
      this.resumeLoopingAnimations();
      return;
    }
    this.isOneShotPlaying = true;
    if (this.activeAction) this.activeAction.fadeOut(0.5);
    popDownAction.reset().fadeIn(0.5).play();
    this.activeAction = popDownAction;
  }

  resumeLoopingAnimations() {
    if (this.activeAction) this.activeAction.fadeOut(0.5);
    this.loopingActions.forEach(action => {
        action.reset().fadeIn(0.5).play();
    });
    this.activeAction = this.loopingActions.length > 0 ? this.loopingActions[0] : null;
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}