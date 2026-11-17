// Keyboard and pointer input, kept as plain state the world reads each step.
// Movement: WASD or arrow keys. Dash: Shift, Space or a mouse click. P pauses, M mutes.

export function createInput(target) {
  const keys = new Set();
  const state = {
    pointer: { x: 0, y: 0, down: false },
    pressed: new Set(), // keys that went down since the last step (edge triggers)
  };

  const onKeyDown = (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    state.pressed.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  };
  const onKeyUp = (event) => keys.delete(event.code);
  const onPointerMove = (event) => {
    const rect = target.getBoundingClientRect();
    const scaleX = target.width / rect.width;
    const scaleY = target.height / rect.height;
    state.pointer.x = (event.clientX - rect.left) * (scaleX / (window.devicePixelRatio || 1));
    state.pointer.y = (event.clientY - rect.top) * (scaleY / (window.devicePixelRatio || 1));
  };
  const onPointerDown = () => {
    state.pointer.down = true;
    state.pressed.add('PointerDash');
  };
  const onPointerUp = () => {
    state.pointer.down = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    state,
    axis() {
      const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      const y = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
      const len = Math.hypot(x, y) || 1;
      return { x: x / len, y: y / len, active: x !== 0 || y !== 0 };
    },
    dashHeld() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('Space');
    },
    consume(code) {
      const hit = state.pressed.has(code);
      state.pressed.delete(code);
      return hit;
    },
    endStep() {
      state.pressed.clear();
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
