/* ============================================================
 * main.js — 贝塔小屋入口
 *
 * 组装：
 *   scene    场景 / 相机 / 控制器 / 灯光 / 暂停
 *   room     洞穴房间
 *   beta     贝塔角色
 *   furniture家具系统
 *   behaviors行为调度器
 *   interaction 点击拾取
 *   ui       中文 UI
 *
 * 主循环：渲染 + 角色更新 + 行为更新 + 灶台火光闪烁
 *
 * 本地运行：pnpm dev（Vite HMR 热重载，修改 src/* 自动刷新）
 * ============================================================ */

import * as THREE from "three";
import { createScene } from "./scene.js";
import { buildRoom } from "./room.js";
import { createBeta } from "./character.js";
import { buildFurniture, findFurniture } from "./furniture.js";
import { BehaviorScheduler, BEHAVIORS } from "./behaviors.js";
import { createInteraction } from "./interaction.js";
import { createUI } from "./ui.js";

function start() {
  const canvas = document.getElementById("scene");
  if (!canvas) {
    console.error("[beta] canvas#scene not found");
    return;
  }

  /* ---------- 场景 ---------- */
  const sceneApi = createScene({ canvas });
  const { scene, camera, renderer, controls, clock } = sceneApi;

  /* ---------- 房间 ---------- */
  buildRoom(scene);

  /* ---------- 角色 ---------- */
  const beta = createBeta();
  scene.add(beta.group);

  /* ---------- 家具 ---------- */
  const { instances } = buildFurniture(scene);
  const furnitureById = {};
  instances.forEach((it) => { furnitureById[it.def.id] = it; });

  /* ---------- UI ---------- */
  // setStatus 在 UI 模块内部创建，但 scheduler 需要它 → 先占位再填
  let uiApi = { setStatus: () => {} };
  const scheduler = new BehaviorScheduler({
    beta,
    scene,
    three: THREE,
    instances,
    setStatus: (t, e) => uiApi.setStatus(t, e),
    furnitureById
  });
  uiApi = createUI({ scheduler, sceneApi });

  /* ---------- 行为 ---------- */
  // 启动后立刻进入等待，自动模式会自己选第一个
  scheduler.waiting = true;
  scheduler.waitTarget = 1.2;

  /* ---------- 交互 ---------- */
  createInteraction({
    canvas,
    camera,
    scene,
    furnitureById,
    onPick: (fid) => {
      // 找到该家具对应的行为
      const b = BEHAVIORS.find((x) => x.furnitureId === fid);
      if (b) {
        scheduler.trigger(b.id);
        uiApi.setStatus(`贝塔接到 "${b.name}" 的指令，正往 ${b.emoji} 走去~`, b.emoji);
      }
    }
  });

  /* ---------- 收集灶台火光（用于闪烁） ---------- */
  const flickers = [];
  scene.traverse((o) => {
    if (o.isMesh && o.userData && o.userData.flicker) flickers.push(o);
  });

  /* ---------- 主循环 ---------- */
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05); // 限制单帧步长，防止卡顿后跳变

    if (!sceneApi.isPaused()) {
      beta.update(dt);
      scheduler.update(dt);

      // 灶台火光闪烁
      const t = clock.elapsedTime;
      flickers.forEach((f, i) => {
        const v = 0.7 + Math.sin(t * 8 + i) * 0.15 + Math.random() * 0.1;
        f.scale.setScalar(v);
        f.material.opacity = 0.75 + Math.sin(t * 6 + i) * 0.15;
      });
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  /* ---------- 自适应 ---------- */
  window.addEventListener("resize", sceneApi.setSize);

  /* ---------- 调试入口（HMR 友好） ---------- */
  // 暴露给开发者控制台，方便手动触发行为
  window.__beta = {
    beta,
    scheduler,
    trigger: (id) => scheduler.trigger(id),
    behaviors: BEHAVIORS,
    furniture: instances
  };
  console.log("%c🧀 贝塔小屋已启动", "color:#d9a066;font-weight:bold;font-size:14px;");
  console.log("提示：window.__beta.trigger('sleep') 可手动触发行为");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
