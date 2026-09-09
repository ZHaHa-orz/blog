/* ============================================================
 * ui.js — 中文可爱 UI 控制
 *   - 状态气泡 setStatus(text, emoji)
 *   - 控制按钮：暂停 / 重置视角 / 切换自动
 *   - 家具行动面板：根据 BEHAVIORS 渲染按钮，点击触发
 * ============================================================ */

import { BEHAVIORS } from "./behaviors.js";

export function createUI({ scheduler, sceneApi }) {
  const hudStatus = document.getElementById("hudStatus");
  const hudEmoji = document.getElementById("hudEmoji");
  const hudText = document.getElementById("hudText");
  const hudGrid = document.getElementById("hudActionGrid");

  let hideTimer = null;

  /** 设置状态气泡（自动淡出） */
  function setStatus(text, emoji) {
    if (hudText) hudText.textContent = text;
    if (hudEmoji) hudEmoji.textContent = emoji || "🏡";
    if (hudStatus) {
      hudStatus.classList.remove("fade");
      clearTimeout(hideTimer);
      // 长时间无变化后淡化（不消失，保持低对比度）
      hideTimer = setTimeout(() => {
        hudStatus && hudStatus.classList.add("fade");
      }, 6000);
    }
  }

  /** 渲染家具行动按钮（依据 BEHAVIORS） */
  function renderActions() {
    if (!hudGrid) return;
    hudGrid.innerHTML = "";
    BEHAVIORS.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = "hud-action";
      btn.title = b.name;
      btn.innerHTML = `
        <span class="hud-action-ic">${b.emoji}</span>
        <span>${b.name}</span>
      `;
      btn.addEventListener("click", () => {
        scheduler.trigger(b.id);
        setStatus(`贝塔接到 "${b.name}" 的指令，正往 ${b.emoji} 走去~`, b.emoji);
      });
      hudGrid.appendChild(btn);
    });
  }

  /** 绑定控制按钮 */
  function bindControls() {
    const btnPause = document.getElementById("btnPause");
    const btnReset = document.getElementById("btnReset");
    const btnAuto = document.getElementById("btnAuto");

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        const paused = sceneApi.togglePause();
        scheduler.setPaused(paused);
        btnPause.classList.toggle("active", paused);
        const icPause = btnPause.querySelector(".ic-pause");
        const icPlay = btnPause.querySelector(".ic-play");
        if (icPause) icPause.hidden = paused;
        if (icPlay) icPlay.hidden = !paused;
        setStatus(
          paused ? "嘘——时间静止了，贝塔屏住了呼吸…" : "时间重新流动啦~",
          paused ? "⏸" : "▶"
        );
      });
    }

    if (btnReset) {
      btnReset.addEventListener("click", () => {
        sceneApi.resetView();
        setStatus("视角已经回到贝塔的小窝门口~", "🏠");
      });
    }

    if (btnAuto) {
      // 默认开启自动
      btnAuto.classList.add("active");
      btnAuto.title = "自动行为：开";
      btnAuto.addEventListener("click", () => {
        const next = !scheduler.auto;
        scheduler.setAuto(next);
        btnAuto.classList.toggle("active", next);
        btnAuto.title = `自动行为：${next ? "开" : "关"}`;
        setStatus(
          next
            ? "贝塔开启自顾自模式，会随机地做饭、看书、打盹啦~"
            : "自动行为已关闭，点家具来唤起贝塔吧~",
          next ? "🤖" : "💤"
        );
      });
    }
  }

  renderActions();
  bindControls();

  // 初始状态
  setStatus("贝塔正在洞穴里悠闲地待着…", "🏡");

  return { setStatus };
}
