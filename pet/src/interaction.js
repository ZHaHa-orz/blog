/* ============================================================
 * interaction.js — 点击拾取
 *   - Raycaster 点击家具 → 触发对应行为
 *   - hover 时家具轻微上浮（可选，给反馈）
 * ============================================================ */

import * as THREE from "three";

export function createInteraction({ canvas, camera, scene, furnitureById, onPick }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let downPos = null;
  let downTime = 0;

  // 区分点击与拖动旋转视角：按下记录，松开时若位移很小则当点击
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    downPos = { x: e.clientX, y: e.clientY };
    downTime = performance.now();
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!downPos) return;
    const dx = e.clientX - downPos.x;
    const dy = e.clientY - downPos.y;
    const dt = performance.now() - downTime;
    downPos = null;
    // 位移大或时间长 → 当作拖动，忽略
    if (Math.hypot(dx, dy) > 6 || dt > 400) return;

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    // 收集所有可拾取 mesh（家具组下的 mesh）
    const targets = [];
    scene.traverse((o) => {
      if (o.isMesh && o.userData && o.userData.furnitureId) targets.push(o);
    });
    const hits = raycaster.intersectObjects(targets, false);
    if (hits.length) {
      const fid = hits[0].object.userData.furnitureId;
      onPick && onPick(fid);
    }
  });
}
