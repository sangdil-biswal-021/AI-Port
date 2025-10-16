import { updateCameraPosition } from './camera.js';

export function animate(renderer, scene, camera, controls, animatedModels, clock) {
  function loop() {
    requestAnimationFrame(loop);

    const delta = clock.getDelta();
    animatedModels.forEach(m => m.update(delta));

    updateCameraPosition(camera);
    controls.update();
    renderer.render(scene, camera);
  }

  loop();
}
