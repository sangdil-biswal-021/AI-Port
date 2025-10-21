import { updateCameraPosition } from './camera.js';

export function animate(renderer, scene, camera, controls, getAnimatedModels, clock, interactionManager) {
  function loop() {
    requestAnimationFrame(loop);

    const delta = clock.getDelta();

    // --- UPDATED: Call the function to get the current models ---
    const animatedModels = getAnimatedModels();
    
    // Update animated models' mixers
    if (animatedModels && animatedModels.length > 0) {
      animatedModels.forEach(m => {
        if (m) m.update(delta);
      });
    }

    if (!interactionManager.isTweening() && controls.enabled) {
      updateCameraPosition(camera);
    }

    interactionManager.update();
    if (controls) controls.update();

    renderer.render(scene, camera);
  }

  loop();
}