/* ============================================================
 * furniture.js — 模块化家具系统
 *
 * 设计目标：
 *   - 家具 = 数据 + 工厂函数 + 行为挂点
 *   - 每个 furniture 是一个"对象描述"：
 *       {
 *         id, name, emoji,        // 元信息（UI 显示 & 拾取标识）
 *         build(): THREE.Group,   // 构建几何（含命名 mesh 便于拾取）
 *         spot: { x, z, faceY },  // 贝塔走到此处并面朝家具
 *         behavior: "behaviorId"  // 点击后触发的行为 id（对应 behaviors.js）
 *       }
 *   - 添加/分离家具：只需在 FURNITURE 列表里 push/remove 一项
 *
 * 暖色木纹质感、圆润造型、柔和阴影。
 * ============================================================ */

import * as THREE from "three";

/* ---------- 共享材质 ---------- */
const M = {
  wood:      new THREE.MeshStandardMaterial({ color: 0xb9885c, roughness: 0.7, metalness: 0.04 }),
  woodDark:  new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.7, metalness: 0.04 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xd9a674, roughness: 0.7, metalness: 0.04 }),
  metal:     new THREE.MeshStandardMaterial({ color: 0xc0c0c8, roughness: 0.4, metalness: 0.6 }),
  copper:    new THREE.MeshStandardMaterial({ color: 0xc97640, roughness: 0.4, metalness: 0.5 }),
  fabric:    new THREE.MeshStandardMaterial({ color: 0xe0796a, roughness: 0.85, metalness: 0.0 }),
  fabric2:   new THREE.MeshStandardMaterial({ color: 0xf0b860, roughness: 0.85, metalness: 0.0 }),
  paper:     new THREE.MeshStandardMaterial({ color: 0xf2e4c4, roughness: 0.9, metalness: 0.0 }),
  cheese:    new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.6, metalness: 0.05, emissive: 0x442a00, emissiveIntensity: 0.05 }),
  leaf:      new THREE.MeshStandardMaterial({ color: 0x7fae5a, roughness: 0.7 }),
  ceramic:   new THREE.MeshStandardMaterial({ color: 0xf0e4d0, roughness: 0.4, metalness: 0.05 }),
  fire:      new THREE.MeshBasicMaterial({ color: 0xffb050, transparent: true, opacity: 0.85 })
};

/* ---------- 辅助：生成小物件 ----------
 * 通用圆角盒子（实际是 BoxGeometry 但缩小棱角显得软）
 */
