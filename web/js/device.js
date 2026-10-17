// 端末モックの描画部品。外装カスタマイザーとシミュレーターの両方で使います。
// 寸法は mm 単位で CSS 変数 --mm（1mm あたりの px）に掛けて描画します。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  // 4.03 インチ 1080x1200 から算出した表示領域（mm）。左右の額縁は本体幅との差から求めています。
  const SCREEN = { x: 5.08, y: 5.08, w: 68.46, h: 76.07 };

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
    const screen = el("div", "screen", front);
    const inner = el("div", "screen-inner", screen);
    const keyboard = el("div", "keyboard", front);
    const powerKey = el("div", "side-key power", front);
    powerKey.title = "電源キー";
    const voiceKey = el("div", "side-key voice", front);
    voiceKey.title = "サイドキー（長押しで音声入力）";
    const killSwitch = el("div", "side-switch", front);
    killSwitch.title = "キルスイッチ";

    const back = el("div", "face back", root);
    const camera = el("div", "camera", back);
    el("div", "lens", camera);
    el("div", "flash", camera);
    el("div", "mag-ring", back);
    el("div", "back-mark", back).textContent = "COMMUNITY MOCK";

    let mm = 4;
    let logical = { w: 411, h: 457 };
    let keyHandler = null;

    function applyScale() {
      inner.style.width = logical.w + "px";
      inner.style.height = logical.h + "px";
      inner.style.transform = `scale(${(SCREEN.w * mm) / logical.w})`;
    }

    const api = {
      root, front, back, screen, inner, keyboard, led, voiceKey,

      setBody(id) {
        const body = C.bodies.find((b) => b.id === id) || C.bodies[0];
        root.style.setProperty("--body", body.color);
        root.style.setProperty("--key-bg", body.keyBg);
        root.style.setProperty("--key-fg", body.keyFg);
      },

      setCover(id) {
        const cover = C.covers.find((c) => c.id === id) || C.covers[0];
        root.style.setProperty("--cover", cover.bg);
      },

      setLayout(id) {
        const layout = C.layouts[id] || C.layouts.qwerty;
        keyboard.replaceChildren();
        for (const row of layout.rows) {
          const rowEl = el("div", "krow", keyboard);
          for (const key of row) {
            const keyEl = el("button", "key" + (key.cls ? " " + key.cls : ""), rowEl);
            keyEl.type = "button";
            keyEl.tabIndex = -1;
            keyEl.dataset.value = key.value;
            keyEl.textContent = key.label;
            keyEl.style.flexGrow = key.units || 1;
            if (key.title) keyEl.title = key.title;
          }
        }
      },

      onKey(handler) {
        keyHandler = handler;
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

    return api;
  }

  window.CommunicatorDevice = { create, SCREEN };
})();
