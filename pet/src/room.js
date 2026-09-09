/* ============================================================
 * room.js — 洞穴小屋（断面玩偶屋风格）
 *   - 木质圆形地板（程序化木纹纹理）
 *   - 半圆形泥土洞穴后墙（温暖壁色）
 *   - 圆形门扉（墙上的圆门洞 + 木门框）
 *   - 暖色踢脚线 / 地毯
 *
 * 导出 buildRoom(scene) -> { group, floorY, wallRadius }
 * ============================================================ */

import * as THREE from "three";

/* ---------- 程序化纹理 ---------- */

/** 生成木纹纹理（暖色调） */
function makeWoodTexture(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  // 基底：温暖焦糖木色
  const base = ctx.createLinearGradient(0, 0, size, 0);
  base.addColorStop(0, "#c8915a");
  base.addColorStop(0.5, "#b9794a");
  base.addColorStop(1, "#a9693a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // 木纹线：横向细条纹 + 节疤
  for (let i = 0; i < 38; i++) {
    const y = (i / 38) * size + (Math.random() - 0.5) * 8;
    ctx.strokeStyle = `rgba(90, 55, 25, ${0.10 + Math.random() * 0.16})`;
    ctx.lineWidth = 1 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    // 微弯木纹
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2.5);
    }
    ctx.stroke();
  }
  // 节疤
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 6 + Math.random() * 10;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(70, 40, 18, .55)");
    g.addColorStop(1, "rgba(70, 40, 18, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** 生成泥土洞穴壁纹理（温暖壁色 + 颗粒） */
function makeWallTexture(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  // 基底渐变：上深下浅，营造洞穴感
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#9c6b46");
  g.addColorStop(0.5, "#b98860");
  g.addColorStop(1, "#caa074");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 颗粒噪点（泥土质感）
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d[i]     = Math.max(0, Math.min(255, d[i]     + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  // 一些不规则的泥土斑驳
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 18 + Math.random() * 40;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(120, 75, 40, ${0.06 + Math.random() * 0.1})`);
    rg.addColorStop(1, "rgba(120, 75, 40, 0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** 生成圆形地毯纹理 */
function makeRugTexture(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;
  // 外圈
  ctx.fillStyle = "#d97a4a";
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  // 中圈
  ctx.fillStyle = "#f0b070";
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 22, 0, Math.PI * 2);
  ctx.fill();
  // 内圈花纹
  ctx.strokeStyle = "#b9582a";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 44, 0, Math.PI * 2);
  ctx.stroke();
  // 中心小圆
  ctx.fillStyle = "#c8522a";
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- 房间构建 ---------- */

export function buildRoom(scene) {
  const group = new THREE.Group();
  group.name = "Room";

  const wallRadius = 6.2;   // 洞穴半径
  const floorY = 0;         // 地板高度
  const wallHeight = 4.2;   // 墙高

  /* ---------- 木质圆形地板 ---------- */
  const woodTex = makeWoodTexture(512);
  woodTex.repeat.set(2, 2);
  const floorGeo = new THREE.CircleGeometry(wallRadius + 0.6, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; // 平铺
  floor.position.y = floorY;
  floor.receiveShadow = true;
  group.add(floor);

  /* ---------- 洞穴后墙（半圆柱断面） ----------
   * 用半圆柱（开口朝向相机方向 +Z），构成洞穴曲面墙。
   * thetaStart = -Math.PI/2，thetaLength = Math.PI → 半圆。
   * 这里让墙位于地板边缘、向上延伸，开口朝向 +Z（观察方向）。
   */
  const wallTex = makeWallTexture(512);
  wallTex.repeat.set(3, 1);
  const wallGeo = new THREE.CylinderGeometry(
    wallRadius, wallRadius, wallHeight, 48, 1, true,
    -Math.PI / 2, Math.PI
  );
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.BackSide
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, wallHeight / 2, 0);
  wall.receiveShadow = true;
  group.add(wall);

  /* ---------- 圆形门扉 ----------
   * 在后墙正中央挂一个圆环（门框）+ 一个略凹的圆门板，
   * 给人"洞穴有扇圆门"的感觉。门略偏向一侧，避免正对相机。
   */
  const doorGroup = new THREE.Group();
  doorGroup.name = "Door";

  // 门框（圆环）
  const frameGeo = new THREE.TorusGeometry(1.1, 0.16, 16, 48);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x8a5a3b,
    roughness: 0.6,
    metalness: 0.05
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.castShadow = true;
  doorGroup.add(frame);

  // 门板（稍暗的木板）
  const doorGeo = new THREE.CircleGeometry(1.04, 48);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x7a4a2c,
    roughness: 0.7,
    metalness: 0.05
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.z = -0.08;
  door.castShadow = true;
  doorGroup.add(door);

  // 门把手
  const knobGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0xe8b860,
    roughness: 0.3,
    metalness: 0.6
  });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.position.set(0.62, -0.05, 0.04);
  knob.castShadow = true;
  doorGroup.add(knob);

  // 把门装到墙上：沿曲面切向偏移（角度），并贴到墙内侧
  // 让门略偏左侧（-X 方向），更自然
  const doorAngle = -0.55; // 弧度，从 -X 侧
  const doorRadiusOffset = wallRadius - 0.02;
  doorGroup.position.set(
    Math.cos(-Math.PI / 2 + doorAngle) * doorRadiusOffset,
    1.8,
    Math.sin(-Math.PI / 2 + doorAngle) * doorRadiusOffset
  );
  // 让门朝向圆心（即朝向 +Z 中心）
  doorGroup.lookAt(0, 1.8, 0);
  group.add(doorGroup);

  /* ---------- 圆形小窗（右侧墙） ----------
   * 一个发光圆窗，给房间增加温暖光源感。
   */
  const windowGroup = new THREE.Group();
  const winFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.08, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.6 })
  );
  windowGroup.add(winFrame);
  const winGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffd9a0,
      emissive: 0xffb060,
      emissiveIntensity: 0.7,
      roughness: 0.4,
      transparent: true,
      opacity: 0.92
    })
  );
  winGlass.position.z = -0.02;
  windowGroup.add(winGlass);

  const winAngle = 0.7;
  windowGroup.position.set(
    Math.cos(-Math.PI / 2 + winAngle) * (wallRadius - 0.02),
    2.8,
    Math.sin(-Math.PI / 2 + winAngle) * (wallRadius - 0.02)
  );
  windowGroup.lookAt(0, 2.8, 0);
  group.add(windowGroup);

  /* ---------- 暖色地地毯 ---------- */
  const rugTex = makeRugTexture(256);
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 48),
    new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.01, 0.6);
  rug.receiveShadow = true;
  group.add(rug);

  /* ---------- 墙脚踢脚线（沿地板边缘的暖色条） ---------- */
  const skirtGeo = new THREE.TorusGeometry(wallRadius - 0.02, 0.07, 10, 96, -Math.PI / 2, Math.PI);
  const skirt = new THREE.Mesh(
    skirtGeo,
    new THREE.MeshStandardMaterial({ color: 0x6e4a2f, roughness: 0.7 })
  );
  skirt.rotation.x = Math.PI / 2; // 让圆环平躺
  skirt.position.y = 0.06;
  skirt.receiveShadow = true;
  group.add(skirt);

  scene.add(group);

  return {
    group,
    floorY,
    wallRadius,
    wallHeight
  };
}
