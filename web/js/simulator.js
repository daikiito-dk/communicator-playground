// 画面シミュレーター: 端末モックの画面内でモック OS か任意の Web ページを動かします。
// 画面は dp と同じ CSS px の論理サイズで描画し、モックの画面サイズに縮小表示します。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  const $ = (id) => document.getElementById(id);

  const SAMPLE_TEXTS = [
    "いまどこ？",
    "了解です、あとで電話します",
    "明日の会議、10時からに変更です",
    "写真送ったよ",
    "帰りに牛乳買ってきて",
  ];
  const VOICE_TEXT = "（音声入力）10分後に着きます";
  const STATUS_BAR_DP = 24;

  let state;
  let device;
  let stage;
  let iframe = null;
  let toastTimer = null;
  let look = { cover: "dune" };

  function initialState(keep = {}) {
    return {
      mode: "mock",
      url: "",
      density: 420,
      fontScale: 1,
      safe: false,
      clicksKey: "notes",
      ...keep,
      screen: "lock",
      selected: 0,
      convId: null,
      input: "",
      notes: "",
      shift: false,
      recording: false,
      toast: null,
      stickBottom: false,
      conversations: C.contacts.map((c, i) => ({
        ...c,
        unread: 0,
        lastAt: i,
        messages: [{ from: "them", text: c.greeting }],
      })),
    };
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }

  function logicalSize() {
    return {
      w: Math.round((1080 * 160) / state.density),
      h: Math.round((1200 * 160) / state.density),
    };
  }

  function now() {
    return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  function sortedConversations() {
    return [...state.conversations].sort((a, b) => b.lastAt - a.lastAt);
  }

  function currentConv() {
    return state.conversations.find((c) => c.id === state.convId);
  }

  // --- 描画 ---------------------------------------------------------------

  function statusBar() {
    return `<div class="sb"><span class="sb-time">${now()}</span><span>${state.shift ? "⇧ " : ""}5G ▮▮▮ 82%</span></div>`;
  }

  function lockScreen() {
    const date = new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" });
    return `
      <div class="lock-body" data-action="unlock">
        <div class="clock">${now()}</div>
        <div class="date">${date}</div>
        <div class="unlock-hint">スペースキー（指紋センサー）で解除</div>
      </div>`;
  }

  function hubScreen() {
    const items = sortedConversations().map((c, i) => {
      const last = c.messages[c.messages.length - 1];
      return `
        <div class="hub-item${i === state.selected ? " sel" : ""}" data-action="open" data-id="${c.id}" style="--c:${c.color}">
          <div class="avatar">${escapeHtml(c.name.slice(0, 1))}</div>
          <div class="hub-text">
            <div class="hub-name">${escapeHtml(c.name)} <span class="hub-app">${c.app}</span></div>
            <div class="hub-last">${last.from === "me" ? "あなた: " : ""}${escapeHtml(last.text)}</div>
          </div>
          ${c.unread ? `<div class="badge">${c.unread}</div>` : ""}
        </div>`;
    });
    return `
      <div class="appbar">Message hub <span class="appbar-sub">モック</span></div>
      <div class="scroll" data-screen="hub">${items.join("")}</div>
      <div class="hint">J / K 移動・Enter 開く・N メモ</div>`;
  }

  function chatScreen() {
    const c = currentConv();
    const msgs = c.messages
      .map((m) => `<div class="msg ${m.from === "me" ? "me" : ""}">${escapeHtml(m.text)}</div>`)
      .join("");
    const input = state.input
      ? `${escapeHtml(state.input)}<span class="caret"></span>`
      : `<span class="caret"></span><span class="placeholder">メッセージを入力</span>`;
    return `
      <div class="appbar" style="--c:${c.color}">
        <button type="button" class="back-btn" data-action="back" aria-label="戻る">←</button>
        <div class="avatar sm">${escapeHtml(c.name.slice(0, 1))}</div>${escapeHtml(c.name)}
        <span class="appbar-sub">${c.app}</span>
      </div>
      <div class="scroll msgs" data-screen="chat-${c.id}">${msgs}</div>
      <div class="composer">${input}</div>
      <div class="hint">Enter 送信・Esc 戻る</div>`;
  }

  function notesScreen() {
    const body = state.notes
      ? `${escapeHtml(state.notes)}<span class="caret"></span>`
      : `<span class="caret"></span><span class="placeholder">キーボードで入力できます</span>`;
    return `
      <div class="appbar">
        <button type="button" class="back-btn" data-action="back" aria-label="戻る">←</button>メモ
      </div>
      <div class="scroll notes-body" data-screen="notes">${body}</div>
      <div class="hint">Enter 改行・Esc 戻る</div>`;
  }

  function overlays() {
    const parts = [];
    if (state.toast) {
      const t = state.toast;
      parts.push(`
        <div class="toast-n" data-action="open" data-id="${t.id}" style="--c:${t.color}">
          <div class="avatar sm">${escapeHtml(t.name.slice(0, 1))}</div>
          <div class="hub-text"><div class="hub-name">${escapeHtml(t.name)}</div><div class="hub-last">${escapeHtml(t.text)}</div></div>
        </div>`);
    }
    if (state.recording) {
      parts.push(`
        <div class="voice-overlay">
          <div class="bars">${"<span></span>".repeat(5)}</div>
          <div>聞き取り中…</div>
          <div class="note-sm">サイドキーを離すと入力されます</div>
        </div>`);
    }
    if (state.safe) {
      parts.push(`
        <div class="safe-overlay">
          <div class="safe-top" style="height:${STATUS_BAR_DP}px">ステータスバー ${STATUS_BAR_DP}dp</div>
          <div class="safe-frame"></div>
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
      device.inner.innerHTML = `<div class="os"><div class="url-empty">右のパネルに URL を入れて「表示」を押してください</div></div>`;
      return;
    }
    if (!iframe || iframe.dataset.url !== state.url) {
      iframe = document.createElement("iframe");
      iframe.dataset.url = state.url;
      iframe.src = state.url;
      iframe.title = "シミュレーター内のページ";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
      device.inner.replaceChildren(iframe);
    }
    iframe.style.width = w + "px";
    iframe.style.height = h + "px";
  }

  function render() {
    const { w, h } = logicalSize();
    device.setLogicalSize(w, h);
    $("sim-info").textContent = `${w} × ${h} dp（${state.density} dpi の場合）`;
    updateLed();

    if (state.mode === "url") {
      renderUrl(w, h);
      return;
    }
    iframe = null;

    const prev = device.inner.querySelector(".scroll");
    const prevKey = prev && prev.dataset.screen;
    const prevTop = prev ? prev.scrollTop : 0;

    const cover = C.covers.find((c) => c.id === look.cover) || C.covers[0];
    device.inner.innerHTML = `
      <div class="os${state.screen === "lock" ? " wall" : ""}" style="--fs:${state.fontScale};--wall:${cover.bg}">
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

  function showToast(conv, text) {
    state.toast = { id: conv.id, name: conv.name, color: conv.color, text };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      state.toast = null;
      if (state.mode === "mock") render();
    }, 3000);
  }

  function notify(id, text) {
    const conv = state.conversations.find((c) => c.id === id);
    const message = text || SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    conv.messages.push({ from: "them", text: message });
    conv.lastAt = Date.now();
    if (state.screen === "chat" && state.convId === id) {
      state.stickBottom = true;
    } else {
      conv.unread += 1;
      showToast(conv, message);
    }
    if (state.screen === "hub") state.selected = 0;
    render();
  }

  function sendMessage() {
    const text = state.input.trim();
    if (!text) return;
    const conv = currentConv();
    conv.messages.push({ from: "me", text });
    conv.lastAt = Date.now();
    state.input = "";
    state.stickBottom = true;
    render();
    const id = conv.id;
    setTimeout(() => notify(id, "了解！"), 1500);
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
    if (value === "Alt" || value === "Sym") return;

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
      if (!fromHost && state.shift) ch = ch.toUpperCase();
      state.shift = false;
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
    if (state.screen === "chat") state.input += VOICE_TEXT;
    else {
      if (state.screen !== "notes") state.screen = "notes";
      state.notes += (state.notes && !state.notes.endsWith("\n") ? "\n" : "") + VOICE_TEXT;
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
      b.textContent = `${c.name}（${c.app}）`;
      b.addEventListener("click", () => {
        if (state.mode === "mock") notify(c.id);
      });
      notifyRow.appendChild(b);
    }

    holdToTalk($("sim-voice"));
    $("sim-reset").addEventListener("click", () => {
      const { mode, url, density, fontScale, safe, clicksKey } = state;
      state = initialState({ mode, url, density, fontScale, safe, clicksKey });
      render();
    });
  }

  function setupInput() {
    device.onKey((value) => handleKey(value));
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
      const t = device.inner.querySelector(".sb-time");
      if (t) t.textContent = now();
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
    look = next;
    device.setBody(next.body);
    device.setCover(next.cover);
    device.setLayout(next.layout);
    if (state.mode === "mock" && state.screen === "lock") render();
  }

  window.Simulator = {
    init,
    applyLook,
    fit: () => device.fit(stage),
  };
})();
