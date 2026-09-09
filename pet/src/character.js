/* ============================================================
 * character.js — 贝塔（Beta）小鼠
 *
 * 造型：
 *   - 2~3 头身，圆润可爱，不追求逼真
 *   - 大圆耳朵（粉色耳内）、短小鼻尖、奶茶色身体、背带裤
 *   - 木质感小手小脚
 *
 * 动画：
 *   - 耳朵、尾巴的待机动作
 *   - 行走时身体起伏 + 四肢摆动
 *   - 平滑转向 + 平滑位移（walkTo / turnTo）
 *   - 姿势接口：stand / sit / sleep / reach（举手）等
 *
 * 导出 createBeta() -> { group, update, walkTo, turnTo, pose, getState, ... }
 * ============================================================ */

import * as THREE from "three";

/* ---------- 配色 ---------- */
const COLORS = {
  fur:      0xd9a674,  // 奶茶色身体
  furDark:  0xb9885c,  // 耳/尾根部稍深
  belly:    0xf2dcb6,  // 肚子浅色
  ear:      0xf2b9a0,  // 耳内粉
  nose:     0xc16a6a,  // 鼻尖粉红
  eye:      0x3a2418,  // 眼睛深棕
  overall:  0x6e7ba6,  // 背带裤（柔和蓝灰）
  overallDark: 0x556388,
  button:   0xe8b860,  // 背带裤纽扣（金黄）
  paw:      0xe2c190   // 手脚粉嫩
};

