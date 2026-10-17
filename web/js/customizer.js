// 外装カスタマイザー: 本体色・背面カバー・配列・アクセサリーを選び、3D 風に回して確認します。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  const { t } = window.I18n;
  const $ = (id) => document.getElementById(id);

  const state = { body: "smoke", cover: "dune", layout: "qwerty", case: false, ring: false };
  let device;
  let stage;
  // 表示の向き（rotateY / rotateX の角度）。側面が見えるよう、正面と背面も少し斜めにしています。
  const VIEWS = {
    front: { angle: -18, tilt: -8 },
    back: { angle: 198, tilt: -8 },
    left: { angle: 62, tilt: -10 },
    right: { angle: -62, tilt: -10 },
    top: { angle: -20, tilt: -62 },
  };
  let angle = VIEWS.front.angle;
  let tilt = VIEWS.front.tilt;
  const listeners = [];

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (C.bodies.some((b) => b.id === p.get("body"))) state.body = p.get("body");
    if (C.covers.some((c) => c.id === p.get("cover"))) state.cover = p.get("cover");
    if (C.layouts[p.get("kb")]) state.layout = p.get("kb");
    state.case = p.get("case") === "1";
    state.ring = p.get("ring") === "1";
    const view = VIEWS[p.get("view")];
    if (view) ({ angle, tilt } = view);
  }

  function writeHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    p.set("body", state.body);
    p.set("cover", state.cover);
    p.set("kb", state.layout);
    p.set("case", state.case ? "1" : "0");
    p.set("ring", state.ring ? "1" : "0");
    p.set("view", currentView());
    history.replaceState(null, "", "#" + p.toString());
  }

  function currentView() {
    if (tilt < -40) return "top";
    const a = ((angle % 360) + 360) % 360;
    if (a > 45 && a < 135) return "left";
    if (a > 225 && a < 315) return "right";
    return a >= 135 && a <= 225 ? "back" : "front";
  }

  function rotate(animate = true) {
    device.root.style.transition = animate ? "" : "none";
    device.root.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg)`;
  }

  function showFace(face) {
    const view = VIEWS[face] || VIEWS.front;
    // 今の向きから近い回り方で回るよう、360 度の倍数をそろえます。
    const turns = Math.round((angle - view.angle) / 360);
    angle = view.angle + turns * 360;
    tilt = view.tilt;
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
          <div class="date">${new Date().toLocaleDateString(window.I18n.locale(), { month: "long", day: "numeric", weekday: "long" })}</div>
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
    $("cover-picked").textContent = cover.name + (body.defaultCover === cover.id ? t("cover.default") : "");
    $("kb-layout").value = state.layout;
    for (const a of C.accessories) $("acc-" + a.id).checked = state[a.id];

    const items = [
      t("summary.body", { v: body.name }),
      t("summary.cover", { v: cover.name }),
      t("summary.layout", { v: C.layouts[state.layout].name }),
      ...C.accessories.filter((a) => state[a.id]).map((a) => t("summary.acc", { v: t(a.nameKey) })),
    ];
    $("config-summary").replaceChildren(...items.map((text) => Object.assign(document.createElement("li"), { textContent: text })));

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
      tilt = Math.max(-80, Math.min(80, start.tilt - (e.clientY - start.y) * 0.3));
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
    device = window.CommunicatorDevice.create(stage, { solid: true });
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
      label.innerHTML = `<input type="checkbox" id="acc-${a.id}"> <span data-i18n="${a.nameKey}">${t(a.nameKey)}</span>`;
      acc.appendChild(label);
      label.querySelector("input").addEventListener("change", (e) => {
        update({ [a.id]: e.target.checked }, a.id === "ring" && e.target.checked ? "back" : null);
      });
    }

    $("view-front").addEventListener("click", () => showFace("front"));
    $("view-back").addEventListener("click", () => showFace("back"));
    for (const face of ["left", "right", "top"]) {
      $("view-" + face).addEventListener("click", () => showFace(face));
    }
    $("view-spin").addEventListener("click", () => {
      angle += 360;
      rotate();
    });

    $("share-link").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        $("share-status").textContent = t("share.copied");
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
    refresh: () => {
      $("share-status").textContent = "";
      render();
    },
    fit: () => device.fit(stage),
    getState: () => ({ ...state }),
    onChange: (fn) => listeners.push(fn),
  };
})();
