/* ============================================================
 * behaviors.js — 模块化行为系统
 *
 * 设计目标：
 *   - 行为 = 数据 + 步骤序列（walk → face → pose → action → resume）
 *   - 每个 behavior 描述：
 *       {
 *         id, name, emoji,            // UI 显示
 *         furnitureId,                 // 关联家具（点家具触发它）
 *         duration: {min, max},        // 行为持续时间（秒）
 *         onStart(ctx),                // 进入行为时（设置姿势）
 *         onTick(ctx, t),              // 持续中的细节动画（耳朵/尾巴/啃咬）
 *         onEnd(ctx)                   // 结束时清理
 *       }
 *   - 调度器：自动模式下，结束后随机等待 → 选下一个行为
 *   - 添加/分离行为：只需在 BEHAVIORS 列表 push/remove
 *
 * ctx = {
 *   beta,        // character.js 返回的对象
 *   scene, THREE,
 *   helpers,     // 临时道具容器（奶酪/书本等可挂在 helpers 上）
 *   setStatus(text, emoji)  // UI 状态气泡
 * }
 * ============================================================ */

import * as THREE from "three";

/* ============================================================
 * 内置行为清单
 * ============================================================ */

export const BEHAVIORS = [

  /* ---------- 烹饪 ---------- */
  {
    id: "cook",
    name: "烹饪",
    emoji: "🍳",
    furnitureId: "stove",
    duration: { min: 6, max: 9 },
    onStart(ctx) {
      ctx.beta.pose("reach");
      ctx.beta.faceTo(ctx.furnitureSpot.x, ctx.furnitureSpot.z);
      ctx.setStatus("贝塔正在灶台边做饭，香味飘出来啦~", "🍳");
      // 锅盖作为可摆动道具（其实灶台已有锅）
    },
    onTick(ctx, t, dt) {
      // 双手小幅搅动
      const ph = t * 4;
      ctx.beta.armR.rotation.x = -1.2 + Math.sin(ph) * 0.18;
      ctx.beta.armL.rotation.x = -0.3 + Math.sin(ph + 1) * 0.1;
      // 身体微微前倾后仰
      ctx.beta.body.rotation.x = 0.04 + Math.sin(t * 2) * 0.04;
      // 偶尔闻香：耳朵竖起
      if (Math.sin(t * 1.5) > 0.6) {
        ctx.beta.earL.rotation.z = -0.5;
        ctx.beta.earR.rotation.z = 0.5;
      }
    },
    onEnd(ctx) {
      ctx.beta.pose("stand");
    }
  },

  /* ---------- 吃奶酪 ---------- */
  {
    id: "eat",
    name: "吃奶酪",
    emoji: "🧀",
    furnitureId: "plate",
    duration: { min: 5, max: 7 },
    onStart(ctx) {
      ctx.beta.pose("eat");
      ctx.beta.faceTo(ctx.furnitureSpot.x, ctx.furnitureSpot.z);
      ctx.setStatus("贝塔捧起一块奶酪，小口小口地啃着~", "🧀");
      // 给贝塔手里塞一块奶酪
      const cheese = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.6 })
      );
      cheese.name = "HelperCheese";
      cheese.position.set(0.55, 0.0, -0.05);
      cheese.rotation.set(0.2, 0, -0.2);
      cheese.castShadow = true;
      ctx.beta.armR.add(cheese);
      ctx.cheese = cheese;
    },
    onTick(ctx, t, dt) {
      // 啃咬：奶酪小幅上下，手轻微送向嘴
      const bite = Math.abs(Math.sin(t * 3));
      if (ctx.cheese) {
        ctx.cheese.position.y = 0.02 + bite * 0.04;
        ctx.cheese.scale.setScalar(Math.max(0.3, 1 - (t / 6) * 0.5)); // 越吃越小
      }
      ctx.beta.head.rotation.x = -0.1 - bite * 0.15;
      ctx.beta.earL.rotation.z = -0.25 + Math.sin(t * 5) * 0.08;
      ctx.beta.earR.rotation.z = 0.25 - Math.sin(t * 5) * 0.08;
    },
    onEnd(ctx) {
      if (ctx.cheese) {
        ctx.beta.armR.remove(ctx.cheese);
        ctx.cheese.geometry.dispose();
        ctx.cheese.material.dispose();
        ctx.cheese = null;
      }
      ctx.beta.pose("stand");
    }
  },

  /* ---------- 阅读 ---------- */
  {
    id: "read",
    name: "阅读",
    emoji: "📖",
    furnitureId: "chair",
    duration: { min: 7, max: 10 },
    onStart(ctx) {
      ctx.beta.pose("sit");
      ctx.beta.faceTo(ctx.furnitureSpot.x, ctx.furnitureSpot.z);
      ctx.setStatus("贝塔坐在椅子上，捧着一本书看得入迷~", "📖");
      // 给贝塔手里塞一本小书
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.03, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x9b5a5a, roughness: 0.7 })
      );
      book.name = "HelperBook";
      book.position.set(0, 0.05, 0.18);
      book.rotation.x = -1.0;
      book.castShadow = true;
      // 内页（白纸）
      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.02, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xf2e4c4 })
      );
      pages.position.z = 0.0;
      book.add(pages);
      ctx.beta.body.add(book);
      ctx.book = book;
    },
    onTick(ctx, t, dt) {
      // 翻页：书小幅开合
      if (ctx.book) {
        ctx.book.rotation.x = -1.0 + Math.sin(t * 1.8) * 0.12;
      }
      // 头微低、随节奏左右轻点
      ctx.beta.head.rotation.x = 0.18 + Math.sin(t * 1.2) * 0.04;
      ctx.beta.head.rotation.y = Math.sin(t * 0.6) * 0.1;
      // 偶发点头
      if (Math.sin(t * 2.4) > 0.92) {
        ctx.beta.head.rotation.x += 0.12;
      }
      ctx.beta.earL.rotation.z = -0.45;
      ctx.beta.earR.rotation.z = 0.45;
    },
    onEnd(ctx) {
      if (ctx.book) {
        ctx.beta.body.remove(ctx.book);
        ctx.book.geometry.dispose();
        ctx.book.material.dispose();
        ctx.book = null;
      }
      ctx.beta.pose("stand");
    }
  },

  /* ---------- 小睡 ---------- */
  {
    id: "sleep",
    name: "小睡",
    emoji: "😴",
    furnitureId: "bed",
    duration: { min: 6, max: 9 },
    onStart(ctx) {
      ctx.beta.pose("sleep");
      ctx.beta.faceTo(ctx.furnitureSpot.x, ctx.furnitureSpot.z);
      ctx.setStatus("贝塔蜷在火柴盒床上，呼吸均匀地打起了盹…", "😴");
      // 飘出小 Z 字（用一个sprite）
    },
    onTick(ctx, t, dt) {
      // 身体随呼吸缩放
      const breath = Math.sin(t * 1.0) * 0.04;
      ctx.beta.body.scale.set(1 + breath, 1 + breath, 1);
      ctx.beta.head.position.y = 0.5 + Math.sin(t * 1.0) * 0.02;
      // 耳朵完全放松
      ctx.beta.earL.rotation.z = -0.6;
      ctx.beta.earR.rotation.z = 0.6;
      ctx.beta.earL.rotation.x = 0.3;
      ctx.beta.earR.rotation.x = 0.3;
    },
    onEnd(ctx) {
      ctx.beta.pose("stand");
      ctx.setStatus("贝塔伸了个大大的懒腰，睡饱啦~", "🌞");
    }
  },

  /* ---------- 打扫 ---------- */
  {
    id: "clean",
    name: "打扫",
    emoji: "🧹",
    furnitureId: "broom",
    duration: { min: 6, max: 9 },
    onStart(ctx) {
      ctx.beta.pose("stand");
      ctx.beta.faceTo(ctx.furnitureSpot.x, ctx.furnitureSpot.z);
      ctx.setStatus("贝塔握起小扫帚，认真地扫地上的碎屑~", "🧹");
      // 给右手塞一把扫帚（简化版）
      const broom = new THREE.Group();
      broom.name = "HelperBroom";
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.02, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xd9a674, roughness: 0.7 })
      );
      handle.position.y = -0.25;
      broom.add(handle);
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.12, 0.18, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a5a3b, roughness: 0.8 })
      );
      head.position.y = -0.55;
      broom.add(head);
      broom.position.set(0.04, -0.3, 0.06);
      broom.rotation.z = 0.4;
      ctx.beta.armR.add(broom);
      ctx.broom = broom;
    },
    onTick(ctx, t, dt) {
      // 扫帚前后摆
      const sw = Math.sin(t * 4);
      if (ctx.broom) {
        ctx.broom.rotation.x = sw * 0.6;
      }
      ctx.beta.armR.rotation.x = -0.8 + sw * 0.3;
      // 身体微左右倾
      ctx.beta.body.rotation.y = Math.sin(t * 4) * 0.1;
      ctx.beta.group.position.x = ctx.furnitureSpot.x + Math.sin(t * 4) * 0.1;
      ctx.beta.earL.rotation.z = -0.3;
      ctx.beta.earR.rotation.z = 0.3;
    },
    onEnd(ctx) {
      if (ctx.broom) {
        ctx.beta.armR.remove(ctx.broom);
        ctx.broom.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        ctx.broom = null;
      }
      ctx.beta.pose("stand");
      ctx.setStatus("打扫完毕，洞穴又变得整整齐齐啦~", "✨");
    }
  }
];

