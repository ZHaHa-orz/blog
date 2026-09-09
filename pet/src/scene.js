/* ============================================================
 * scene.js — 场景核心
 *   场景 / 相机 / 渲染器 / OrbitControls / 温暖灯光 / 暂停
 *
 * 导出 createScene() 返回：
 *   { scene, camera, renderer, controls, clock, setSize, isPaused, togglePause, setAutoRotate }
 * ============================================================ */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** 创建场景及其全部基础设施 */
export function createScene({ canvas }) {
  /* ---------- 渲染器 ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // 暖色调输出，与玩偶屋氛围更贴合
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* ---------- 场景 ---------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#ecd6bd");
  scene.fog = new THREE.Fog("#e7c9a8", 14, 34);

  /* ---------- 相机 ---------- */
  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  // 玩偶屋观察位：略高、略前，俯视房间内部
  camera.position.set(0, 6.2, 12.5);

  /* ---------- 控制器：旋转 + 缩放 ---------- */
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 22;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI * 0.49; // 不允许看到地板下方
  controls.enablePan = false;
  controls.target.set(0, 1.6, 0);
  controls.update();

  /* ---------- 灯光：温暖的整体照明 ----------
   * 环境光给一个暖色基底，半球光做出洞穴的柔和过渡，
   * 主光从右上方斜射，模拟桌灯/壁灯，开启柔和阴影。
   */
  const ambient = new THREE.AmbientLight(0xfff0d8, 0.55);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffe7c4, 0x8a5a3b, 0.5);
  hemi.position.set(0, 10, 0);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffd9a8, 1.15);
  keyLight.position.set(6, 9, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  // 暖橙补光，强化洞穴里烛火/壁灯的氛围
  const fillLight = new THREE.PointLight(0xffb070, 0.9, 18, 2);
  fillLight.position.set(-4, 4.2, -2);
  scene.add(fillLight);

  // 床头/角落的小夜灯感
  const cornerLamp = new THREE.PointLight(0xffd9a0, 0.6, 9, 2);
  cornerLamp.position.set(3.4, 2.6, 2.4);
  scene.add(cornerLamp);

  /* ---------- 时钟 ---------- */
  const clock = new THREE.Clock();

  /* ---------- 暂停 & 自动旋转状态 ---------- */
  let paused = false;
  let autoRotate = false;

  function isPaused() { return paused; }
  function togglePause() {
    paused = !paused;
    if (!paused) clock.getDelta(); // 防止暂停期间累积大 delta
    return paused;
  }
  function setAutoRotate(v) {
    autoRotate = v;
    controls.autoRotate = v;
    controls.autoRotateSpeed = 0.6;
    return v;
  }

  /** 窗口尺寸变化 */
  function setSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /** 重置视角 */
  function resetView() {
    controls.target.set(0, 1.6, 0);
    camera.position.set(0, 6.2, 12.5);
    controls.update();
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    clock,
    keyLight,
    fillLight,
    cornerLamp,
    isPaused,
    togglePause,
    setAutoRotate,
    setSize,
    resetView
  };
}
