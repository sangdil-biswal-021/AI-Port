import * as THREE from 'three';
import { Group, Tween, Easing } from '@tweenjs/tween.js';
import { initCamera } from './camera.js';

const tweenGroup = new Group();
let activeTween = null;

const initialCameraConfig = initCamera(document.createElement('div'));
const initialCameraPosition = initialCameraConfig.camera.position.clone();
const initialCameraLookAt = new THREE.Vector3(0, 0, 0);

export class InteractionManager {
  constructor(camera, scene, domElement, controls = null, animatedModels = []) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;
    this.controls = controls;
    this.animatedModels = animatedModels;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.tweenActive = false;
    this.isFocusedOnObject = false;

    this.popup = document.getElementById('popup');
    this.popupText = document.getElementById('popup-text');
    this.popupClose = document.getElementById('popup-close');
    this.popupClose.addEventListener('click', () => this.hidePopup());

    domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
  }

  onPointerDown(event) {
    if (event.button !== 0) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    const greenContainerName = "Green_zeleni_kont_0";
    let clickedGreenContainer = false;

    if (intersects.length > 0) {
      const intersectedObject = this.findParentByName(intersects[0].object, greenContainerName);
      if (intersectedObject) {
        clickedGreenContainer = true;
        this.handleClickOnGreenContainer(intersectedObject);
      }
    }

    if (!clickedGreenContainer && this.isFocusedOnObject) {
      this.handleClickOutsideObject();
    }
  }

  handleClickOnGreenContainer(object) {
    if (this.isFocusedOnObject) return;
    this.isFocusedOnObject = true;
    this.showPopup(`You clicked: ${object.name}`);

    const craneModel = this.animatedModels.find(m => m.model && m.model.name === 'CraneModelContainer');
    if (craneModel) {
      craneModel.playPopUp();
    }

    this.focusCameraOnObject(object);
  }

  handleClickOutsideObject() {
    if (!this.isFocusedOnObject) return;
    this.isFocusedOnObject = false;
    this.hidePopup();

    const craneModel = this.animatedModels.find(m => m.model && m.model.name === 'CraneModelContainer');
    if (craneModel) {
      craneModel.playPopDown();
    }

    this.resetCameraPosition();
  }

  findParentByName(object, name) {
    let current = object;
    while (current) {
      if (current.name === name) return current;
      current = current.parent;
    }
    return null;
  }

  focusCameraOnObject(object) {
    if (activeTween) activeTween.stop();
    this.tweenActive = true;
    if (this.controls) this.controls.enabled = false;

    const objectBoundingBox = new THREE.Box3().setFromObject(object);
    const objectCenter = objectBoundingBox.getCenter(new THREE.Vector3());
    const objectSize = objectBoundingBox.getSize(new THREE.Vector3());
    const padding = 1.5;
    const maxDim = Math.max(objectSize.x, objectSize.y, objectSize.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) * padding / Math.tan(fov / 2);
    
    const targetPos = new THREE.Vector3(
      objectCenter.x,
      objectCenter.y + distance * 0.5,
      objectCenter.z + distance
    );

    const tempVec = this.camera.position.clone();
    activeTween = new Tween(tempVec, tweenGroup)
      .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1200)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.camera.position.copy(tempVec);
        this.camera.lookAt(objectCenter);
        if (this.controls) {
            this.controls.target.copy(objectCenter);
        }
      })
      .onComplete(() => {
        this.tweenActive = false;
        if (this.controls) {
            this.controls.enabled = true;
        }
      })
      .start();
  }

  // --- START OF CORRECTED FUNCTION ---
  resetCameraPosition() {
    if (activeTween) activeTween.stop();
    this.tweenActive = true;
    if (this.controls) this.controls.enabled = false;

    // The state of the camera and controls *before* the animation starts
    const startState = {
        camX: this.camera.position.x,
        camY: this.camera.position.y,
        camZ: this.camera.position.z,
        targetX: this.controls.target.x, // Currently the object's center
        targetY: this.controls.target.y,
        targetZ: this.controls.target.z,
    };

    // The state we want to animate *to*
    const endState = {
        camX: initialCameraPosition.x,
        camY: initialCameraPosition.y,
        camZ: initialCameraPosition.z,
        targetX: initialCameraLookAt.x, // The scene's origin
        targetY: initialCameraLookAt.y,
        targetZ: initialCameraLookAt.z,
    };

    activeTween = new Tween(startState, tweenGroup)
      .to(endState, 1200) // Animate from startState to endState
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        // On every frame, update the camera and controls with the tweened values
        this.camera.position.set(startState.camX, startState.camY, startState.camZ);
        
        const lookAtVector = new THREE.Vector3(startState.targetX, startState.targetY, startState.targetZ);
        this.camera.lookAt(lookAtVector);
        
        if (this.controls) {
            this.controls.target.copy(lookAtVector);
        }
      })
      .onComplete(() => {
        this.tweenActive = false;
        if (this.controls) {
            this.controls.enabled = true;
        }
      })
      .start();
  }
  // --- END OF CORRECTED FUNCTION ---

  isTweening() {
    return this.tweenActive;
  }

  showPopup(text) {
    this.popupText.innerText = text;
    this.popup.style.display = "block";
  }

  hidePopup() {
    this.popup.style.display = "none";
  }

  update() {
    tweenGroup.update();
  }
}