/* ============================================================
 * 行为调度器 BehaviorScheduler
 *   - 自动模式：当前行为结束后随机等待，再从 BEHAVIORS 选一个
 *   - 手动触发：点击家具 → 立刻打断当前 → 走过去 → 执行
 *   - 暂停时不更新（但保留当前状态）
 * ============================================================ */

export class BehaviorScheduler {
  constructor({ beta, scene, three, instances, setStatus, furnitureById }) {
    this.beta = beta;
    this.scene = scene;
    this.THREE = three;
    this.instances = instances;
    this.setStatus = setStatus || (() => {});
    this.furnitureById = furnitureById; // id -> instance { spot, faceY, mesh }
    this.behaviors = BEHAVIORS;
    this.behaviorById = Object.fromEntries(this.behaviors.map((b) => [b.id, b]));

    this.current = null;        // 当前行为对象
    this.elapsed = 0;
    this.duration = 0;
    this.waiting = false;       // 是否在等待下一个行为
    this.waitElapsed = 0;
    this.waitTarget = 0;
    this.auto = true;           // 是否自动模式
    this.paused = false;

    // 即将开始的行为（手动触发时先走到家具边）
    this.pendingBehaviorId = null;

    // 当前行为期间的持久 ctx（保持 onStart 设置的临时道具引用）
    this.ctx = null;
  }

