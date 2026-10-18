// 端末モックの描画部品。外装カスタマイザーとシミュレーターの両方で使います。
// 寸法は mm 単位で CSS 変数 --mm（1mm あたりの px）に掛けて描画します。
// 数値の出典と測り方は docs/measurements.md を参照してください。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  const I18n = window.I18n;

  // 表示領域（本体左上からの mm）。幅と高さは 4.03 インチ 1080x1200 からの算出値、位置は正面図の実測値。
  const SCREEN = { x: 5.1, y: 5.5, w: 68.46, h: 76.07 };
  // 前面カメラのパンチホール（本体左上からの中心位置と直径、mm）。
  const PUNCH = { cx: 10.3, cy: 10.3, d: 3.8 };
  // キーボード: 上 3 段は 10 列の格子、最下段は catalog.js の cx で個別配置。
  const KB = {
    top: 88.5,
    height: 37,
    colX0: 6.16,
    pitch: 7.39,
    rowY: [93.4, 102.5, 111.6],
    bottomY: 120.0,
    keyW: 6.0,
    keyH: 6.9,
    roundH: 5.6,
    spaceH: 5.0,
  };

  // 本体の外形（mm）。厚みは公開値の 12 mm、角の半径は正面図からの計測値。
  // wall は側面フレームの高さ。背面カバーはフレームの縁より少し内側から盛り上がります。
  const BODY = { w: 78.63, h: 130.5, t: 12, r: 8.5, wall: 7.7 };
  const CORNER_SEGMENTS = 6;
  // 背面の断面（上・左・右の縁からの距離 d と、前面からの厚み t、mm）。背面写真と上面写真からの計測値。
  // 縁から RIM までは本体色のフレームの面で、その内側から背面カバーがほぼ平らな斜面で立ち上がります。
  const RIM = 1.5;
  const BACK_PROFILE = [
    { d: 0, t: 7.7 },
    { d: RIM, t: 7.7 },
    { d: 5, t: 10.6 },
    { d: 7, t: 11.5 },
    { d: 8.5, t: 11.9 },
  ];
  // 下端側の斜面は上・左・右の約 3.5 倍の幅（縁から約 26 mm）で、ゆるやかに下がります（背面写真の陰影から計測）。
  const BOTTOM_STRETCH = 3.5;
  const bottomInset = (d) => (d <= RIM ? d : RIM + (d - RIM) * BOTTOM_STRETCH);
  const LIGHT = normalize([-0.35, -0.55, -0.75]);

  // 側面の部品（mm）。title は i18n.js の翻訳キーです。pos は上面なら本体左端から、左右の側面なら本体上端からの距離。
  const SIDE_PARTS = {
    top: [
      { cls: "s-key", from: 52.9, to: 65.5, title: "dev.power" },
      { cls: "s-jack", from: 17.7, to: 21.3, title: "dev.jack" },
    ],
    left: [
      { cls: "s-switch", from: 14.6, to: 20.4, title: "dev.kill" },
      { cls: "s-key", from: 26.3, to: 39.3, title: "dev.voiceKey" },
      { cls: "s-key", from: 42.7, to: 55.7, title: "dev.lowerKey" },
    ],
    right: [
      { cls: "s-led", from: 34.8, to: 52.4, title: "dev.led" },
      { cls: "s-key", from: 36.2, to: 51.4, title: "dev.rightKey" },
    ],
    bottom: [{ cls: "s-usb", from: 34.8, to: 43.8, title: "dev.usb" }],
  };

  const mmCalc = (v) => `calc(${v} * var(--mm))`;

  function el(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  function normalize(v) {
    const l = Math.hypot(...v);
    return v.map((c) => c / l);
  }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // 側面フレームの帯（幅 width mm × 高さ BODY.wall）を、本体中心から (x, y) の位置に、外向きの法線が角度 deg を向くように置きます。
  // rotateX(90deg) で帯を前後方向に起こし、rotateZ で法線の向きを合わせます。帯の下端が前面側になります。
  function sideStrip(parent, cls, x, y, deg, width) {
    const strip = el("div", "side " + cls, parent);
    const z = BODY.t / 2 - BODY.wall / 2;
    strip.style.width = mmCalc(width);
    strip.style.height = mmCalc(BODY.wall);
    strip.style.left = `calc(50% - ${width / 2} * var(--mm))`;
    strip.style.top = `calc(50% - ${BODY.wall / 2} * var(--mm))`;
    strip.style.transform =
      `translate3d(${mmCalc(x)}, ${mmCalc(y)}, ${mmCalc(z)}) rotateZ(${deg + 90}deg) rotateX(90deg)`;
    return strip;
  }

  // 上・左・右の縁から d mm（下端は bottomInset(d) mm）内側の角丸長方形の輪郭（本体中心が原点、z は前面方向が正）。
  // どの輪郭も同じ角度で点を取るので、隣り合う輪郭の間はほぼ平らな台形になります。
  function ring(d, z) {
    const { w, h, r } = BODY;
    const rr = Math.max(2, r - d * 0.3);
    const ix = w / 2 - d - rr;
    const top = -h / 2 + d + rr;
    const bottom = h / 2 - bottomInset(d) - rr;
    const corners = [[ix, top, -90], [ix, bottom, 0], [-ix, bottom, 90], [-ix, top, 180]];
    const pts = [];
    for (const [cx, cy, start] of corners) {
      for (let k = 0; k <= CORNER_SEGMENTS; k++) {
        const a = ((start + (k * 90) / CORNER_SEGMENTS) * Math.PI) / 180;
        pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a), z]);
      }
    }
    return { pts, rr };
  }

  // 平らな四角形（P0→P1→P2→P3）を、matrix3d と clip-path で 1 枚の要素として描きます。
  // 計測点の間は直線なので、面は計測点ごとに 1 段だけ作ります（3D の要素が多いと Chrome の描画が崩れるため）。
  function backPanels(root) {
    const panels = [];
    const rings = BACK_PROFILE.map((p) => ring(p.d, BODY.t / 2 - p.t).pts);
    for (let b = 0; b < rings.length - 1; b++) {
      const outer = rings[b];
      const inner = rings[b + 1];
      const cls = BACK_PROFILE[b + 1].d <= RIM ? "chamfer rim" : "chamfer";
      for (let i = 0; i < outer.length; i++) {
        const j = (i + 1) % outer.length;
        const quad = [outer[i], outer[j], inner[j], inner[i]];
        if (Math.hypot(...sub3(quad[1], quad[0])) < 1e-3) continue;
        const node = el("div", cls, root);
        let n = normalize(cross3(sub3(quad[1], quad[0]), sub3(quad[3], quad[0])));
        const mid = quad.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]);
        if (dot3(n, [mid[0], mid[1], -40]) < 0) n = n.map((c) => -c);
        panels.push({ node, quad, n, mid });
      }
    }
    return panels;
  }

  function layoutPanels(panels, mm) {
    const { w, h } = BODY;
    for (const { node, quad, n } of panels) {
      const [p0, p1] = quad;
      const e1 = normalize(sub3(p1, p0));
      const e2 = cross3(n, e1);

      // 隣の面との継ぎ目が透けないよう、重心から少しだけ広げます。
      const local = quad.map((p) => {
        const q = sub3(p, p0);
        return [dot3(q, e1), dot3(q, e2)];
      });
      const cu = local.reduce((a, q) => a + q[0] / 4, 0);
      const cv = local.reduce((a, q) => a + q[1] / 4, 0);
      const grown = local.map(([u, v]) => {
        const du = u - cu;
        const dv = v - cv;
        const l = Math.hypot(du, dv) || 1;
        return [u + (du / l) * 0.12, v + (dv / l) * 0.12];
      });
      const minU = Math.min(...grown.map((q) => q[0]));
      const minV = Math.min(...grown.map((q) => q[1]));
      const maxU = Math.max(...grown.map((q) => q[0]));
      const maxV = Math.max(...grown.map((q) => q[1]));
      const o = [
        (p0[0] + minU * e1[0] + minV * e2[0] + w / 2) * mm,
        (p0[1] + minU * e1[1] + minV * e2[1] + h / 2) * mm,
        (p0[2] + minU * e1[2] + minV * e2[2]) * mm,
      ];
      node.style.width = (maxU - minU) * mm + "px";
      node.style.height = (maxV - minV) * mm + "px";
      node.style.clipPath = `polygon(${grown
        .map(([u, v]) => `${((u - minU) * mm).toFixed(2)}px ${((v - minV) * mm).toFixed(2)}px`)
        .join(", ")})`;
      node.style.transform = `matrix3d(${[...e1, 0, ...e2, 0, ...n, 0, ...o, 1].map((c) => +c.toFixed(5)).join(",")})`;
      node.style.setProperty("--tint", tint(0.78 + 0.3 * Math.max(0, dot3(n, LIGHT))));
    }
  }

  // 明るさ（1 が元の色）を、上に重ねる半透明の色に置き換えます。
  // filter: brightness() は要素ごとに描画面が増え、3D の要素が多いと Chrome の描画が崩れるため使いません。
  function tint(shade) {
    return shade < 1 ? `rgba(0, 0, 0, ${(1 - shade).toFixed(3)})` : `rgba(255, 255, 255, ${((shade - 1) * 0.6).toFixed(3)})`;
  }

  // 向きから見て裏側を向いている面は、backface-visibility に頼らず JavaScript で隠します。
  // Safari では子要素を持つ面の backface-visibility が効かず、Chrome では隠れた面も描画の負担になるためです。
  // rx, ry は CSS の rotateX / rotateY の角度、eye は本体中心から視点までの距離（mm）です。
  function cull(faces, rx, ry, eye) {
    const [sx, cx] = [Math.sin((rx * Math.PI) / 180), Math.cos((rx * Math.PI) / 180)];
    const [sy, cy] = [Math.sin((ry * Math.PI) / 180), Math.cos((ry * Math.PI) / 180)];
    const rot = ([x, y, z]) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
    };
    for (const f of faces) {
      const n = rot(f.n);
      const c = rot(f.c);
      const visible = n[0] * -c[0] + n[1] * -c[1] + n[2] * (eye - c[2]) > 0;
      if (f.visible !== visible) {
        f.visible = visible;
        f.node.style.visibility = visible ? "" : "hidden";
      }
    }
  }

  function buildSides(root, faces) {
    const { w, h, r } = BODY;
    const straights = {
      top: { x: 0, y: -h / 2, deg: -90, len: w - 2 * r },
      right: { x: w / 2, y: 0, deg: 0, len: h - 2 * r },
      bottom: { x: 0, y: h / 2, deg: 90, len: w - 2 * r },
      left: { x: -w / 2, y: 0, deg: 180, len: h - 2 * r },
    };
    for (const [name, s] of Object.entries(straights)) {
      const strip = sideStrip(root, "side-" + name, s.x, s.y, s.deg, s.len);
      faces.push(stripFace(strip, s.x, s.y, s.deg));
      for (const part of SIDE_PARTS[name]) {
        // 帯の x 方向は、上面では左→右、右側面では上→下、下面では右→左、左側面では下→上を向きます。
        const a = name === "left" ? h - r - part.to : name === "bottom" ? w - r - part.to : part.from - r;
        const node = el("div", "side-part " + part.cls, strip);
        I18n.title(node, part.title);
        node.style.left = mmCalc(a);
        node.style.width = mmCalc(part.to - part.from);
      }
    }

    const step = 90 / CORNER_SEGMENTS;
    const segW = 2 * r * Math.sin((step / 2) * (Math.PI / 180)) + 0.05;
    const apothem = r * Math.cos((step / 2) * (Math.PI / 180));
    const corners = [
      { cx: w / 2 - r, cy: -h / 2 + r, start: -90 },
      { cx: w / 2 - r, cy: h / 2 - r, start: 0 },
      { cx: -w / 2 + r, cy: h / 2 - r, start: 90 },
      { cx: -w / 2 + r, cy: -h / 2 + r, start: 180 },
    ];
    for (const c of corners) {
      for (let k = 0; k < CORNER_SEGMENTS; k++) {
        const deg = c.start + (k + 0.5) * step;
        const rad = (deg * Math.PI) / 180;
        const x = c.cx + apothem * Math.cos(rad);
        const y = c.cy + apothem * Math.sin(rad);
        faces.push(stripFace(sideStrip(root, "side-corner", x, y, deg, segW), x, y, deg));
      }
    }
  }

  function stripFace(node, x, y, deg) {
    const rad = (deg * Math.PI) / 180;
    return { node, n: [Math.cos(rad), Math.sin(rad), 0], c: [x, y, BODY.t / 2 - BODY.wall / 2] };
  }

  function create(container, options = {}) {
    const root = el("div", "device", container);
    let panels = [];
    const faces = [];
    if (options.solid) {
      root.classList.add("solid");
      buildSides(root, faces);
      panels = backPanels(root);
      for (const p of panels) faces.push({ node: p.node, n: p.n, c: p.mid });
    }

    const front = el("div", "face front", root);
    el("div", "glass", front);
    const screen = el("div", "screen", front);
    const inner = el("div", "screen-inner", screen);
    I18n.title(el("div", "punch", front), "dev.punch");
    const keyboard = el("div", "keyboard", front);
    el("div", "speaker left", front);
    el("div", "speaker right", front);

    const powerKey = el("div", "side-key top", front);
    I18n.title(powerKey, "dev.power");
    I18n.title(el("div", "jack", front), "dev.jack");
    const voiceKey = el("div", "side-key left upper", front);
    I18n.title(voiceKey, "dev.voiceKey");
    const lowerKey = el("div", "side-key left lower", front);
    I18n.title(lowerKey, "dev.lowerKey");
    // LED はキーの下に重ね、キーの周りにはみ出した部分がリングとして光ります。
    const led = el("div", "led", front);
    I18n.title(led, "dev.led");
    const rightKey = el("div", "side-key right", front);
    I18n.title(rightKey, "dev.rightKey");
    const killSwitch = el("button", "side-switch", front);
    killSwitch.type = "button";
    killSwitch.tabIndex = -1;
    I18n.title(killSwitch, "dev.kill");

    const back = el("div", "face back", root);
    if (options.solid) {
      faces.push({ node: front, n: [0, 0, 1], c: [0, 0, BODY.t / 2] });
      faces.push({ node: back, n: [0, 0, -1], c: [0, 0, -BODY.t / 2] });
    }
    const plateau = el("div", "plateau", back);
    if (options.solid) {
      const top = BACK_PROFILE[BACK_PROFILE.length - 1];
      plateau.style.inset = `${mmCalc(top.d)} ${mmCalc(top.d)} ${mmCalc(bottomInset(top.d))}`;
      plateau.style.borderRadius = mmCalc(Math.max(2, BODY.r - top.d * 0.3));
    }
    // 立体表示では、カメラ部を背面から盛り上がった塊として、薄い板を重ねて厚みを出します。
    if (options.solid) {
      for (let k = 1; k <= 8; k++) {
        const layer = el("div", "camera-layer", back);
        layer.style.setProperty("--k", k);
      }
    }
    const camera = el("div", "camera", back);
    el("div", "lens", camera);
    el("div", "flash", camera);
    el("div", "mag-ring", back);
    el("div", "back-mark", back).textContent = "COMMUNITY MOCK";

    let mm = 4;
    let rotation = { rx: 0, ry: 0 };
    let logical = { w: 411, h: 457 };
    let keyHandler = null;
    let killHandler = null;
    let subs = new Map();

    function applyScale() {
      inner.style.width = logical.w + "px";
      inner.style.height = logical.h + "px";
      inner.style.transform = `scale(${(SCREEN.w * mm) / logical.w})`;
    }

    function placeKey(keyEl, cx, cy, w, h) {
      keyEl.style.left = mmCalc(cx - w / 2);
      keyEl.style.top = mmCalc(cy - KB.top - h / 2);
      keyEl.style.width = mmCalc(w);
      keyEl.style.height = mmCalc(h);
    }

    const api = {
      root, front, back, screen, inner, keyboard, led, voiceKey, killSwitch,

      setBody(id) {
        const body = C.bodies.find((b) => b.id === id) || C.bodies[0];
        root.style.setProperty("--body", body.color);
        root.style.setProperty("--key-bg", body.keyBg);
        root.style.setProperty("--key-fg", body.keyFg);
        root.dataset.body = body.id;
      },

      setCover(id) {
        const cover = C.covers.find((c) => c.id === id) || C.covers[0];
        root.style.setProperty("--cover", cover.bg);
      },

      setLayout(id) {
        const layout = C.layouts[id] || C.layouts.qwerty;
        keyboard.replaceChildren();
        subs = new Map();
        layout.rows.forEach((row, r) => {
          row.forEach((key, i) => {
            const keyEl = el("button", "key" + (key.cls ? " " + key.cls : ""), keyboard);
            keyEl.type = "button";
            keyEl.tabIndex = -1;
            keyEl.dataset.value = key.value;
            if (key.titleKey) I18n.title(keyEl, key.titleKey);
            if (key.sub) {
              el("span", "sub", keyEl).textContent = key.sub;
              subs.set(key.value, key.sub);
            }
            el("span", "main", keyEl).textContent = key.label;

            if (r < 3) {
              placeKey(keyEl, KB.colX0 + i * KB.pitch, KB.rowY[r], KB.keyW, KB.keyH);
            } else {
              const h = key.cls.includes("space") ? KB.spaceH : KB.roundH;
              placeKey(keyEl, key.cx, KB.bottomY, key.w || KB.keyW, h);
            }
          });
        });
      },

      subFor(value) {
        return subs.get(value);
      },

      onKey(handler) {
        keyHandler = handler;
      },

      onKillSwitch(handler) {
        killHandler = handler;
      },

      setKilled(on) {
        root.classList.toggle("killed", on);
      },

      pressKey(value) {
        const v = value.length === 1 ? value.toLowerCase() : value;
        const keyEl = keyboard.querySelector(`[data-value="${CSS.escape(v)}"]`);
        if (!keyEl) return;
        keyEl.classList.add("pressed");
        setTimeout(() => keyEl.classList.remove("pressed"), 120);
      },

      setLed(color) {
        if (color) {
          led.style.setProperty("--led", color);
          led.classList.add("on");
        } else {
          led.classList.remove("on");
        }
      },

      // 立体表示の向きを変えます（CSS の transition は使わず、呼び出し側が毎フレーム呼びます）。
      setRotation(rx, ry) {
        rotation = { rx, ry };
        root.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        const perspective = parseFloat(getComputedStyle(container).perspective) || 1800;
        cull(faces, rx, ry, perspective / mm);
      },

      setLogicalSize(w, h) {
        logical = { w, h };
        applyScale();
      },

      fit(stage) {
        const w = stage.clientWidth - 64;
        const h = stage.clientHeight - 72;
        if (w <= 0 || h <= 0) return;
        mm = Math.max(1.5, Math.min(h / 134, w / 84, 5.4));
        root.style.setProperty("--mm", mm + "px");
        applyScale();
        layoutPanels(panels, mm);
        if (faces.length) api.setRotation(rotation.rx, rotation.ry);
      },
    };

    keyboard.addEventListener("pointerdown", (e) => {
      const keyEl = e.target.closest(".key");
      if (!keyEl) return;
      // フォーカスを奪わないようにして、PC のキーボード入力と同じ扱いにします。
      e.preventDefault();
      api.pressKey(keyEl.dataset.value);
      if (keyHandler) keyHandler(keyEl.dataset.value);
    });

    killSwitch.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const on = !root.classList.contains("killed");
      api.setKilled(on);
      if (killHandler) killHandler(on);
    });

    return api;
  }

  window.CommunicatorDevice = { create, SCREEN, PUNCH };
})();
