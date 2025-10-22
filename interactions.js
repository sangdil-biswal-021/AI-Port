import * as THREE from "three";
import { Group, Tween, Easing } from "@tweenjs/tween.js";
import { initCamera } from "./camera.js";

const tweenGroup = new Group();
let activeTween = null;
const initialCameraConfig = initCamera(document.createElement("div"));
const initialCameraPosition = initialCameraConfig.camera.position.clone();
const initialCameraLookAt = new THREE.Vector3(0, 0, 0);

// --- Object Name Definitions (Verified) ---
const focusableObjectNames = [
  "Green_zeleni_kont_0",
  "model_81_backside_2",
  "Object_4_002",
  "Object_17",
  "Object_17_001",
  "crane_new",
];
const roboticArmParts = [
  "Arm1_lambert1_0",
  "ArmBase_lambert1_0",
  "RotatingArm_lambert1_0",
  "Cube",
];
const trackableObjectNames = [
  "crate_opti_1",
  "crate_opti_2",
  "crate_lag_1",
  "crate_lag_2",
];
const crateR = Array.from({ length: 8 }, (_, i) => `crate_r${i + 1}`);
const crateW = Array.from({ length: 16 }, (_, i) => `crate_w${i + 1}`);
const crateG = Array.from({ length: 16 }, (_, i) => `crate_g${i + 1}`);
const crateV = [
  "crate_g11_v",
  "crate_g12_v",
  "crate_g13_v",
  "crate_r5_v",
  "crate_r6_v",
  "crate_r7_v",
  "crate_w3_v",
  "crate_w4_v",
  "crate_w5_v",
  "crate_w9_v",
];
const cranesS3 = Array.from({ length: 6 }, (_, i) => `crane_s30${i + 1}`);
const roboS3 = ["s3_robo_cube", "s3_robo_arm", "s3_robo", "s3_robo_joint"];
const scene3Focusable = [
  ...crateR,
  ...crateW,
  ...crateG,
  ...crateV,
  ...cranesS3,
  ...roboS3,
];
focusableObjectNames.push(...scene3Focusable, ...roboticArmParts);

// --- Mock Data (Verified) ---
const mockObjectData = new Map([
  [
    "Green_zeleni_kont_0",
    {
      Name: "Container C-734",
      status: "Awaiting Pickup",
      "Container Health": "98%",
      Weight: "14.2 Tons",
      "Max Weight": "30 Tons",
      Location: "Dock 4, Bay 7",
    },
  ],
  [
    "model_81_backside_2",
    {
      Name: "Port Power Unit",
      status: "Active",
      "Energy Output": "2.1 GW",
      "Coolant Temp": "78°C",
      "Last Service": "2025-08-12",
    },
  ],
  [
    "Object_4_002",
    {
      Name: "Crane Alpha-3",
      status: "Idle",
      "Equipment Health": "92%",
      Temperature: "45°C",
      "Current Load": "0 Tons",
      "Next Service": "2025-11-05",
    },
  ],
  [
    "Object_17",
    {
      Name: 'Cargo Ship "Odyssey"',
      status: "Docked - Unloading",
      "Fuel Reserve": "65%",
      "Cargo Capacity": "85% Full",
      "Next Departure": "2025-10-19 18:00 UTC",
      "Maintenance Status": "No Issues Reported",
    },
  ],
  [
    "Object_17_001",
    {
      Name: 'Freighter "Starlight"',
      status: "Docked - Loading",
      "Fuel Reserve": "95%",
      "Cargo Capacity": "34% Full",
      "Next Departure": "2025-10-20 04:00 UTC",
      "Maintenance Status": "Minor Hydraulics Check Scheduled",
    },
  ],
  [
    "crane_new",
    {
      Name: "Automated Crane Unit",
      status: "Active - Scanning",
      "Transfer Efficiency": "+35%",
      "Berth Idle Time": "-28%",
      Technology: "Robotic Arm Integration",
    },
  ],
  [
    "Robotic_Arm_System",
    {
      type: "diagnostic",
      Name: "Robotic Arm System",
      Purpose: "High-speed container scanning and sorting.",
      status: "Active",
      "Current Task": "Scanning Container #41",
    },
  ],
  [
    "crate_opti_1",
    {
      type: "tracking",
      optimized: true,
      text: "<strong>Traffic Optimized:</strong> AI-guided pathing is reducing congestion by 32%.",
    },
  ],
  [
    "crate_opti_2",
    {
      type: "tracking",
      optimized: true,
      text: "<strong>Traffic Optimized:</strong> Smart-lane allocation is minimizing vehicle idle time.",
    },
  ],
  [
    "crate_lag_1",
    {
      type: "tracking",
      optimized: false,
      text: "<strong>Congestion Detected:</strong> Unmanaged traffic is causing a 14% delay in transfer.",
    },
  ],
  [
    "crate_lag_2",
    {
      type: "tracking",
      optimized: false,
      text: "<strong>Congestion Detected:</strong> Manual routing is leading to potential bottlenecks.",
    },
  ],
]);
const priorities = { high: "High", medium: "Medium", low: "Low" };
const healthStatuses = [
  { status: "Critical", color: "red" },
  { status: "Warning", color: "yellow" },
  { status: "Healthy", color: "green" },
];
[...crateR, ...crateW, ...crateG].forEach((name) => {
  let p = priorities.low;
  if (name.startsWith("crate_r")) p = priorities.high;
  if (name.startsWith("crate_w")) p = priorities.medium;
  mockObjectData.set(name, {
    type: "dwell",
    id: name.toUpperCase(),
    priority: p,
    dwellTime: `${Math.floor(2 + Math.random() * 70)} hours`,
  });
});
cranesS3.forEach((name) => {
  const s = healthStatuses[Math.floor(Math.random() * 3)];
  mockObjectData.set(name, {
    type: "diagnostic",
    name: `Crane ${name.slice(-3)}`,
    status: s,
    vibration: `${(0.1 + Math.random() * 0.5).toFixed(2)} g`,
    temp: `${Math.floor(55 + Math.random() * 30)}°C`,
    hours: Math.floor(1500 + Math.random() * 8000),
    prediction: `2025-12-${Math.floor(1 + Math.random() * 28)}`,
  });
});
roboS3.forEach((name) =>
  mockObjectData.set(name, {
    type: "diagnostic",
    name: "S3 Sorting Arm",
    status: "Healthy",
    vibration: "0.11 g",
    temp: "42°C",
    hours: 4500,
    prediction: "2026-01-15",
  })
);
crateV.forEach((name) => mockObjectData.set(name, { type: "graph" }));

