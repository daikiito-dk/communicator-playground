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

  const mmCalc = (v) => `calc(${v} * var(--mm))`;

  function el(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  function create(container) {
    const root = el("div", "device", container);

    const front = el("div", "face front", root);
    const led = el("div", "led", front);
    led.title = "Signal LED（位置は推定）";
    el("div", "glass", front);
    const screen = el("div", "screen", front);
    const inner = el("div", "screen-inner", screen);
    el("div", "punch", front).title = "前面カメラ";
    const keyboard = el("div", "keyboard", front);
    el("div", "speaker left", front);
    el("div", "speaker right", front);

    const powerKey = el("div", "side-key top", front);
    powerKey.title = "上面のキー（役割は推定: 電源）";
    const voiceKey = el("div", "side-key left upper", front);
    voiceKey.title = "サイドキー（長押しで音声入力。割り当ては推定）";
    const lowerKey = el("div", "side-key left lower", front);
    lowerKey.title = "サイドキー（役割は推定）";
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
