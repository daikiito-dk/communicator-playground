// 外装カスタマイザー: 本体色・背面カバー・配列・アクセサリーを選び、3D 風に回して確認します。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  const $ = (id) => document.getElementById(id);

  const state = { body: "smoke", cover: "dune", layout: "qwerty", case: false, ring: false };
  let device;
  let stage;
  let angle = -18;
  let tilt = -6;
  const listeners = [];

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (C.bodies.some((b) => b.id === p.get("body"))) state.body = p.get("body");
    if (C.covers.some((c) => c.id === p.get("cover"))) state.cover = p.get("cover");
    if (C.layouts[p.get("kb")]) state.layout = p.get("kb");
    state.case = p.get("case") === "1";
    state.ring = p.get("ring") === "1";
    if (p.get("view") === "back") angle = 180;
  }

  function writeHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    p.set("body", state.body);
    p.set("cover", state.cover);
    p.set("kb", state.layout);
    p.set("case", state.case ? "1" : "0");
    p.set("ring", state.ring ? "1" : "0");
    p.set("view", Math.cos((angle * Math.PI) / 180) < 0 ? "back" : "front");
    history.replaceState(null, "", "#" + p.toString());
  }

  function rotate(animate = true) {
    device.root.style.transition = animate ? "" : "none";
    device.root.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg)`;
  }

  function showFace(face) {
    angle = face === "back" ? 180 : 0;
    tilt = -6;
    rotate();
    writeHash();
  }

  function renderLockscreen() {
    const cover = C.covers.find((c) => c.id === state.cover);
    device.inner.innerHTML = `
      <div class="os wall" style="--wall:${cover.bg}">
        <div class="sb"><span>9:41</span><span>5G ▮▮▮ 82%</span></div>
        <div class="lock-body">
          <div class="clock">9:41</div>
          <div class="date">${new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}</div>
        </div>
      </div>`;
  }

  function swatchButtons(container, items, color, onPick) {
    container.replaceChildren();
    for (const item of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.style.background = color(item);
      b.title = item.name;
      b.setAttribute("aria-label", item.name);
      b.dataset.id = item.id;
      b.addEventListener("click", () => onPick(item.id));
      container.appendChild(b);
    }
  }

  function render() {
    device.setBody(state.body);
    device.setCover(state.cover);
    device.setLayout(state.layout);
    device.root.classList.toggle("with-case", state.case);
    device.root.classList.toggle("with-ring", state.ring);
    renderLockscreen();

    for (const b of $("body-swatches").children) b.setAttribute("aria-pressed", b.dataset.id === state.body);
    for (const b of $("cover-swatches").children) b.setAttribute("aria-pressed", b.dataset.id === state.cover);
    const body = C.bodies.find((b) => b.id === state.body);
    const cover = C.covers.find((c) => c.id === state.cover);
    $("body-picked").textContent = body.name;
    $("cover-picked").textContent = cover.name + (body.defaultCover === cover.id ? "（標準で付属）" : "");
    $("kb-layout").value = state.layout;
    for (const a of C.accessories) $("acc-" + a.id).checked = state[a.id];

    const items = [
      `本体: ${body.name}`,
      `背面カバー: ${cover.name}`,
      `キーボード: ${C.layouts[state.layout].name}`,
      ...C.accessories.filter((a) => state[a.id]).map((a) => `アクセサリー: ${a.name}`),
    ];
    $("config-summary").replaceChildren(...items.map((t) => Object.assign(document.createElement("li"), { textContent: t })));

    writeHash();
    for (const fn of listeners) fn({ ...state });
  }

  function update(patch, face) {
    Object.assign(state, patch);
    render();
    if (face) showFace(face);
  }

  function setupDrag() {
    let start = null;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, angle, tilt };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("dragging");
    });
    stage.addEventListener("pointermove", (e) => {
      if (!start) return;
      angle = start.angle + (e.clientX - start.x) * 0.6;
      tilt = Math.max(-35, Math.min(35, start.tilt - (e.clientY - start.y) * 0.3));
      rotate(false);
    });
    const end = () => {
      if (start) writeHash();
      start = null;
      stage.classList.remove("dragging");
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  function init() {
    stage = $("customize-stage");
    device = window.CommunicatorDevice.create(stage);
    readHash();

    swatchButtons($("body-swatches"), C.bodies, (b) => b.swatch, (id) => update({ body: id }, "front"));
    swatchButtons($("cover-swatches"), C.covers, (c) => c.bg, (id) => update({ cover: id }, "back"));

    const layoutSelect = $("kb-layout");
    for (const [id, layout] of Object.entries(C.layouts)) layoutSelect.add(new Option(layout.name, id));
    layoutSelect.addEventListener("change", () => update({ layout: layoutSelect.value }, "front"));

    const acc = $("accessories");
    for (const a of C.accessories) {
      const label = document.createElement("label");
      label.className = "check";
      label.innerHTML = `<input type="checkbox" id="acc-${a.id}"> ${a.name}`;
      acc.appendChild(label);
      label.querySelector("input").addEventListener("change", (e) => {
        update({ [a.id]: e.target.checked }, a.id === "ring" && e.target.checked ? "back" : null);
      });
    }

    $("view-front").addEventListener("click", () => showFace("front"));
    $("view-back").addEventListener("click", () => showFace("back"));
    $("view-spin").addEventListener("click", () => {
      angle += 360;
      rotate();
    });

    $("share-link").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        $("share-status").textContent = "リンクをコピーしました。";
      } catch {
        $("share-status").textContent = location.href;
      }
    });

    setupDrag();
    render();
    rotate();
  }

  window.Customizer = {
    init,
    fit: () => device.fit(stage),
    getState: () => ({ ...state }),
    onChange: (fn) => listeners.push(fn),
  };
})();
