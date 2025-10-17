import { updateCameraPosition, keysPressed } from './camera.js';

export function animate(renderer, scene, camera, controls, animatedModels, clock, interactionManager) {
  function loop() {
    requestAnimationFrame(loop);

    const delta = clock.getDelta();
    // console.log("Current delta:", delta); // Verbose delta logging

    // Update animated models' mixers
    animatedModels.forEach(m => {
        if (m && m.update) { // Defensive check
            m.update(delta);
        } else {
            console.warn("Animated model or its update method is undefined.");
        }
    });

    // Update camera only if no tween is active AND controls are enabled
    if (!interactionManager.isTweening() && controls.enabled) {
      updateCameraPosition(camera);
    }

    // Update interaction tweens (for camera movement)
    interactionManager.update();

    // Update controls (for damping and continuous movement)
    if (controls) controls.update();

    // Render scene
    renderer.render(scene, camera);
  }

  loop();
}