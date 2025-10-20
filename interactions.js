import * as THREE from 'three';
import { Group, Tween, Easing } from '@tweenjs/tween.js';
import { initCamera } from './camera.js';

const tweenGroup = new Group();
let activeTween = null;

const initialCameraConfig = initCamera(document.createElement('div'));
const initialCameraPosition = initialCameraConfig.camera.position.clone();
const initialCameraLookAt = new THREE.Vector3(0, 0, 0);

const focusableObjectNames = [
  'Green_zeleni_kont_0',
  'model_81_backside_2',
  'Object_4_002',
  'Object_17',
  'Object_17_001',
  'crane_new', // The new crane
  // All parts of the robotic arm:
  'Arm1_lambert1_0',
  'ArmBase_lambert1_0',
  'RotatingArm_lambert1_0',
  'Cube',
];

const roboticArmParts = [
  'Arm1_lambert1_0',
  'ArmBase_lambert1_0',
  'RotatingArm_lambert1_0',
  'Cube',
];

const mockObjectData = new Map([
  [
    'Green_zeleni_kont_0',
    { Name: 'Container C-734', Status: 'Awaiting Pickup', 'Container Health': '98%', Weight: '14.2 Tons', 'Max Weight': '30 Tons', Location: 'Dock 4, Bay 7', },
  ],
  [
    'model_81_backside_2',
    { Name: 'Port Power Unit', Status: 'Active', 'Energy Output': '2.1 GW', 'Coolant Temp': '78°C', 'Last Service': '2025-08-12', },
  ],
  [
    'Object_4_002',
    { Name: 'Crane Alpha-3', Status: 'Idle', 'Equipment Health': '92%', Temperature: '45°C', 'Current Load': '0 Tons', 'Next Service': '2025-11-05', },
  ],
  [
    'Object_17',
    { Name: 'Cargo Ship "Odyssey"', Status: 'Docked - Unloading', 'Fuel Reserve': '65%', 'Cargo Capacity': '85% Full', 'Next Departure': '2025-10-19 18:00 UTC', 'Maintenance Status': 'No Issues Reported', },
  ],
  [
    'Object_17_001',
    { Name: 'Freighter "Starlight"', Status: 'Docked - Loading', 'Fuel Reserve': '95%', 'Cargo Capacity': '34% Full', 'Next Departure': '2025-10-20 04:00 UTC', 'Maintenance Status': 'Minor Hydraulics Check Scheduled', },
  ],
  [
    'crane_new',
    { Name: 'Automated Crane Unit', Status: 'Active - Scanning', 'Transfer Efficiency': '+35%', 'Berth Idle Time': '-28%', Technology: 'Robotic Arm Integration', },
  ],
  [
    'Robotic_Arm_System',
    { Name: 'Robotic Arm System', Purpose: 'High-speed container scanning and sorting to reduce unloading times.', Status: 'Active', 'Current Task': 'Scanning Container #41', },
  ],
]);


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
    this.focusedObject = null;

    this.detailsPanel = document.getElementById('details-panel');
    this.detailsTitle = document.getElementById('details-title');
    this.detailsList = document.getElementById('details-list');
    this.detailsClose = document.getElementById('details-close');
    this.detailsClose.addEventListener('click', () => this.unfocusObject());

    this.analyticsOverlay = document.getElementById('analytics-overlay');
    this.currentContainerId = document.getElementById('current-container-id');
    this.nextContainerId = document.getElementById('next-container-id');
    this.efficiencyStat = document.getElementById('efficiency-stat');

    domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
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
    if (this.focusedObject) {
      this.unfocusObject();
    }
  }

  handleFocusableObjectClick(object) {
    if (this.focusedObject === object) return;
    
    this.focusedObject = object;
    const objectName = object.name;
    let dataKey = objectName;

    const isRoboticArmPart = roboticArmParts.includes(objectName);
    if (isRoboticArmPart) {
      dataKey = 'Robotic_Arm_System';
    }

    this.showDetails(dataKey);
    
    if (objectName === 'crane_new' || isRoboticArmPart) {
      this.showAnalyticsOverlay();
    } else {
      this.hideAnalyticsOverlay();
    }

    this.focusCameraOnObject(object);

    const craneModel = this.animatedModels.find(m => m.model);
    if (craneModel && craneModel.playPopUp) {
      craneModel.playPopUp();
    }
  }

  unfocusObject() {
    if (!this.focusedObject) return;
    
    this.focusedObject = null;
    this.hideDetails();
    this.hideAnalyticsOverlay();

    const craneModel = this.animatedModels.find(m => m.model);
    if (craneModel && craneModel.playPopDown) {
      craneModel.playPopDown();
    }

    this.resetCameraPosition();
  }

  showAnalyticsOverlay() {
    this.currentContainerId.textContent = `C-${Math.floor(40 + Math.random() * 5)}`;
    this.nextContainerId.textContent = `C-${Math.floor(80 + Math.random() * 5)}`;
    this.efficiencyStat.textContent = `${(28 + Math.random() * 5).toFixed(1)}% Reduction`;
    
    setTimeout(() => {
        this.analyticsOverlay.classList.add('visible');
    }, 400);
  }

  hideAnalyticsOverlay() {
    this.analyticsOverlay.classList.remove('visible');
  }

  findParentInList(object, names) {
    let current = object;
    while (current) {
      if (names.includes(current.name)) return current;
      current = current.parent;
    }
    return null;
  }
  
  showDetails(objectName) {
    const data = mockObjectData.get(objectName);
    if (!data) return;
    this.detailsTitle.textContent = data.Name || objectName.replace(/_/g, ' ');
    this.detailsList.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
      if (key === 'Name') continue;
      const listItem = document.createElement('li');
      let content = '';
      if (key.includes('Health') || key.includes('Reserve') || key.includes('Capacity')) {
        const percentage = parseInt(value, 10);
        let barClass = 'good';
        if (percentage < 75) barClass = 'warning';
        if (percentage < 30) barClass = 'danger';
        content = `<span>${key}</span><div class="progress-bar"><div class="progress-bar-fill ${barClass}" style="width: ${percentage}%;"></div></div>`;
      } else if (key.includes('Status')) {
        let dotClass = 'good';
        if (value.toLowerCase().includes('idle') || value.toLowerCase().includes('awaiting') || value.toLowerCase().includes('scheduled')) dotClass = 'warning';
        if (value.toLowerCase().includes('error') || value.toLowerCase().includes('offline')) dotClass = 'danger';
        content = `<span>${key}</span><div class="status-value"><span class="status-dot ${dotClass}"></span>${value}</div>`;
      } else {
        content = `<span>${key}</span><span>${value}</span>`;
      }
      listItem.innerHTML = content;
      this.detailsList.appendChild(listItem);
    }
    setTimeout(() => { this.detailsPanel.classList.add('visible'); }, 300);
  }
  
  hideDetails() {
    this.detailsPanel.classList.remove('visible');
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