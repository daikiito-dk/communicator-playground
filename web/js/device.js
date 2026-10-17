// 端末モックの描画部品。外装カスタマイザーとシミュレーターの両方で使います。
// 寸法は mm 単位で CSS 変数 --mm（1mm あたりの px）に掛けて描画します。
// 数値の出典と測り方は docs/measurements.md を参照してください。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;

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
    keyH: 7.6,
    roundH: 5.6,
    spaceH: 5.0,
  };

  // 本体の外形（mm）。厚みは公開値の 12 mm、角の半径は正面図からの計測値。
  const BODY = { w: 78.63, h: 130.5, t: 12, r: 8.5 };
  const CORNER_SEGMENTS = 6;

  // 側面の部品（mm）。pos は上面なら本体左端から、左右の側面なら本体上端からの距離。
  const SIDE_PARTS = {
    top: [
      { cls: "s-key", from: 52.9, to: 65.5, title: "電源キー" },
      { cls: "s-jack", from: 17.7, to: 21.3, title: "3.5 mm イヤホンジャック" },
    ],
    left: [
      { cls: "s-switch", from: 14.6, to: 20.4, title: "キルスイッチ" },
      { cls: "s-key", from: 26.3, to: 39.3, title: "サイドキー（上）" },
      { cls: "s-key", from: 42.7, to: 55.7, title: "サイドキー（下）" },
    ],
    right: [
      { cls: "s-led", from: 34.8, to: 52.4, title: "Signal LED" },
      { cls: "s-key", from: 36.2, to: 51.4, title: "右側面のキー" },
    ],
    bottom: [],
  };

  const mmCalc = (v) => `calc(${v} * var(--mm))`;

  function el(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  // 厚み方向の帯（幅 width mm × 厚み BODY.t）を、本体中心から (x, y) の位置に、外向きの法線が角度 deg を向くように置きます。
  // rotateX(90deg) で帯を前後方向に起こし、rotateZ で法線の向きを合わせます。帯の下端が前面側になります。
  function sideStrip(parent, cls, x, y, deg, width) {
    const strip = el("div", "side " + cls, parent);
    strip.style.width = mmCalc(width);
    strip.style.height = mmCalc(BODY.t);
    strip.style.left = `calc(50% - ${width / 2} * var(--mm))`;
    strip.style.top = `calc(50% - ${BODY.t / 2} * var(--mm))`;
    strip.style.transform =
      `translate3d(${mmCalc(x)}, ${mmCalc(y)}, 0) rotateZ(${deg + 90}deg) rotateX(90deg)`;
    return strip;
  }

  function buildSides(root) {
    const { w, h, r } = BODY;
    const straights = {
      top: { x: 0, y: -h / 2, deg: -90, len: w - 2 * r },
      right: { x: w / 2, y: 0, deg: 0, len: h - 2 * r },
      bottom: { x: 0, y: h / 2, deg: 90, len: w - 2 * r },
      left: { x: -w / 2, y: 0, deg: 180, len: h - 2 * r },
    };
    for (const [name, s] of Object.entries(straights)) {
      const strip = sideStrip(root, "side-" + name, s.x, s.y, s.deg, s.len);
      for (const part of SIDE_PARTS[name]) {
        // 帯の x 方向は、上面では左→右、右側面では上→下、左側面では下→上を向きます。
        const a = name === "left" ? h - r - part.to : part.from - r;
        const node = el("div", "side-part " + part.cls, strip);
        node.title = part.title;
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
        sideStrip(root, "side-corner", c.cx + apothem * Math.cos(rad), c.cy + apothem * Math.sin(rad), deg, segW);
      }
    }
  }

  function create(container, options = {}) {
    const root = el("div", "device", container);
    if (options.solid) {
      root.classList.add("solid");
      buildSides(root);
    }

    const front = el("div", "face front", root);
    el("div", "glass", front);
    const screen = el("div", "screen", front);
    const inner = el("div", "screen-inner", screen);
    el("div", "punch", front).title = "前面カメラ";
    const keyboard = el("div", "keyboard", front);
    el("div", "speaker left", front);
    el("div", "speaker right", front);

    const powerKey = el("div", "side-key top", front);
    powerKey.title = "電源キー（上面）";
    el("div", "jack", front).title = "3.5 mm イヤホンジャック（上面）";
    const voiceKey = el("div", "side-key left upper", front);
    voiceKey.title = "サイドキー（長押しで音声入力。割り当ては推定）";
    const lowerKey = el("div", "side-key left lower", front);
    lowerKey.title = "サイドキー（役割は推定）";
    // LED はキーの下に重ね、キーの周りにはみ出した部分がリングとして光ります。
    const led = el("div", "led", front);
    led.title = "Signal LED（右側面キーの周りが光ります）";
    const rightKey = el("div", "side-key right", front);
    rightKey.title = "右側面のキー（Signal LED 付き。役割は未確認）";
    const killSwitch = el("button", "side-switch", front);
    killSwitch.type = "button";
    killSwitch.tabIndex = -1;
    killSwitch.title = "キルスイッチ（クリックで切り替え）";

    const back = el("div", "face back", root);
    el("div", "plateau", back);
    const camera = el("div", "camera", back);
    el("div", "lens", camera);
    el("div", "flash", camera);
    el("div", "mag-ring", back);
    el("div", "back-mark", back).textContent = "COMMUNITY MOCK";

    let mm = 4;
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
            if (key.title) keyEl.title = key.title;
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