export class InteractionManager {
  constructor(
    camera,
    scene,
    domElement,
    controls = null,
    animatedModels = [],
    getSceneIndex
  ) {
    this.camera = camera;
    this.scene = scene;
    this.domElement = domElement;
    this.controls = controls;
    this.animatedModels = animatedModels;
    this.getSceneIndex = getSceneIndex;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.tweenActive = false;
    this.focusedObject = null;
    this.trackedObject = null;
    this.flickeringObject = null;
    this.originalMaterial = null;
    this.flickerTime = 0;
    this.trackingCameraOffset = new THREE.Vector3(0, 5, 15);
     
    this.energyGridOverlay = document.getElementById('energy-grid-overlay');
    // Set up the main pointerdown listener once.
    domElement.addEventListener("pointerdown", this.onPointerDown.bind(this));
  }

  // Helper to initialize event listeners for UI buttons *once*
  _initEventListeners() {
    if (this._listenersInitialized) return;
    document
      .getElementById("details-close")
      .addEventListener("click", () => this.unfocusObject());
    document
      .getElementById("tracking-close-btn")
      .addEventListener("click", () => this.stopTrackingObject());
    document
      .querySelectorAll(".overlay-close-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () => this.unfocusObject())
      );
    document
      .getElementById("alert-action-primary")
      .addEventListener("click", () => this.hideAiAlertOverlay());
    document
      .getElementById("alert-action-secondary")
      .addEventListener("click", () => this.hideAiAlertOverlay());
    this._listenersInitialized = true;
  }

