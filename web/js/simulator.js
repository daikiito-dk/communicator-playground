// 画面シミュレーター: 端末モックの画面内でモック OS か任意の Web ページを動かします。
// 画面は dp と同じ CSS px の論理サイズで描画し、モックの画面サイズに縮小表示します。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  const $ = (id) => document.getElementById(id);

  const I18n = window.I18n;
  const { t } = I18n;
  const STATUS_BAR_DP = 44;

  let state;
  let device;
  let stage;
  let iframe = null;
  let toastTimer = null;

  function initialState(keep = {}) {
    return {
      mode: "mock",
      url: "",
      density: 420,
      fontScale: 1,
      safe: false,
      clicksKey: "notes",
      killed: false,
      ...keep,
      screen: "lock",
      selected: 0,
      convId: null,
      input: "",
      notes: "",
      shift: false,
      alt: false,
      recording: false,
      toast: null,
      stickBottom: false,
      conversations: window.LockScreen.initialConversations(),
    };
  }

  const { contactName, msgText, escapeHtml } = window.LockScreen;

  function logicalSize() {
    return {
      w: Math.round((1080 * 160) / state.density),
      h: Math.round((1200 * 160) / state.density),
    };
  }

  // パンチホールと画面の角丸を、表示中の dp に換算します（実寸は device.js の PUNCH / SCREEN）。
  function cutout() {
    const { SCREEN, PUNCH } = window.CommunicatorDevice;
    const dpPerMm = logicalSize().w / SCREEN.w;
    return {
      x: (PUNCH.cx - SCREEN.x) * dpPerMm,
      y: (PUNCH.cy - SCREEN.y) * dpPerMm,
      r: (PUNCH.d / 2 + 0.4) * dpPerMm,
      radius: 4.6 * dpPerMm,
    };
  }

  function now() {
    return new Date().toLocaleTimeString(I18n.locale(), { hour: "2-digit", minute: "2-digit" });
  }

  function sortedConversations() {
    return [...state.conversations].sort((a, b) => b.lastAt - a.lastAt);
  }

  function currentConv() {
    return state.conversations.find((c) => c.id === state.convId);
  }

  // --- 描画 ---------------------------------------------------------------

  function statusBar() {
    const mods = (state.shift ? "⇧ " : "") + (state.alt ? "alt " : "") + (state.killed ? t("os.micBadge") + " " : "");
    return `<div class="sb"><span class="sb-time">${now()}</span><span>${mods}5G ▮▮▮ 82%</span></div>`;
  }

  function lockScreen() {
    return window.LockScreen.html(state.conversations);
  }

  function hubScreen() {
    const items = sortedConversations().map((c, i) => {
      const last = c.messages[c.messages.length - 1];
      return `
        <div class="hub-item${i === state.selected ? " sel" : ""}" data-action="open" data-id="${c.id}" style="--c:${c.color}">
          <div class="avatar">${escapeHtml([...contactName(c)][0])}</div>
          <div class="hub-text">
            <div class="hub-name">${escapeHtml(contactName(c))} <span class="hub-app">${c.app}</span></div>
            <div class="hub-last">${last.from === "me" ? t("os.you") : ""}${escapeHtml(msgText(last))}</div>
          </div>
          ${c.unread ? `<div class="badge">${c.unread}</div>` : ""}
        </div>`;
    });
    return `
      <div class="appbar">Message hub <span class="appbar-sub">${t("os.mock")}</span></div>
      <div class="scroll" data-screen="hub">${items.join("")}</div>
      <div class="hint">${t("os.hubHint")}</div>`;
  }

  function chatScreen() {
    const c = currentConv();
    const msgs = c.messages
      .map((m) => `<div class="msg ${m.from === "me" ? "me" : ""}">${escapeHtml(msgText(m))}</div>`)
      .join("");
    const input = state.input
      ? `${escapeHtml(state.input)}<span class="caret"></span>`
      : `<span class="caret"></span><span class="placeholder">${t("os.typeMessage")}</span>`;
    return `
      <div class="appbar" style="--c:${c.color}">
        <button type="button" class="back-btn" data-action="back" aria-label="${t("os.back")}">←</button>
        <div class="avatar sm">${escapeHtml([...contactName(c)][0])}</div>${escapeHtml(contactName(c))}
        <span class="appbar-sub">${c.app}</span>
      </div>
      <div class="scroll msgs" data-screen="chat-${c.id}">${msgs}</div>
      <div class="composer">${input}</div>
      <div class="hint">${t("os.chatHint")}</div>`;
  }

  function notesScreen() {
    const body = state.notes
      ? `${escapeHtml(state.notes)}<span class="caret"></span>`
      : `<span class="caret"></span><span class="placeholder">${t("os.notesPlaceholder")}</span>`;
    return `
      <div class="appbar">
        <button type="button" class="back-btn" data-action="back" aria-label="${t("os.back")}">←</button>${t("os.notes")}
      </div>
      <div class="scroll notes-body" data-screen="notes">${body}</div>
      <div class="hint">${t("os.notesHint")}</div>`;
  }

  function overlays() {
    const parts = [];
    if (state.toast) {
      const toast = state.toast;
      const name = contactName(toast);
      parts.push(`
        <div class="toast-n" data-action="open" data-id="${toast.id}" style="--c:${toast.color}">
          <div class="avatar sm">${escapeHtml([...name][0])}</div>
          <div class="hub-text"><div class="hub-name">${escapeHtml(name)}</div><div class="hub-last">${escapeHtml(msgText(toast.message))}</div></div>
        </div>`);
    }
    if (state.recording && state.killed) {
      parts.push(`
        <div class="voice-overlay">
          <div>${t("os.micOff")}</div>
          <div class="note-sm">${t("os.micOffHint")}</div>
        </div>`);
    } else if (state.recording) {
      parts.push(`
        <div class="voice-overlay">
          <div class="bars">${"<span></span>".repeat(5)}</div>
          <div>${t("os.listening")}</div>
          <div class="note-sm">${t("os.listeningHint")}</div>
        </div>`);
    }
    if (state.safe) {
      parts.push(`
        <div class="safe-overlay">
          <div class="safe-top" style="height:${STATUS_BAR_DP}px">${t("os.statusBar")} ${STATUS_BAR_DP}dp</div>
          <div class="safe-frame" style="border-radius:${cutout().radius}px"></div>
          <div class="safe-cutout" style="left:${cutout().x - cutout().r}px;top:${cutout().y - cutout().r}px;width:${cutout().r * 2}px;height:${cutout().r * 2}px"></div>
        </div>`);
    }
    return parts.join("");
  }

  function screenBody() {
    switch (state.screen) {
      case "lock": return lockScreen();
      case "chat": return chatScreen();
      case "notes": return notesScreen();
      default: return hubScreen();
    }
  }

  function updateLed() {
    const unread = state.conversations.filter((c) => c.unread > 0).sort((a, b) => b.lastAt - a.lastAt);
    device.setLed(unread.length ? unread[0].color : null);
  }

  function renderUrl(w, h) {
    if (!state.url) {
      iframe = null;
      device.inner.innerHTML = `<div class="os"><div class="url-empty">${t("os.urlEmpty")}</div></div>`;
      return;
    }
    if (!iframe || iframe.dataset.url !== state.url) {
      iframe = document.createElement("iframe");
      iframe.dataset.url = state.url;
      iframe.src = state.url;
      I18n.title(iframe, "os.iframeTitle");
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
      device.inner.replaceChildren(iframe);
    }
    iframe.style.width = w + "px";
    iframe.style.height = h + "px";
  }

  function render() {
    const { w, h } = logicalSize();
    device.setLogicalSize(w, h);
    $("sim-info").textContent = t("sim.info", { w, h, d: state.density });
    updateLed();

    if (state.mode === "url") {
      renderUrl(w, h);
      return;
    }
    iframe = null;

    const prev = device.inner.querySelector(".scroll");
    const prevKey = prev && prev.dataset.screen;
    const prevTop = prev ? prev.scrollTop : 0;

    device.inner.innerHTML = `
      <div class="os${state.screen === "lock" ? " on-lock" : ""}" style="--fs:${state.fontScale}">
        ${statusBar()}${screenBody()}${overlays()}
      </div>`;

    const scroll = device.inner.querySelector(".scroll");
    if (scroll) {
      if (state.stickBottom) scroll.scrollTop = scroll.scrollHeight;
      else if (scroll.dataset.screen === prevKey) scroll.scrollTop = prevTop;
    }
    state.stickBottom = false;
  }

  // --- 操作 ---------------------------------------------------------------

  function go(screen) {
    state.screen = screen;
    state.input = "";
    if (screen === "notes") state.stickBottom = true;
    render();
  }

  function openConversation(id) {
    const conv = state.conversations.find((c) => c.id === id);
    if (!conv) return;
    conv.unread = 0;
    state.convId = id;
    state.selected = sortedConversations().findIndex((c) => c.id === id);
    state.toast = null;
    state.stickBottom = true;
    go("chat");
  }

  function showToast(conv, message) {
    state.toast = { id: conv.id, color: conv.color, message };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      state.toast = null;
      if (state.mode === "mock") render();
    }, 3000);
  }

  function notify(id, message) {
    const conv = state.conversations.find((c) => c.id === id);
    if (!message) message = { from: "them", key: "os.samples", index: Math.floor(Math.random() * t("os.samples").length) };
    message.at = Date.now();
    conv.messages.push(message);
    conv.lastAt = message.at;
    if (state.screen === "chat" && state.convId === id) {
      state.stickBottom = true;
    } else {
      conv.unread += 1;
      // ロック画面では通知の一覧に並ぶので、上からのポップアップは出しません。
      if (state.screen !== "lock") showToast(conv, message);
    }
    if (state.screen === "hub") state.selected = 0;
    render();
  }

  function sendMessage() {
    const text = state.input.trim();
    if (!text) return;
    const conv = currentConv();
    conv.messages.push({ from: "me", text, at: Date.now() });
    conv.lastAt = Date.now();
    state.input = "";
    state.stickBottom = true;
    render();
    const id = conv.id;
    setTimeout(() => notify(id, { from: "them", key: "os.reply" }), 1500);
  }

  function insertText(text) {
    if (state.screen === "chat") state.input += text;
    else if (state.screen === "notes") {
      state.notes += text;
      state.stickBottom = true;
    } else return;
    render();
  }

  function deleteText() {
    if (state.screen === "chat") state.input = [...state.input].slice(0, -1).join("");
    else if (state.screen === "notes") state.notes = [...state.notes].slice(0, -1).join("");
    render();
  }

  function goBack() {
    if (state.screen === "chat" || state.screen === "notes") go("hub");
  }

  function runClicksKey() {
    if (state.clicksKey === "notes") return go("notes");
    if (state.clicksKey === "hub") return go("hub");
    const latest = state.conversations.filter((c) => c.unread > 0).sort((a, b) => b.lastAt - a.lastAt)[0];
    if (latest) openConversation(latest.id);
    else go("hub");
  }

  function handleKey(value, fromHost = false) {
    if (state.mode !== "mock") return;
    if (value === "ClicksKey") return runClicksKey();
    if (value === "Shift") {
      state.shift = !state.shift;
      return render();
    }
    if (value === "Alt" || value === "Sym") {
      state.alt = !state.alt;
      return render();
    }
    if (value === "Apps") return go("hub");
    if (value === "Emoji") return insertText("😊");
    if (value === "Ctrl") return;

    if (state.screen === "lock") {
      if (value === " " || value === "Enter") go("hub");
      return;
    }

    if (state.screen === "hub") {
      const count = state.conversations.length;
      const key = value.toLowerCase();
      if (key === "j" || value === "ArrowDown") state.selected = Math.min(count - 1, state.selected + 1);
      else if (key === "k" || value === "ArrowUp") state.selected = Math.max(0, state.selected - 1);
      else if (value === "Enter") return openConversation(sortedConversations()[state.selected].id);
      else if (key === "n") return go("notes");
      else return;
      return render();
    }

    if (value === "Escape") return goBack();
    if (value === "Backspace") return deleteText();
    if (value === "Enter") {
      if (state.screen === "chat") return sendMessage();
      return insertText("\n");
    }
    if (value.length === 1) {
      let ch = value;
      if (!fromHost && state.alt) ch = device.subFor(value.toLowerCase()) || ch;
      else if (!fromHost && state.shift) ch = ch.toUpperCase();
      state.shift = false;
      state.alt = false;
      insertText(ch);
    }
  }

  function startVoice() {
    if (state.mode !== "mock" || state.recording) return;
    state.recording = true;
    device.voiceKey.classList.add("active");
    render();
  }

  function stopVoice() {
    if (!state.recording) return;
    state.recording = false;
    device.voiceKey.classList.remove("active");
    if (state.killed) return render();
    if (state.screen === "chat") state.input += t("os.voiceText");
    else {
      if (state.screen !== "notes") state.screen = "notes";
      state.notes += (state.notes && !state.notes.endsWith("\n") ? "\n" : "") + t("os.voiceText");
      state.stickBottom = true;
    }
    render();
  }

  function holdToTalk(target) {
    target.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      target.setPointerCapture(e.pointerId);
      startVoice();
    });
    target.addEventListener("pointerup", stopVoice);
    target.addEventListener("pointercancel", stopVoice);
  }

  // --- 初期化 -------------------------------------------------------------

  function isActive() {
    return !$("tab-simulate").hidden;
  }

  function setupPanel() {
    for (const radio of document.querySelectorAll('input[name="sim-mode"]')) {
      radio.addEventListener("change", () => {
        state.mode = radio.value;
        $("sim-url-form").hidden = state.mode !== "url";
        device.root.classList.toggle("url-mode", state.mode === "url");
        render();
      });
    }

    $("sim-url-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = $("sim-url").value.trim();
      let url;
      try {
        url = new URL(raw);
      } catch {
        return;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      state.url = url.href;
      render();
    });

    $("sim-density").addEventListener("change", (e) => {
      state.density = Number(e.target.value);
      render();
    });
    $("sim-font").addEventListener("change", (e) => {
      state.fontScale = Number(e.target.value);
      render();
    });
    $("sim-safe").addEventListener("change", (e) => {
      state.safe = e.target.checked;
      render();
    });
    $("sim-clicks").addEventListener("change", (e) => {
      state.clicksKey = e.target.value;
    });

    const notifyRow = $("sim-notify");
    for (const c of C.contacts) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn notify-btn";
      b.style.setProperty("--c", c.color);
      b.dataset.id = c.id;
      b.addEventListener("click", () => {
        if (state.mode === "mock") notify(c.id);
      });
      notifyRow.appendChild(b);
    }

    labelNotifyButtons();
    holdToTalk($("sim-voice"));
    $("sim-reset").addEventListener("click", () => {
      const { mode, url, density, fontScale, safe, clicksKey } = state;
      state = initialState({ mode, url, density, fontScale, safe, clicksKey });
      device.setKilled(false);
      render();
    });
  }

  function labelNotifyButtons() {
    for (const b of $("sim-notify").children) {
      const c = C.contacts.find((x) => x.id === b.dataset.id);
      b.textContent = `${contactName(c)} (${c.app})`;
    }
  }

  function setupInput() {
    device.onKey((value) => handleKey(value));
    device.onKillSwitch((on) => {
      state.killed = on;
      render();
    });
    holdToTalk(device.voiceKey);

    device.inner.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target || state.mode !== "mock") return;
      const action = target.dataset.action;
      if (action === "unlock") go("hub");
      else if (action === "open") openConversation(target.dataset.id);
      else if (action === "back") goBack();
    });

    // キーボード面のタッチスクロールを、ホイール操作で再現します。
    device.keyboard.addEventListener("wheel", (e) => {
      const scroll = device.inner.querySelector(".scroll");
      if (!scroll) return;
      e.preventDefault();
      scroll.scrollTop += e.deltaY;
    }, { passive: false });

    const hostKeys = new Set(["Backspace", "Enter", "Escape", "ArrowUp", "ArrowDown"]);
    document.addEventListener("keydown", (e) => {
      if (!isActive() || state.mode !== "mock") return;
      if (e.target.closest && e.target.closest("input, textarea, select")) return;
      if (e.metaKey || e.ctrlKey || e.isComposing) return;
      const value = e.key.length === 1 || hostKeys.has(e.key) ? e.key : null;
      if (!value) return;
      e.preventDefault();
      device.pressKey(value);
      handleKey(value, true);
    });

    setInterval(() => {
      if (state.mode === "mock" && state.screen === "lock") return render();
      const time = device.inner.querySelector(".sb-time");
      if (time) time.textContent = now();
    }, 30000);
  }

  function init() {
    stage = $("simulate-stage");
    device = window.CommunicatorDevice.create(stage);
    device.root.classList.add("front-only");
    state = initialState();
    setupPanel();
    setupInput();
    render();
  }

  function applyLook(next) {
    device.setBody(next.body);
    device.setCover(next.cover);
    device.setLayout(next.layout);
  }

  window.Simulator = {
    init,
    applyLook,
    refresh: () => {
      labelNotifyButtons();
      render();
    },
    fit: () => device.fit(stage),
  };
})();
