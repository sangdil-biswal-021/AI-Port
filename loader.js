import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export class AnimatedModel {
  constructor(path, scene) {
    this.mixer = null;
    this.model = null;
    this.animations = new Map();
    this.loopingActions = []; // <-- Array to hold all looping animations
    this.activeAction = null;
    this.isOneShotPlaying = false;

    this.load(path, scene);
  }

  load(path, scene) {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      this.model = gltf.scene;
      this.model.name = 'CraneModelContainer';
      scene.add(this.model);

      if (gltf.animations.length === 0) {
        console.warn("No animations found in the GLTF file!");
        return;
      }

      this.mixer = new THREE.AnimationMixer(this.model);
      console.log("Animation Mixer Initialized.");

      gltf.animations.forEach(clip => {
        const action = this.mixer.clipAction(clip);
        this.animations.set(clip.name, action);

        // Check if the animation is NOT pop_up or pop_down
        if (clip.name !== 'pop_up' && clip.name !== 'pop_down') {
          // This is a looping background animation
          action.setLoop(THREE.LoopRepeat);
          action.play();
          this.loopingActions.push(action); // Add to our list of looping actions
        } else {
          // This is a one-shot animation
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
        }
      });
      
      console.log(`${this.loopingActions.length} animations started in a loop.`);

      // This listener is key to resuming the loops after pop_down finishes
      this.mixer.addEventListener('finished', (e) => {
        const finishedClipName = e.action.getClip().name;

        if (finishedClipName === 'pop_down') {
          console.log("'pop_down' finished. Resuming all looping animations.");
          this.resumeLoopingAnimations();
          this.isOneShotPlaying = false;
        }
        if (finishedClipName === 'pop_up') {
          // When pop_up finishes, it just holds its final frame.
          // The state is now "focused".
          this.isOneShotPlaying = false; 
        }
      });

    }, undefined, (err) => console.error('Error loading model:', err));
  }

  // Called when the user clicks ON the container
  playPopUp() {
    if (this.isOneShotPlaying) return;
    this.isOneShotPlaying = true;
    console.log("Stopping loops and playing 'pop_up'.");

    const popUpAction = this.animations.get('pop_up');
    if (!popUpAction) {
      console.error("'pop_up' animation not found!");
      return;
    }

    // Fade out all looping animations
    this.loopingActions.forEach(action => action.fadeOut(0.5));

    // Fade in and play pop_up
    popUpAction.reset().fadeIn(0.5).play();
    this.activeAction = popUpAction;
  }

  // Called when the user clicks AWAY from the container
  playPopDown() {
    if (this.isOneShotPlaying) return;
    this.isOneShotPlaying = true;
    console.log("Playing 'pop_down'.");

    const popDownAction = this.animations.get('pop_down');
    if (!popDownAction) {
      console.error("'pop_down' animation not found!");
      return;
    }

    // Fade out the currently active action (which should be the clamped pop_up)
    if (this.activeAction) {
      this.activeAction.fadeOut(0.5);
    }

    // Fade in and play pop_down
    popDownAction.reset().fadeIn(0.5).play();
    this.activeAction = popDownAction;
  }

  // Helper function to bring back all the background loops
  resumeLoopingAnimations() {
    console.log("Fading in looping animations.");
    // Fade out the last one-shot action (pop_down)
    if (this.activeAction) {
        this.activeAction.fadeOut(0.5);
    }
    
    // Fade all background loops back in
    this.loopingActions.forEach(action => {
        action.reset().fadeIn(0.5).play();
    });

    // Set a default active action for state consistency
    this.activeAction = this.loopingActions.length > 0 ? this.loopingActions[0] : null;
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}