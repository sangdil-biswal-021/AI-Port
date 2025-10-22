import { updateCameraPosition } from "./camera.js";

export function animate(
  renderer,
  scene,
  getActiveCamera,
  controls,
  getAnimatedModels,
  clock,
  interactionManager
) {
  function loop() {
    requestAnimationFrame(loop);

    // --- NEW: Get the currently active camera on every frame ---
    const camera = getActiveCamera();

    const delta = clock.getDelta();
    const animatedModels = getAnimatedModels();

    if (animatedModels && animatedModels.length > 0) {
      animatedModels.forEach((m) => {
        if (m) m.update(delta);
      });
    }

    // --- NEW: Update the flicker effect ---
    interactionManager.updateFlicker(delta);

    // Call the camera tracking function every single frame
    interactionManager.updateTrackedCamera();

    // Only allow user WASD movement if not tweening, not tracking, and controls are enabled
    if (
      !interactionManager.isTweening() &&
      !interactionManager.isTrackingActive() &&
      controls.enabled
    ) {
      updateCameraPosition(camera);
    }

    // This updates TWEEN animations for camera focus/unfocus
    interactionManager.update();

    // This is required for OrbitControls damping and also updates the camera position based on user mouse input
    if (controls) controls.update();

    // Render the scene
    renderer.render(scene, camera);
  }

  loop();
}
