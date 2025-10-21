import * as THREE from "three";
import { Group, Tween, Easing } from "@tweenjs/tween.js";
import { initCamera } from "./camera.js";

const tweenGroup = new Group();
let activeTween = null;

const initialCameraConfig = initCamera(document.createElement("div"));
const initialCameraPosition = initialCameraConfig.camera.position.clone();
const initialCameraLookAt = new THREE.Vector3(0, 0, 0);

// CORRECTED: Robotic arm parts are now correctly in the standard focusable list
const focusableObjectNames = [
  "Green_zeleni_kont_0",
  "model_81_backside_2",
  "Object_4_002",
  "Object_17",
  "Object_17_001",
  "crane_new",
  "Arm1_lambert1_0",
  "ArmBase_lambert1_0",
  "RotatingArm_lambert1_0",
  "Cube",
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

const mockObjectData = new Map([
  [
    "Green_zeleni_kont_0",
    {
      Name: "Container C-734",
      Status: "Awaiting Pickup",
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
      Status: "Active",
      "Energy Output": "2.1 GW",
      "Coolant Temp": "78°C",
      "Last Service": "2025-08-12",
    },
  ],
  [
    "Object_4_002",
    {
      Name: "Crane Alpha-3",
      Status: "Idle",
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
      Status: "Docked - Unloading",
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
      Status: "Docked - Loading",
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
      Status: "Active - Scanning",
      "Transfer Efficiency": "+35%",
      "Berth Idle Time": "-28%",
      Technology: "Robotic Arm Integration",
    },
  ],
  [
    "Robotic_Arm_System",
    {
      Name: "Robotic Arm System",
      Purpose:
        "High-speed container scanning and sorting to reduce unloading times.",
      Status: "Active",
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
    this.trackedObject = null;

    // A fixed offset for our third-person follow camera
    this.trackingCameraOffset = new THREE.Vector3(0, 5, 15); // You can tweak these values (x, y, z)

    // Cleaned up UI references
    this.detailsPanel = document.getElementById("details-panel");
    this.detailsTitle = document.getElementById("details-title");
    this.detailsList = document.getElementById("details-list");
    this.detailsClose = document.getElementById("details-close");
    this.analyticsOverlay = document.getElementById("analytics-overlay");
    this.trackingPanel = document.getElementById("tracking-analytics-panel");
    this.trackingText = document.getElementById("tracking-text");
    this.trackingCloseBtn = document.getElementById("tracking-close-btn");

    // Cleaned up event listeners
    this.detailsClose.addEventListener("click", () => this.unfocusObject());
    this.trackingCloseBtn.addEventListener("click", () =>
      this.stopTrackingObject()
    );
    domElement.addEventListener("pointerdown", this.onPointerDown.bind(this));
  }

  // CORRECTED: The main click handler now correctly locks during tracking
  onPointerDown(event) {
    if (event.button !== 0 || this.tweenActive) return;

    // If we are in tracking mode, no other clicks on the 3D scene should do anything.
    // Only the 'X' button's own event listener can stop tracking.
    if (this.trackedObject) {
      return;
    }

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

    if (this.focusedObject) {
      this.unfocusObject();
    }
  }

  startTrackingObject(object) {
    if (this.trackedObject === object) return;
    if (this.focusedObject) this.unfocusObject();

    this.trackedObject = object;
    this.controls.enabled = false; // Disable user orbit controls

    const data = mockObjectData.get(object.name);
    this.trackingText.innerHTML = data.text;
    this.trackingPanel.className = data.optimized ? "optimized" : "";
    setTimeout(() => this.trackingPanel.classList.add("visible"), 100);
  }

  stopTrackingObject() {
    if (!this.trackedObject) return;

    this.trackedObject = null;
    this.controls.enabled = true; // Re-enable user orbit controls
    this.trackingPanel.classList.remove("visible");
    this.resetCameraPosition();
  }

  // CORRECTED: This now implements a proper third-person follow camera
  updateTrackedCamera() {
    if (this.trackedObject) {
      const targetPosition = new THREE.Vector3();
      this.trackedObject.getWorldPosition(targetPosition);

      // Calculate the desired camera position based on the offset
      const desiredCameraPosition = targetPosition
        .clone()
        .add(this.trackingCameraOffset);

      // Smoothly move (LERP) the camera's actual position towards the goal
      this.camera.position.lerp(desiredCameraPosition, 0.05);

      // Always make the camera look at the object's center
      this.camera.lookAt(targetPosition);

      // Also update the controls target for a smooth exit from tracking mode
      this.controls.target.copy(targetPosition);
    }
  }

  isTrackingActive() {
    return !!this.trackedObject;
  }

  // CORRECTED: The logic for handling robotic arm clicks is clear
  handleFocusableObjectClick(object) {
    if (this.focusedObject === object || this.trackedObject) return;
    this.focusedObject = object;
    let dataKey = object.name;

    if (roboticArmParts.includes(object.name)) {
      dataKey = "Robotic_Arm_System";
    }

    this.showDetails(dataKey);

    if (object.name === "crane_new" || roboticArmParts.includes(object.name)) {
      this.showAnalyticsOverlay();
    } else {
      this.hideAnalyticsOverlay();
    }
    this.focusCameraOnObject(object);
    const craneModel = this.animatedModels.find((m) => m.model);
    if (craneModel && craneModel.playPopUp) craneModel.playPopUp();
  }

  unfocusObject() {
    if (!this.focusedObject) return;
    this.focusedObject = null;
    this.hideDetails();
    this.hideAnalyticsOverlay();
    const craneModel = this.animatedModels.find((m) => m.model);
    if (craneModel && craneModel.playPopDown) craneModel.playPopDown();
    this.resetCameraPosition();
  }

  // (All other helper functions like findParentInList, showDetails, focusCameraOnObject, resetCameraPosition, etc. are unchanged and correct)
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
    this.detailsTitle.textContent = data.Name || objectName.replace(/_/g, " ");
    this.detailsList.innerHTML = "";
    for (const [key, value] of Object.entries(data)) {
      if (key === "Name") continue;
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
      } else if (key.includes("Status")) {
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
      this.detailsList.appendChild(listItem);
    }
    setTimeout(() => {
      this.detailsPanel.classList.add("visible");
    }, 300);
  }
  hideDetails() {
    this.detailsPanel.classList.remove("visible");
  }
  showAnalyticsOverlay() {
    const analyticsOverlay = document.getElementById("analytics-overlay");
    document.getElementById(
      "current-container-id"
    ).textContent = `C-${Math.floor(40 + Math.random() * 5)}`;
    document.getElementById("next-container-id").textContent = `C-${Math.floor(
      80 + Math.random() * 5
    )}`;
    document.getElementById("efficiency-stat").textContent = `${(
      28 +
      Math.random() * 5
    ).toFixed(1)}% Reduction`;
    setTimeout(() => {
      analyticsOverlay.classList.add("visible");
    }, 400);
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
        if (!this.isTrackingActive()) {
          if (this.controls) this.controls.enabled = true;
        }
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
