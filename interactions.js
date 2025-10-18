import * as THREE from 'three';
import { Group, Tween, Easing } from '@tweenjs/tween.js';
import { initCamera } from './camera.js';

const tweenGroup = new Group();
let activeTween = null;

const initialCameraConfig = initCamera(document.createElement('div'));
const initialCameraPosition = initialCameraConfig.camera.position.clone();
const initialCameraLookAt = new THREE.Vector3(0, 0, 0);

// --- NEW: Add all our focusable objects to the list ---
const focusableObjectNames = [
  'Green_zeleni_kont_0',
  // 'model_81_backside_2',
  'crane_2', // The Crane
  'Object_17',    // The Ship
  'Object_17.001',    // The Ship 2

];

// --- NEW: Expanded data map for all objects ---
const mockObjectData = new Map([
  [
    'Green_zeleni_kont_0',
    {
      Name: 'Container C-734',
      Status: 'Awaiting Pickup',
      'Container Health': '98%',
      Weight: '14.2 Tons',
      'Max Weight': '30 Tons',
      Location: 'Dock 4, Bay 7', // Added Location
    },
  ],
  [
    'model_81_backside_2',
    {
      Name: 'Port Power Unit',
      Status: 'Active',
      'Energy Output': '2.1 GW',
      'Coolant Temp': '78°C',
      'Last Service': '2025-08-12',
    },
  ],
  [
    'crane_2', // Crane Data
    {
      Name: 'Crane Alpha-3',
      Status: 'Idle',
      'Equipment Health': '92%',
      Temperature: '45°C',
      'Current Load': '0 Tons',
      'Next Service': '2025-11-05',
    },
  ],
   [
    'Object_17', // Ship Data
    {
      Name: 'Cargo Ship "Odyssey"', // Corrected Name
      Status: 'Docked - Unloading',       // More appropriate status
      'Fuel Reserve': '65%',
      'Cargo Capacity': '85% Full',     // Ship-related data
      'Next Departure': '2025-10-19 18:00 UTC', // Ship-related data
      'Maintenance Status': 'No Issues Reported', // Ship-related data
    },
  ],
  [
     'Object_17.001', // Second Ship Data
    {
      Name: 'Freighter "Starlight"',
      Status: 'Docked - Loading',
      'Fuel Reserve': '95%',
      'Cargo Capacity': '34% Full',
      'Next Departure': '2025-10-20 04:00 UTC',
      'Maintenance Status': 'Minor Hydraulics Check Scheduled',
    },
  ],
]);

// --- The rest of the class definition follows ---
export class InteractionManager {
  // ... (constructor and other methods are mostly the same)
  constructor(camera, scene, domElement, controls = null, animatedModels = []) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;
    this.controls = controls;
    this.animatedModels = animatedModels;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.tweenActive = false;
    this.focusedObject = null;

    this.detailsPanel = document.getElementById('details-panel');
    this.detailsTitle = document.getElementById('details-title');
    this.detailsList = document.getElementById('details-list');
    this.detailsClose = document.getElementById('details-close');
    this.detailsClose.addEventListener('click', () => this.unfocusObject());

    domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
  }
  
  // --- REWRITTEN: The showDetails function is now much smarter ---
  showDetails(objectName) {
    const data = mockObjectData.get(objectName);
    if (!data) return;

    // Use the 'Name' property for the title, or the objectName as a fallback
    this.detailsTitle.textContent = data.Name || objectName.replace(/_/g, ' ');
    this.detailsList.innerHTML = ''; // Clear old data

    // Loop through the data and build the list items dynamically
    for (const [key, value] of Object.entries(data)) {
      if (key === 'Name') continue; // Skip the name as it's already in the title

      const listItem = document.createElement('li');
      let content = '';

      // Check the key to decide how to render the value
      if (key.includes('Health') || key.includes('Reserve')) {
        // --- Render a Progress Bar ---
        const percentage = parseInt(value, 10);
        let barClass = 'good';
        if (percentage < 75) barClass = 'warning';
        if (percentage < 30) barClass = 'danger';
        content = `
          <span>${key}</span>
          <div class="progress-bar">
            <div class="progress-bar-fill ${barClass}" style="width: ${percentage}%;"></div>
          </div>
        `;
      } else if (key.includes('Status')) {
        // --- Render a Status Indicator ---
        let dotClass = 'good'; // Default to good
        if (value.toLowerCase().includes('idle') || value.toLowerCase().includes('awaiting')) dotClass = 'warning';
        if (value.toLowerCase().includes('error') || value.toLowerCase().includes('offline')) dotClass = 'danger';
        content = `
          <span>${key}</span>
          <div class="status-value">
            <span class="status-dot ${dotClass}"></span>${value}
          </div>
        `;
      } else {
        // --- Render a standard text value ---
        content = `<span>${key}</span><span>${value}</span>`;
      }
      
      listItem.innerHTML = content;
      this.detailsList.appendChild(listItem);
    }

    // Use a short delay so the panel appears as the camera moves
    setTimeout(() => { this.detailsPanel.classList.add('visible'); }, 300);
  }

  // --- (The rest of the file remains unchanged) ---
  hideDetails() {
    this.detailsPanel.classList.remove('visible');
  }
  
  onPointerDown(event) {
    if (event.button !== 0) return;
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const intersectedFocusable = this.findParentInList(intersects[0].object, focusableObjectNames);
      if (intersectedFocusable) {
        this.handleFocusableObjectClick(intersectedFocusable);
        return;
      }
    }
    if (this.focusedObject) this.unfocusObject();
  }

  handleFocusableObjectClick(object) {
    if (this.focusedObject === object) return;
    this.focusedObject = object;
    this.showDetails(object.name);
    const craneModel = this.animatedModels.find(m => m.model);
    if (craneModel && craneModel.playPopUp) craneModel.playPopUp();
    this.focusCameraOnObject(object);
  }

  unfocusObject() {
    if (!this.focusedObject) return;
    this.focusedObject = null;
    this.hideDetails();
    const craneModel = this.animatedModels.find(m => m.model);
    if (craneModel && craneModel.playPopDown) craneModel.playPopDown();
    this.resetCameraPosition();
  }

  findParentInList(object, names) {
    let current = object;
    while (current) {
      if (names.includes(current.name)) return current;
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
    const targetPos = new THREE.Vector3(objectCenter.x, objectCenter.y + distance * 0.5, objectCenter.z + distance);
    const tempVec = this.camera.position.clone();
    activeTween = new Tween(tempVec, tweenGroup)
      .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1200)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.camera.position.copy(tempVec);
        this.camera.lookAt(objectCenter);
        if (this.controls) this.controls.target.copy(objectCenter);
      })
      .onComplete(() => {
        this.tweenActive = false;
        if (this.controls) this.controls.enabled = true;
      })
      .start();
  }

  resetCameraPosition() {
    if (activeTween) activeTween.stop();
    this.tweenActive = true;
    if (this.controls) this.controls.enabled = false;
    const startState = { camX: this.camera.position.x, camY: this.camera.position.y, camZ: this.camera.position.z, targetX: this.controls.target.x, targetY: this.controls.target.y, targetZ: this.controls.target.z, };
    const endState = { camX: initialCameraPosition.x, camY: initialCameraPosition.y, camZ: initialCameraPosition.z, targetX: initialCameraLookAt.x, targetY: initialCameraLookAt.y, targetZ: initialCameraLookAt.z, };
    activeTween = new Tween(startState, tweenGroup)
      .to(endState, 1200)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.camera.position.set(startState.camX, startState.camY, startState.camZ);
        const lookAtVector = new THREE.Vector3(startState.targetX, startState.targetY, startState.targetZ);
        this.camera.lookAt(lookAtVector);
        if (this.controls) this.controls.target.copy(lookAtVector);
      })
      .onComplete(() => {
        this.tweenActive = false;
        if (this.controls) this.controls.enabled = true;
      })
      .start();
  }

  isTweening() { return this.tweenActive; }
  update() { tweenGroup.update(); }
}