export function createBeta() {
  const group = new THREE.Group();
  group.name = "Beta";

  /* ---------- 材质 ---------- */
  const furMat = new THREE.MeshStandardMaterial({
    color: COLORS.fur, roughness: 0.65, metalness: 0.02
  });
  const furDarkMat = new THREE.MeshStandardMaterial({
    color: COLORS.furDark, roughness: 0.7, metalness: 0.02
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: COLORS.belly, roughness: 0.7, metalness: 0.02
  });
  const earMat = new THREE.MeshStandardMaterial({
    color: COLORS.ear, roughness: 0.7, metalness: 0.02
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: COLORS.nose, roughness: 0.55, metalness: 0.05
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: COLORS.eye, roughness: 0.35, metalness: 0.1
  });
  const overallMat = new THREE.MeshStandardMaterial({
    color: COLORS.overall, roughness: 0.7, metalness: 0.03
  });
  const overallDarkMat = new THREE.MeshStandardMaterial({
    color: COLORS.overallDark, roughness: 0.7, metalness: 0.03
  });
  const buttonMat = new THREE.MeshStandardMaterial({
    color: COLORS.button, roughness: 0.4, metalness: 0.3
  });
  const pawMat = new THREE.MeshStandardMaterial({
    color: COLORS.paw, roughness: 0.7, metalness: 0.02
  });

  /* ---------- 头部 ---------- */
  const head = new THREE.Group();
  head.name = "Head";

  // 头颅（略扁的球，更亲切）
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 32, 32),
    furMat
  );
  skull.scale.set(1, 0.92, 1.05);
  skull.castShadow = true;
  head.add(skull);

  // 脸颊（两侧微鼓，更圆润）
  const cheekGeo = new THREE.SphereGeometry(0.16, 20, 20);
  const cheekL = new THREE.Mesh(cheekGeo, bellyMat);
  cheekL.position.set(-0.32, -0.06, 0.42);
  cheekL.castShadow = true;
  head.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.32;
  head.add(cheekR);

  // 大圆耳朵（左右各一）—— 外层奶茶色 + 内层粉色
  function makeEar(side) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 24, 24),
      furDarkMat
    );
    outer.scale.set(1, 1.25, 0.5);
    outer.castShadow = true;
    ear.add(outer);
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      earMat
    );
    inner.scale.set(1, 1.25, 0.4);
    inner.position.z = 0.05;
    ear.add(inner);

    ear.position.set(side * 0.34, 0.46, 0);
    ear.rotation.z = side * -0.25;
    return ear;
  }
  const earL = makeEar(-1);
  const earR = makeEar(1);
  head.add(earL);
  head.add(earR);

  // 短小鼻尖
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    noseMat
  );
  nose.position.set(0, -0.04, 0.62);
  nose.scale.set(1, 0.85, 0.85);
  nose.castShadow = true;
  head.add(nose);

  // 嘴部小弧线（用 TorusGeometry 一段）
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.018, 8, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x6e3a3a, roughness: 0.6 })
  );
  mouth.rotation.x = Math.PI; // 弧开口朝下
  mouth.rotation.z = Math.PI; // 翻成微笑弧
  mouth.position.set(0, -0.16, 0.6);
  head.add(mouth);

  // 眼睛（黑色小球 + 高光小白点）
  function makeEye(side) {
    const eg = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
    ball.scale.set(1, 1.05, 0.6);
    eg.add(ball);
    const hi = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    hi.position.set(-0.02, 0.03, 0.04);
    eg.add(hi);
    eg.position.set(side * 0.18, 0.08, 0.54);
    return eg;
  }
  head.add(makeEye(-1));
  head.add(makeEye(1));

  // 胡须（细 CylinderGeometry）
  function makeWhisker(side, idx) {
    const len = 0.32;
    const w = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, len, 6),
      new THREE.MeshStandardMaterial({ color: 0x6e4a2f, roughness: 0.8 })
    );
    w.rotation.z = Math.PI / 2;
    w.rotation.y = side * 0.18 + idx * 0.12;
    w.position.set(side * 0.2, -0.1, 0.5 + idx * 0.05);
    w.translateX(side * len / 2);
    return w;
  }
  for (let s of [-1, 1]) {
    for (let i = 0; i < 2; i++) head.add(makeWhisker(s, i));
  }

  // 头部整体定位（2-3 头身：头大约占身体 1/2 高度）
  head.position.set(0, 1.18, 0);
  group.add(head);

  /* ---------- 身体 ---------- */
  const body = new THREE.Group();
  body.name = "Body";

  // 身体主球（梨形：上窄下宽，更圆润）
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    furMat
  );
  torso.scale.set(1, 1.05, 1);
  torso.castShadow = true;
  body.add(torso);

  // 肚子浅色斑块
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    bellyMat
  );
  belly.scale.set(1, 1.0, 0.55);
  belly.position.set(0, -0.04, 0.22);
  body.add(belly);

  // 背带裤（覆盖身体下半，留出胸口和肩带）
  const pants = new THREE.Mesh(
    new THREE.SphereGeometry(0.515, 32, 24, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.5),
    overallMat
  );
  pants.scale.set(1, 1.05, 1);
  pants.castShadow = true;
  body.add(pants);

  // 背带（两条圆柱从裤腰搭到肩部）
  function makeStrap(side) {
    const s = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12),
      overallDarkMat
    );
    s.position.set(side * 0.16, 0.22, 0.32);
    s.rotation.x = -0.25;
    s.castShadow = true;
    return s;
  }
  body.add(makeStrap(-1));
  body.add(makeStrap(1));

  // 背带纽扣
  function makeButton(side) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), buttonMat);
    b.position.set(side * 0.16, 0.06, 0.46);
    return b;
  }
  body.add(makeButton(-1));
  body.add(makeButton(1));

  // 尾巴（在身体后方）：多段圆柱拼接，可摆动
  const tail = new THREE.Group();
  tail.name = "Tail";
  // 用 3 段圆柱+末端小球，挂在身体后下
  const tailSegs = [];
  let segLen = 0.18, segRad = 0.07;
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Group();
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(segRad, segRad * 1.05, segLen, 12),
      i === 2 ? furDarkMat : furMat
    );
    m.position.y = -segLen / 2;
    m.castShadow = true;
    seg.add(m);
    // 链接：每个 segment 的原点为关节顶部
    if (i === 0) {
      seg.position.set(0, -0.05, -0.45);
    } else {
      seg.position.y = -segLen;
    }
    tailSegs.push(seg);
    if (i > 0) tailSegs[i - 1].add(seg);
    segRad *= 0.7;
  }
  // 末端小球
  const tailTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 14, 14),
    furDarkMat
  );
  tailTip.position.y = -segLen;
  tailTip.castShadow = true;
  tailSegs[2].add(tailTip);

  // tail 整体起点旋转，让尾巴斜向后上
  tailSegs[0].rotation.x = 0.6;
  body.add(tailSegs[0]); // 链根挂在 body 上

  body.position.set(0, 0.7, 0);
  group.add(body);

  /* ---------- 手臂 ---------- */
  function makeArm(side) {
    const arm = new THREE.Group();
    // 上臂（圆柱）
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.08, 0.26, 14),
      furMat
    );
    upper.position.y = -0.13;
    upper.castShadow = true;
    arm.add(upper);
    // 手（小球）
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pawMat);
    hand.position.y = -0.28;
    hand.castShadow = true;
    arm.add(hand);

    arm.position.set(side * 0.5, 0.95, 0.04);
    arm.rotation.z = side * 0.18;
    return arm;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);
  group.add(armL);
  group.add(armR);

  /* ---------- 腿 ---------- */
  function makeLeg(side) {
    const leg = new THREE.Group();
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.09, 0.22, 14),
      overallMat
    );
    upper.position.y = -0.11;
    upper.castShadow = true;
    leg.add(upper);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), pawMat);
    foot.scale.set(1, 0.7, 1.3);
    foot.position.set(0, -0.24, 0.04);
    foot.castShadow = true;
    leg.add(foot);

    leg.position.set(side * 0.2, 0.46, 0);
    return leg;
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  group.add(legL);
  group.add(legR);

  // 贝塔整体偏移，让脚刚好踩在地板 y=0
  group.position.set(0, 0.0, 2.4);
  // 默认面向 -Z 方向（即朝向房间内部 / 家具）
  group.rotation.y = Math.PI;

  /* ---------- 内部状态 ---------- */
  const state = {
    walking: false,
    turning: false,
    pose: "stand",           // stand | sit | sleep | reach
    // 移动目标
    moveTarget: null,        // THREE.Vector3
    moveSpeed: 1.6,          // 单位/秒
    // 转向目标
    turnTarget: null,        // 弧度
    turnSpeed: 3.2,          // 弧度/秒
    // 计时
    t: 0,
    walkPhase: 0
  };

  /* ---------- 工具：平滑朝向 ---------- */
  function faceTo(x, z) {
    const dx = x - group.position.x;
    const dz = z - group.position.z;
    state.turnTarget = Math.atan2(dx, dz);
    state.turning = true;
  }

  /** 平滑转向（最短路径） */
  function turnTo(angle) {
    state.turnTarget = angle;
    state.turning = true;
  }

  /** 走到目标点（自动转向后行走） */
  function walkTo(target) {
    state.moveTarget = target.clone();
    state.walking = true;
    faceTo(target.x, target.z);
  }

  /** 立刻设置位置（用于瞬间归位，不走动画） */
  function teleport(pos) {
    group.position.copy(pos);
    state.moveTarget = null;
    state.walking = false;
    state.turning = false;
  }

  /* ---------- 姿势切换 ---------- */
  function pose(name) {
    state.pose = name;
    switch (name) {
      case "stand":
        head.position.set(0, 1.18, 0);
        body.rotation.x = 0;
        armL.rotation.x = 0; armR.rotation.x = 0;
        armL.rotation.z = -0.18; armR.rotation.z = 0.18;
        legL.rotation.x = 0; legR.rotation.x = 0;
        break;
      case "sit":
        head.position.set(0, 0.95, 0.05);
        body.rotation.x = 0.12;
        body.position.y = 0.5;
        legL.rotation.x = -1.35; legR.rotation.x = -1.35;
        armL.rotation.x = -0.3; armR.rotation.x = -0.3;
        break;
      case "sleep":
        // 蜷成一团：头低下，身体横躺
        head.position.set(0, 0.5, 0.2);
        head.rotation.x = 0.4;
        body.rotation.x = 1.2;
        body.position.y = 0.3;
        armL.rotation.x = -1.0; armR.rotation.x = -1.0;
        legL.rotation.x = -1.4; legR.rotation.x = -1.4;
        break;
      case "reach":
        // 双手前伸（拿东西、读书）
        head.position.set(0, 1.18, 0.04);
        body.rotation.x = 0.04;
        armL.rotation.x = -1.2; armR.rotation.x = -1.2;
        armL.rotation.z = -0.5; armR.rotation.z = 0.5;
        break;
      case "eat":
        // 单手举到嘴边
        head.position.set(0, 1.18, 0.02);
        body.rotation.x = 0.05;
        armR.rotation.x = -1.6; armR.rotation.z = 0.5;
        armL.rotation.x = -0.2; armL.rotation.z = -0.18;
        break;
      default:
        break;
    }
  }
  // 初始姿势
  pose("stand");

  /* ---------- 更新：耳尾动作 / 行走 / 转向 ---------- */
  function update(dt) {
    state.t += dt;

    /* —— 待机：耳朵轻摆、尾巴摇摆、呼吸 —— */
    if (state.pose !== "sleep") {
      // 耳朵左右轻抖
      earL.rotation.x = Math.sin(state.t * 2.2) * 0.1;
      earR.rotation.x = Math.sin(state.t * 2.2 + 0.5) * 0.1;
      // 偶发耳朵竖起
      const perk = Math.max(0, Math.sin(state.t * 0.4) - 0.85) * 6;
      earL.rotation.z = -0.25 + perk * 0.06;
      earR.rotation.z = 0.25 - perk * 0.06;
    } else {
      // 睡觉：耳朵垂下
      earL.rotation.z = -0.45;
      earR.rotation.z = 0.45;
      earL.rotation.x = 0.2;
      earR.rotation.x = 0.2;
    }

    // 尾巴摆动（多段，越靠末端摆幅越大）
    const tailSwing = state.walking ? 1.8 : 0.9;
    tailSegs[0].rotation.y = Math.sin(state.t * tailSwing) * 0.18;
    tailSegs[1].rotation.y = Math.sin(state.t * tailSwing + 0.4) * 0.28;
    tailSegs[2].rotation.y = Math.sin(state.t * tailSwing + 0.8) * 0.4;
    // 尾巴整体微微下垂/上翘（呼吸感）
    tailSegs[0].rotation.x = 0.6 + Math.sin(state.t * 1.2) * 0.04;

    /* —— 行走 —— */
    if (state.walking && state.moveTarget) {
      const pos = group.position;
      const tgt = state.moveTarget;
      const dx = tgt.x - pos.x;
      const dz = tgt.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.06) {
        // 到达
        state.walking = false;
        state.moveTarget = null;
        state.walkPhase = 0;
        legL.rotation.x = 0; legR.rotation.x = 0;
        armL.rotation.x = 0; armR.rotation.x = 0;
      } else {
        // 朝目标走
        const step = Math.min(state.moveSpeed * dt, dist);
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;

        // 步态：四肢前后摆动 + 身体上下起伏
        state.walkPhase += dt * 8;
        const ph = state.walkPhase;
        legL.rotation.x = Math.sin(ph) * 0.6;
        legR.rotation.x = -Math.sin(ph) * 0.6;
        // 行走时姿势临时：伸手摆动
        if (state.pose === "stand") {
          armL.rotation.x = -Math.sin(ph) * 0.5;
          armR.rotation.x = Math.sin(ph) * 0.5;
        }
        // 身体起伏（小幅）
        group.position.y = Math.abs(Math.sin(ph)) * 0.04;
        // 转向跟随行走方向
        state.turnTarget = Math.atan2(dx, dz);
        state.turning = true;
      }
    } else if (!state.walking) {
      // 不走时呼吸
      const breath = Math.sin(state.t * 1.6) * 0.012;
      body.scale.set(1 + breath, 1 + breath, 1);
    }

    /* —— 转向（最短角差平滑插值） —— */
    if (state.turning && state.turnTarget != null) {
      let cur = group.rotation.y;
      let tgt = state.turnTarget;
      // 归一到 -PI..PI
      let d = ((tgt - cur + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (Math.abs(d) < 0.02) {
        group.rotation.y = tgt;
        state.turning = false;
      } else {
        const step = Math.sign(d) * Math.min(Math.abs(d), state.turnSpeed * dt);
        group.rotation.y += step;
      }
    }
  }

  /** 查询当前状态（供 UI/行为系统读取） */
  function getState() {
    return {
      pose: state.pose,
      walking: state.walking,
      turning: state.turning,
      position: group.position.clone(),
      rotationY: group.rotation.y
    };
  }

  return {
    group,
    head,
    body,
    earL,
    earR,
    armL,
    armR,
    legL,
    legR,
    tail: tailSegs[0],
    update,
    walkTo,
    turnTo,
    faceTo,
    teleport,
    pose,
    getState
  };
}