  setAuto(v) { this.auto = v; }
  setPaused(v) { this.paused = v; }

  /** 触发某个行为：先走到对应家具附近，再执行 */
  trigger(behaviorId) {
    const b = this.behaviorById[behaviorId];
    if (!b) return;
    const inst = this.furnitureById[b.furnitureId];
    if (!inst) return;
    this.pendingBehaviorId = behaviorId;
    // 中断当前行为（如正在做）→ 站起来 → 走过去
    this._endCurrent();
    // 走到家具前一点（避免穿模）
    const arrive = new this.THREE.Vector3(inst.spot.x, 0, inst.spot.z + 0.7);
    this.beta.walkTo(arrive);
  }

  /** 开始某个行为：构建持久 ctx */
  _startBehavior(b) {
    const inst = this.furnitureById[b.furnitureId];
    this.current = b;
    this.elapsed = 0;
    this.duration = b.duration.min + Math.random() * (b.duration.max - b.duration.min);
    this.waiting = false;
    // 持久 ctx：onStart 在此挂载临时道具，onTick/onEnd 复用同一个对象
    this.ctx = {
      beta: this.beta,
      scene: this.scene,
      THREE: this.THREE,
      furnitureSpot: inst.spot,
      furnitureInstance: inst,
      setStatus: this.setStatus,
      cheese: null,
      book: null,
      broom: null
    };
    b.onStart && b.onStart(this.ctx);
  }

  _endCurrent() {
    if (this.current && this.ctx) {
      this.current.onEnd && this.current.onEnd(this.ctx);
    }
    this.current = null;
    this.ctx = null;
    this.waiting = false;
    this.waitElapsed = 0;
  }

  /** 主循环更新 */
  update(dt) {
    if (this.paused) return;

    // 等待下一个行为
    if (this.waiting) {
      this.waitElapsed += dt;
      if (this.waitElapsed >= this.waitTarget) {
        this.waiting = false;
        // 自动模式下随机选一个行为
        if (this.auto) {
          const b = this.behaviors[Math.floor(Math.random() * this.behaviors.length)];
          this.trigger(b.id);
        }
      }
      return;
    }

    // 正在走向 pending 行为
    if (this.pendingBehaviorId && !this.current) {
      const st = this.beta.getState();
      if (!st.walking && !st.turning) {
        const b = this.behaviorById[this.pendingBehaviorId];
        if (b) this._startBehavior(b);
        this.pendingBehaviorId = null;
      }
      return;
    }

    // 当前行为中
    if (this.current) {
      this.elapsed += dt;
      this.current.onTick && this.current.onTick(this.ctx, this.elapsed, dt);

      if (this.elapsed >= this.duration) {
        this._endCurrent();
        // 进入等待
        this.waiting = true;
        this.waitElapsed = 0;
        this.waitTarget = 1.6 + Math.random() * 2.4;
        if (!this.auto) {
          this.setStatus("贝塔在洞穴里溜达，点家具来喊它做事吧~", "🏡");
        }
      }
    } else if (this.auto) {
      // 自动模式下若没有当前行为且不在等待，进入等待
      this.waiting = true;
      this.waitElapsed = 0;
      this.waitTarget = 1.0 + Math.random() * 1.5;
    }
  }
}