  onPointerDown(event) {
    this._initEventListeners(); // Ensure UI listeners are ready on the first click
    if (event.button !== 0 || this.tweenActive) return;
    if (this.trackedObject) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const trackableParent = this.findParentInList(
        clickedObject,
        trackableObjectNames
      );
      if (trackableParent) {
        this.startTrackingObject(trackableParent);
        return;
      }

      const focusableParent = this.findParentInList(
        clickedObject,
        focusableObjectNames
      );
      if (focusableParent) {
        this.handleFocusableObjectClick(focusableParent);
        return;
      }
    }
    if (this.focusedObject) this.unfocusObject();
  }

  handleFocusableObjectClick(object) {
    if (this.focusedObject === object || this.trackedObject) return;
    this.unfocusObject(); // Clear any previous state first
    this.focusedObject = object;
    const sceneIndex = this.getSceneIndex();
    const objectName = object.name;

    let dataKey = objectName;
    if (roboticArmParts.includes(objectName)) dataKey = "Robotic_Arm_System";
    if (roboS3.includes(objectName)) dataKey = objectName;

    const data = mockObjectData.get(dataKey);
    if (!data) {
      this.unfocusObject();
      return;
    }

    if (sceneIndex === 2) {
      switch (data.type) {
        case "dwell":
          this.showDwellTimeOverlay(data);
          this.focusCameraOnObject(object);
          break;
        case "graph":
          this.showGraphOverlay();
          this.showAiAnalysisOverlay();
          this.startFreeRotateFocus(object);
          break;
        case "diagnostic":
          this.showDiagnosticOverlay(data);
          if (data.status && data.status.color === "red") {
            this.startFlicker(object, 0xff0000);
            this.showAiAlertOverlay(data);
          } else if (data.status && data.status.color === "yellow") {
            this.startFlicker(object, 0xffc107);
          }
          this.focusCameraOnObject(object);
          break;
        default:
          this.showDetails(dataKey);
          this.focusCameraOnObject(object);
          break;
      }
    } else {
      // Logic for Scene 0 and 1
      this.showDetails(dataKey);
      if (objectName === "crane_new" || roboticArmParts.includes(objectName)) {
        this.showAnalyticsOverlay();
      } else {
        this.hideAnalyticsOverlay();
      }
      this.focusCameraOnObject(object);
    }
  }

    // --- NEW: Function to toggle the new overlay's visibility ---
  toggleEnergyGridOverlay(isVisible) {
    const overlay = document.getElementById('energy-grid-overlay');
    if (!overlay) return;

    if (isVisible) {
      // --- NEW: Update the data when showing the overlay ---
      const generator = document.getElementById('source-generator');
      const solar = document.getElementById('source-solar');

      // Randomly choose which source is active
      if (Math.random() > 0.4) {
          generator.classList.remove('active-source');
          solar.classList.add('active-source');
          document.getElementById('solar-status').textContent = '98% Capacity';
          document.getElementById('generator-status').textContent = 'Standby';
      } else {
          generator.classList.add('active-source');
          solar.classList.remove('active-source');
          document.getElementById('solar-status').textContent = 'Night Cycle';
          document.getElementById('generator-status').textContent = '75% Load';
      }
      
      document.getElementById('crane-consumption').textContent = `${(1.2 + Math.random() * 0.5).toFixed(2)} MW`;
      document.getElementById('ship-consumption').textContent = `${(3.5 + Math.random()).toFixed(2)} MW`;
      // --- END NEW ---

      overlay.classList.add('visible');
    } else {
      overlay.classList.remove('visible');
    }
  }

  unfocusObject() {
    if (!this.focusedObject) return;
    this.focusedObject = null;
    this.hideDetails();
    this.hideAnalyticsOverlay();
    document.getElementById("dwell-time-overlay").classList.remove("visible");
    document.getElementById("graph-overlay").classList.remove("visible");
    document.getElementById("diagnostic-overlay").classList.remove("visible");
    this.hideAiAnalysisOverlay();
    this.hideAiAlertOverlay();
    this.stopFlicker();
    this.resetCameraPosition();
  }

  // --- BUG FIXED: ADDED THE MISSING FUNCTION ---
  startFreeRotateFocus(object) {
    if (activeTween) activeTween.stop();
    this.tweenActive = true;
    const objectCenter = new THREE.Box3()
      .setFromObject(object)
      .getCenter(new THREE.Vector3());
    const distance = 40;
    const direction = this.camera.position
      .clone()
      .sub(objectCenter)
      .normalize();
    const targetPos = objectCenter
      .clone()
      .add(direction.multiplyScalar(distance));
    const startState = {
      camX: this.camera.position.x,
      camY: this.camera.position.y,
      camZ: this.camera.position.z,
      targetX: this.controls.target.x,
      targetY: this.controls.target.y,
      targetZ: this.controls.target.z,
    };
    const endState = {
      camX: targetPos.x,
      camY: targetPos.y,
      camZ: targetPos.z,
      targetX: objectCenter.x,
      targetY: objectCenter.y,
      targetZ: objectCenter.z,
    };
    activeTween = new Tween(startState, tweenGroup)
      .to(endState, 1000)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.camera.position.set(
          startState.camX,
          startState.camY,
          startState.camZ
        );
        const lookAtVector = new THREE.Vector3(
          startState.targetX,
          startState.targetY,
          startState.targetZ
        );
        this.controls.target.copy(lookAtVector);
      })
      .onComplete(() => {
        this.tweenActive = false;
      })
      .start();
  }

  // --- NEW: AI Analysis Overlay Functions ---
  showAiAnalysisOverlay() {
    const overlay = document.getElementById("ai-analysis-overlay");
    const textEl = document.getElementById("ai-analysis-text");
    if (!overlay || !textEl) return;

    // Reset animation by removing and re-adding the element
    textEl.remove();
    textEl.textContent =
      "Analyzing optimal layout for keeping containers based on priority...";
    overlay.appendChild(textEl);

    overlay.classList.add("visible");
  }
  hideAiAnalysisOverlay() {
    document.getElementById("ai-analysis-overlay")?.classList.remove("visible");
  }

  // --- ADDED THE MISSING FUNCTION ---
  showDwellTimeOverlay(data) {
    const dwellOverlay = document.getElementById("dwell-time-overlay");
    document.getElementById("dwell-id").textContent = data.id;
    let priorityClass = "low";
    if (data.priority === "High") priorityClass = "high";
    if (data.priority === "Medium") priorityClass = "medium";
    document.getElementById(
      "dwell-priority"
    ).innerHTML = `<div class="priority-value"><span class="priority-dot ${priorityClass}"></span> ${data.priority}</div>`;
    document.getElementById("dwell-time").textContent = data.dwellTime;
    dwellOverlay.classList.add("visible");
  }

  showDiagnosticOverlay(data) {
    const diagnosticOverlay = document.getElementById("diagnostic-overlay");
    document.getElementById("diag-title").textContent = `${
      data.name || data.Name
    } - AI Diagnostic`;
    const statusEl = document.getElementById("diag-status");

    if (typeof data.status === "object" && data.status !== null) {
      statusEl.innerHTML = `<span class="status-dot ${data.status.color}"></span> ${data.status.status}`;
    } else if (typeof data.status === "string") {
      let dotClass = "good";
      if (data.status.toLowerCase().includes("warning")) dotClass = "warning";
      if (data.status.toLowerCase().includes("critical")) dotClass = "danger";
      statusEl.innerHTML = `<span class="status-dot ${dotClass}"></span> ${data.status}`;
    } else {
      statusEl.textContent = "--";
    }

    document.getElementById("diag-vibration").textContent =
      data.vibration || "--";
    document.getElementById("diag-temp").textContent = data.temp || "--";
    document.getElementById("diag-hours").textContent = data.hours || "--";
    document.getElementById("diag-prediction").textContent =
      data.prediction || "N/A";
    diagnosticOverlay.classList.add("visible");
  }

  showGraphOverlay() {
    document.getElementById("graph-overlay").classList.add("visible");
  }

  showAiAlertOverlay(data) {
    const aiAlertOverlay = document.getElementById("ai-alert-overlay");
    document.getElementById(
      "ai-alert-title"
    ).textContent = `CRITICAL ALERT: ${data.name}`;
    document.getElementById(
      "ai-alert-message"
    ).textContent = `Failure predicted for ${data.name}. Immediate action is recommended.`;
    aiAlertOverlay.classList.add("visible");
  }
  hideAiAlertOverlay() {
    document.getElementById("ai-alert-overlay").classList.remove("visible");
  }

  showDetails(objectName) {
    const data = mockObjectData.get(objectName);
    if (!data) return;
    const detailsPanel = document.getElementById("details-panel");
    const detailsTitle = document.getElementById("details-title");
    const detailsList = document.getElementById("details-list");
    detailsTitle.textContent = data.Name || objectName.replace(/_/g, " ");
    detailsList.innerHTML = "";
    for (const [key, value] of Object.entries(data)) {
      if (key === "Name" || key.toLowerCase() === "type") continue;
      const listItem = document.createElement("li");
      let content = "";
      if (
        key.includes("Health") ||
        key.includes("Reserve") ||
        key.includes("Capacity")
      ) {
        const percentage = parseInt(value, 10);
        let barClass = "good";
        if (percentage < 75) barClass = "warning";
        if (percentage < 30) barClass = "danger";
        content = `<span>${key}</span><div class="progress-bar"><div class="progress-bar-fill ${barClass}" style="width: ${percentage}%;"></div></div>`;
      } else if (key.toLowerCase() === "status") {
        let dotClass = "good";
        if (
          value.toLowerCase().includes("idle") ||
          value.toLowerCase().includes("awaiting") ||
          value.toLowerCase().includes("scheduled")
        )
          dotClass = "warning";
        if (
          value.toLowerCase().includes("error") ||
          value.toLowerCase().includes("offline")
        )
          dotClass = "danger";
        content = `<span>${key}</span><div class="status-value"><span class="status-dot ${dotClass}"></span>${value}</div>`;
      } else {
        content = `<span>${key}</span><span>${value}</span>`;
      }
      listItem.innerHTML = content;
      detailsList.appendChild(listItem);
    }
    detailsPanel.classList.add("visible");
  }
  hideDetails() {
    document.getElementById("details-panel").classList.remove("visible");
  }

  // (All other methods are correct and unchanged)
  startFlicker(object, color = 0xff0000) {
    this.stopFlicker();
    this.flickeringObject = object.isMesh
      ? object
      : object.getObjectByProperty("isMesh", true);
    if (this.flickeringObject && this.flickeringObject.material) {
      this.originalMaterial = this.flickeringObject.material;
      this.flickeringObject.material = this.originalMaterial.clone();
      this.flickeringObject.material.emissive = new THREE.Color(color);
    }
  }
  stopFlicker() {
    if (this.flickeringObject && this.originalMaterial) {
      this.flickeringObject.material = this.originalMaterial;
    }
    this.flickeringObject = null;
    this.originalMaterial = null;
  }
  updateFlicker(delta) {
    if (this.flickeringObject) {
      this.flickerTime += delta;
      this.flickeringObject.material.emissiveIntensity = Math.abs(
        Math.sin(this.flickerTime * 10)
      );
    }
  }
  startTrackingObject(object) {
    if (this.trackedObject) return;
    if (this.focusedObject) this.unfocusObject();
    this.trackedObject = object;
    this.controls.enabled = false;
    const data = mockObjectData.get(object.name);
    document.getElementById("tracking-text").innerHTML = data.text;
    const panel = document.getElementById("tracking-analytics-panel");
    panel.className = data.optimized ? "optimized" : "";
    setTimeout(() => panel.classList.add("visible"), 100);
  }
  stopTrackingObject() {
    if (!this.trackedObject) return;
    this.trackedObject = null;
    this.controls.enabled = true;
    document
      .getElementById("tracking-analytics-panel")
      .classList.remove("visible");
    this.resetCameraPosition();
  }
  updateTrackedCamera() {
    if (this.trackedObject) {
      const targetPosition = new THREE.Vector3();
      this.trackedObject.getWorldPosition(targetPosition);
      const desiredCameraPosition = targetPosition
        .clone()
        .add(this.trackingCameraOffset);
      this.camera.position.lerp(desiredCameraPosition, 0.05);
      this.camera.lookAt(targetPosition);
      this.controls.target.copy(targetPosition);
    }
  }
  isTrackingActive() {
    return !!this.trackedObject;
  }
  findParentInList(object, names) {
    let current = object;
    while (current) {
      if (names.includes(current.name)) return current;
      current = current.parent;
    }
    return null;
  }
  showAnalyticsOverlay() {
    document.getElementById("analytics-overlay").classList.add("visible");
  }
  hideAnalyticsOverlay() {
    document.getElementById("analytics-overlay").classList.remove("visible");
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
    const distance = ((maxDim / 2) * padding) / Math.tan(fov / 2);
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
        if (this.controls) this.controls.target.copy(objectCenter);
      })
      .onComplete(() => {
        this.tweenActive = false;
        if (!this.isTrackingActive() && this.controls)
          this.controls.enabled = true;
      })
      .start();
  }
  resetCameraPosition() {
    if (activeTween) activeTween.stop();
    this.tweenActive = true;
    if (this.controls) this.controls.enabled = false;
    const startState = {
      camX: this.camera.position.x,
      camY: this.camera.position.y,
      camZ: this.camera.position.z,
      targetX: this.controls.target.x,
      targetY: this.controls.target.y,
      targetZ: this.controls.target.z,
    };
    const endState = {
      camX: initialCameraPosition.x,
      camY: initialCameraPosition.y,
      camZ: initialCameraPosition.z,
      targetX: initialCameraLookAt.x,
      targetY: initialCameraLookAt.y,
      targetZ: initialCameraLookAt.z,
    };
    activeTween = new Tween(startState, tweenGroup)
      .to(endState, 1200)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        this.camera.position.set(
          startState.camX,
          startState.camY,
          startState.camZ
        );
        const lookAtVector = new THREE.Vector3(
          startState.targetX,
          startState.targetY,
          startState.targetZ
        );
        this.camera.lookAt(lookAtVector);
        if (this.controls) this.controls.target.copy(lookAtVector);
      })
      .onComplete(() => {
        this.tweenActive = false;
        if (this.controls) this.controls.enabled = true;
      })
      .start();
  }
  isTweening() {
    return this.tweenActive;
  }
  update() {
    tweenGroup.update();
  }
}
