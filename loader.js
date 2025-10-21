import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

export class AnimatedModel {
  constructor(path, scene, onLoad, loopFrames = 900) {
    this.mixer = null;
    this.model = null;
    this.animations = new Map();
    this.loopingActions = [];
    this.activeAction = null;
    this.isOneShotPlaying = false;

    this.load(path, scene, onLoad, loopFrames);
  }

  load(path, scene, onLoad, loopFrames) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        this.model = gltf.scene;
        this.model.name = "CraneModelContainer";
        scene.add(this.model);

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          console.log("Animation Mixer Initialized.");

          // --- NEW: LOOP SYNCHRONIZATION LOGIC ---
          const fps = 24;
           const targetDurationInSeconds = loopFrames / fps;
          console.log(
            `All looping animations will be synchronized to a duration of ${targetDurationInSeconds} seconds.`
          );
          // --- END NEW ---

          gltf.animations.forEach((clip) => {
            // Check if this is a looping animation (i.e., not pop_up or pop_down)
            if (clip.name !== "pop_up" && clip.name !== "pop_down") {
              // --- THIS IS THE KEY FIX ---
              // Manually set the duration of the animation clip.
              // This forces it to stretch or shrink to our target length.
              clip.duration = targetDurationInSeconds;
            }

            const action = this.mixer.clipAction(clip);
            this.animations.set(clip.name, action);

            if (clip.name !== "pop_up" && clip.name !== "pop_down") {
              action.setLoop(THREE.LoopRepeat);
              action.play(); // Play immediately
              this.loopingActions.push(action);
            } else {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            }
          });

          console.log(
            `${this.loopingActions.length} animations were synchronized and started.`
          );

          this.mixer.addEventListener("finished", (e) => {
            const finishedClipName = e.action.getClip().name;
            if (finishedClipName === "pop_down") {
              this.resumeLoopingAnimations();
              this.isOneShotPlaying = false;
            }
            if (finishedClipName === "pop_up") {
              this.isOneShotPlaying = false;
            }
          });
        } else {
          console.warn("No animations found in the GLTF file!");
        }

        if (onLoad) {
          onLoad();
        }
      },
      undefined,
      (err) => {
        console.error("Error loading model:", err);
        if (onLoad) {
          onLoad();
        }
      }
    );
  }

  playPopUp() {
    if (this.isOneShotPlaying) return;
    const popUpAction = this.animations.get("pop_up");
    if (!popUpAction) {
      console.warn("'pop_up' animation not found. Only camera will move.");
      return;
    }
    this.isOneShotPlaying = true;
    this.loopingActions.forEach((action) => action.fadeOut(0.5));
    popUpAction.reset().fadeIn(0.5).play();
    this.activeAction = popUpAction;
  }

  playPopDown() {
    if (this.isOneShotPlaying) return;
    const popDownAction = this.animations.get("pop_down");
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
    this.loopingActions.forEach((action) => {
      action.reset().fadeIn(0.5).play();
    });
    this.activeAction =
      this.loopingActions.length > 0 ? this.loopingActions[0] : null;
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  // --- NEW: Add this cleanup method ---
  dispose() {
    if (this.model && this.model.parent) {
      // Remove the 3D model from the scene
      this.model.parent.remove(this.model);
    }
    // Stop all animations and clear references
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.animations.clear();
    this.loopingActions = [];
    console.log("Previous scene model and animations disposed.");
  }
}