function roundedBox(w, h, d, mat, r = 0.04) {
  const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  const mesh = new THREE.Mesh(g, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ============================================================
 * 内置家具清单
 * 每项 = { id, name, emoji, build(), spot, behavior }
 *   spot: 贝塔走到此处再触发动作（房间局部坐标）
 *   faceY: 贝塔面朝家具的朝向（弧度，0=+Z 方向）
 * ============================================================ */

export const FURNITURE = [

  /* ---------- 1. 火柴盒床 ---------- */
  {
    id: "bed",
    name: "火柴盒床",
    emoji: "🛏️",
    behavior: "sleep",
    spot: { x: -3.6, z: -2.0 },
    faceY: -Math.PI / 4,
    build() {
      const g = new THREE.Group();
      g.name = "FurnitureBed";
      // 火柴盒外壳（拉开一半的样子）
      const shell = roundedBox(1.7, 0.4, 1.1, M.woodLight, 0.05);
      shell.position.y = 0.2;
      g.add(shell);
      // 火柴盒内抽屉（床体）
      const drawer = roundedBox(1.5, 0.32, 0.95, M.wood, 0.05);
      drawer.position.set(0.1, 0.2, 0);
      g.add(drawer);
      // 床垫（红色小布）
      const mattress = roundedBox(1.4, 0.18, 0.85, M.fabric, 0.06);
      mattress.position.set(0.1, 0.46, 0);
      g.add(mattress);
      // 小枕头
      const pillow = roundedBox(0.45, 0.16, 0.45, M.fabric2, 0.06);
      pillow.position.set(-0.45, 0.5, 0);
      g.add(pillow);
      // 火柴盒侧面的"摩擦条"装饰
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.06, 0.02),
        M.woodDark
      );
      strip.position.set(0, 0.36, 0.56);
      g.add(strip);
      // 床腿
      for (let sx of [-1, 1]) {
        for (let sz of [-1, 1]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.2, 10),
            M.woodDark
          );
          leg.position.set(sx * 0.75, 0.0, sz * 0.48);
          g.add(leg);
        }
      }
      return g;
    }
  },

  /* ---------- 2. 线轴椅子 ---------- */
  {
    id: "chair",
    name: "线轴椅子",
    emoji: "🪑",
    behavior: "read",
    spot: { x: 2.4, z: -1.6 },
    faceY: Math.PI * 0.75,
    build() {
      const g = new THREE.Group();
      g.name = "FurnitureChair";
      // 座面（线轴的圆柱面）
      const seat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.18, 24),
        M.woodLight
      );
      seat.position.y = 0.45;
      seat.castShadow = true;
      g.add(seat);
      // 靠背（一根立柱 + 顶部圆盘）
      const back = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.7, 12),
        M.woodLight
      );
      back.position.set(0, 0.75, -0.28);
      back.castShadow = true;
      g.add(back);
      const backTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16),
        M.woodLight
      );
      backTop.position.set(0, 1.1, -0.28);
      g.add(backTop);
      // 线轴两端的圆盘（装饰）
      for (let s of [-1, 1]) {
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.04, 24),
          M.woodDark
        );
        disc.position.set(0, 0.45 + s * 0.11, 0);
        g.add(disc);
        // 线轴上的缠绕线（环纹装饰）
        const thread = new THREE.Mesh(
          new THREE.TorusGeometry(0.3, 0.015, 6, 24),
          M.fabric2
        );
        thread.rotation.x = Math.PI / 2;
        thread.position.y = 0.45 + s * 0.06;
        g.add(thread);
      }
      // 三条腿（线轴椅子腿少一些更可爱）
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8),
          M.woodDark
        );
        leg.position.set(Math.cos(a) * 0.24, 0.21, Math.sin(a) * 0.24);
        g.add(leg);
      }
      return g;
    }
  },

  /* ---------- 3. 瓶盖盘子 + 奶酪 ---------- */
  {
    id: "plate",
    name: "瓶盖餐盘",
    emoji: "🍽️",
    behavior: "eat",
    spot: { x: 0.0, z: -3.0 },
    faceY: 0,
    build() {
      const g = new THREE.Group();
      g.name = "FurniturePlate";
      // 小桌子（火柴盒当桌）
      const table = roundedBox(1.0, 0.08, 0.7, M.wood, 0.04);
      table.position.y = 0.35;
      g.add(table);
      for (let sx of [-1, 1]) {
        for (let sz of [-1, 1]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
            M.woodDark
          );
          leg.position.set(sx * 0.42, 0.17, sz * 0.28);
          g.add(leg);
        }
      }
      // 瓶盖盘子（金属圆盘，边缘有齿纹用 Torus 模拟）
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.24, 0.05, 24),
        M.copper
      );
      cap.position.set(-0.15, 0.42, 0);
      cap.castShadow = true;
      g.add(cap);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.02, 8, 24),
        M.copper
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(-0.15, 0.45, 0);
      g.add(rim);

      // 奶酪块（三角扇形，从顶视图看是 1/4 圆）
      const cheeseShape = new THREE.Shape();
      cheeseShape.moveTo(0, 0);
      cheeseShape.lineTo(0.16, 0);
      cheeseShape.absarc(0, 0, 0.16, 0, Math.PI / 2, false);
      cheeseShape.lineTo(0, 0.16);
      const cheeseGeo = new THREE.ExtrudeGeometry(cheeseShape, {
        depth: 0.07, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 2
      });
      const cheese = new THREE.Mesh(cheeseGeo, M.cheese);
      cheese.position.set(0.1, 0.41, -0.05);
      cheese.rotation.set(-Math.PI / 2, 0, 0);
      cheese.castShadow = true;
      g.add(cheese);
      // 奶酪上的洞
      for (let i = 0; i < 3; i++) {
        const hole = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xc89030 })
        );
        hole.position.set(0.13 + i * 0.03, 0.43, -0.08 + i * 0.05);
        g.add(hole);
      }
      return g;
    }
  },

  /* ---------- 4. 烹饪台（火柴盒灶台） ---------- */
  {
    id: "stove",
    name: "火柴灶台",
    emoji: "🍳",
    behavior: "cook",
    spot: { x: -2.4, z: 1.4 },
    faceY: -Math.PI * 0.6,
    build() {
      const g = new THREE.Group();
      g.name = "FurnitureStove";
      // 火柴盒当灶台本体
      const base = roundedBox(1.0, 0.7, 0.7, M.woodLight, 0.05);
      base.position.y = 0.35;
      g.add(base);
      // 顶面（深色）
      const top = roundedBox(1.05, 0.06, 0.72, M.woodDark, 0.03);
      top.position.y = 0.72;
      g.add(top);
      // 两个"灶眼"（铜色圆环）
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.13, 0.025, 8, 20),
          M.copper
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-0.22 + i * 0.44, 0.76, 0);
        g.add(ring);
        // 灶眼内部火光（一个发光小球）
        const fire = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          M.fire
        );
        fire.position.set(-0.22 + i * 0.44, 0.78, 0);
        fire.userData.flicker = true;
        g.add(fire);
      }
      // 小锅（一个浅圆筒）
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.14, 0.16, 18),
        M.metal
      );
      pot.position.set(0.2, 0.85, 0);
      pot.castShadow = true;
      g.add(pot);
      const potHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8),
        M.woodDark
      );
      potHandle.rotation.z = Math.PI / 2;
      potHandle.position.set(0.38, 0.88, 0);
      g.add(potHandle);
      // 桌腿
      for (let sx of [-1, 1]) {
        for (let sz of [-1, 1]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8),
            M.woodDark
          );
          leg.position.set(sx * 0.42, 0.16, sz * 0.28);
          g.add(leg);
        }
      }
      return g;
    }
  },

  /* ---------- 5. 书架（火柴盒书架 + 书） ---------- */
  {
    id: "shelf",
    name: "火柴书架",
    emoji: "📚",
    behavior: "read",
    spot: { x: 3.8, z: 0.4 },
    faceY: -Math.PI / 2,
    build() {
      const g = new THREE.Group();
      g.name = "FurnitureShelf";
      // 火柴盒外壳（书架框）
      const frame = roundedBox(0.9, 1.4, 0.32, M.woodLight, 0.04);
      frame.position.y = 0.7;
      g.add(frame);
      // 三层隔板
      for (let i = 0; i < 3; i++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(0.82, 0.03, 0.28),
          M.woodDark
        );
        shelf.position.set(0, 0.3 + i * 0.4, 0);
        g.add(shelf);
      }
      // 书（每层几本）
      const bookColors = [0x9b5a5a, 0x5a7a9b, 0x8a9b5a, 0x9b8a5a, 0x6a5a9b];
      for (let layer = 0; layer < 3; layer++) {
        let x = -0.32;
        for (let b = 0; b < 4; b++) {
          const bw = 0.08 + Math.random() * 0.04;
          const bh = 0.22 + Math.random() * 0.1;
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(bw, bh, 0.22),
            new THREE.MeshStandardMaterial({ color: bookColors[(layer * 4 + b) % bookColors.length], roughness: 0.7 })
          );
          book.position.set(x + bw / 2, 0.34 + layer * 0.4 + bh / 2 + 0.02, 0);
          book.castShadow = true;
          g.add(book);
          x += bw + 0.02;
          if (x > 0.32) break;
        }
      }
      // 底座
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.08, 0.36),
        M.woodDark
      );
      base.position.y = 0.04;
      g.add(base);
      return g;
    }
  },

  /* ---------- 6. 扫帚 ---------- */
  {
    id: "broom",
    name: "小扫帚",
    emoji: "🧹",
    behavior: "clean",
    spot: { x: -1.0, z: 2.6 },
    faceY: Math.PI * 0.5,
    build() {
      const g = new THREE.Group();
      g.name = "FurnitureBroom";
      // 把手（斜靠）
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 1.5, 10),
        M.woodLight
      );
      handle.castShadow = true;
      handle.rotation.z = 0.25;
      handle.position.set(0.05, 0.75, 0);
      g.add(handle);
      // 扫帚头（一个锥形多束）
      const headGroup = new THREE.Group();
      // 主块
      const headMain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.16, 0.35, 12),
        M.woodDark
      );
      headMain.rotation.z = -0.5;
      headGroup.add(headMain);
      // 扫帚毛（细条）
      for (let i = 0; i < 8; i++) {
        const bristle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, 0.4, 5),
          M.woodLight
        );
        bristle.position.set(
          (Math.random() - 0.5) * 0.06,
          -0.3,
          (Math.random() - 0.5) * 0.06
        );
        bristle.rotation.z = -0.5 + (Math.random() - 0.5) * 0.4;
        headGroup.add(bristle);
      }
      headGroup.position.set(0.35, 0.15, 0);
      g.add(headGroup);
      // 底部小托（让扫帚站立的暗示）
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.1),
        M.woodDark
      );
      stand.position.y = 0.01;
      g.add(stand);
      return g;
    }
  }
];

/* ============================================================
 * 构建家具场景：将所有 FURNITURE 项实例化并加入 group
 *   - 每个家具 group 标记 userData.furnitureId / userData.spot
 *     便于点击拾取后查到对应行为
 *   - 同时把可拾取 mesh（如整个 group）名字统一为 Furniture*
 * ============================================================ */

export function buildFurniture(scene) {
  const group = new THREE.Group();
  group.name = "FurnitureRoot";

  const instances = []; // { def, mesh, spot, faceY }

  for (const def of FURNITURE) {
    const mesh = def.build();
    mesh.position.set(def.spot.x, 0, def.spot.z);
    // 让家具朝向贝塔/相机方向更友好（不影响行走面朝）
    // 这里不旋转家具本体，保持默认
    mesh.userData.furnitureId = def.id;
    mesh.userData.spot = def.spot;
    mesh.userData.faceY = def.faceY;
    mesh.traverse((o) => {
      if (o.isMesh) {
        o.userData.furnitureId = def.id;
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    group.add(mesh);
    instances.push({ def, mesh, spot: def.spot, faceY: def.faceY });
  }

  scene.add(group);
  return { group, instances };
}

/** 根据 id 查询某个家具实例 */
export function findFurniture(instances, id) {
  return instances.find((it) => it.def.id === id) || null;
}
