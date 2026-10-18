// スリープ解除前の開始画面（ロック画面）。公式の製品画像の画面構成にならっています。
// 左上に大きな時計、日付・天気・次の予定、その下にアプリごとの通知をまとめて並べます。
// シミュレーターと外装カスタマイザーの両方で使います。
(function () {
  "use strict";

  const C = window.CommunicatorCatalog;
  const I18n = window.I18n;
  const { t } = I18n;

  // 1 つのアプリで、これより多く未読があるときは「N 件の新着メッセージ」にまとめます。
  const MAX_LINES = 3;
  // 最初から届いている通知が何分前のものか（公式画像の Now / 5m / 1h に合わせています）。
  const INITIAL_AGE_MIN = { telegram: 0, boss: 5, whatsapp: 60, mom: 75 };

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }

  const contactName = (c) => t("contact." + c.id);

  // 相手から届いたモックのメッセージは翻訳キーで持ち、言語を切り替えると表示も切り替わるようにします。
  // 自分で入力した文は text のまま持ちます。
  function msgText(m) {
    if (!m.key) return m.text;
    const v = t(m.key);
    return Array.isArray(v) ? v[m.index] : v;
  }

  function initialConversations() {
    const now = Date.now();
    return C.contacts.map((c) => {
      const at = now - (INITIAL_AGE_MIN[c.id] ?? 30) * 60000;
      return { ...c, unread: 1, lastAt: at, messages: [{ from: "them", key: `contact.${c.id}.msg`, at }] };
    });
  }

  // 12 時間表記の地域でも、公式画像のように AM / PM を付けずに表示します。
  function clock(date = new Date()) {
    return new Intl.DateTimeFormat(I18n.locale(), { hour: "numeric", minute: "2-digit" })
      .formatToParts(date)
      .filter((p) => p.type !== "dayPeriod")
      .map((p) => p.value)
      .join("")
      .trim();
  }

  function ago(at) {
    const min = Math.floor((Date.now() - at) / 60000);
    if (min < 1) return t("os.now");
    const [value, unit] = min < 60 ? [min, "minute"] : [Math.floor(min / 60), "hour"];
    return new Intl.NumberFormat(I18n.locale(), { style: "unit", unit, unitDisplay: "narrow" }).format(value);
  }

  function agenda() {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 3600000);
    // formatRange は日本語で「10時00分～11時00分」になるため、開始と終了を別々に整形します。
    const time = new Intl.DateTimeFormat(I18n.locale(), { timeStyle: "short" });
    const range = `${time.format(start)}–${time.format(end)}`;
    return `${t("os.event")} • ${range} +2`;
  }

  function notification(c) {
    const unread = c.messages.filter((m) => m.from === "them").slice(-c.unread);
    const lines = c.unread > MAX_LINES
      ? [t("os.newMessages", { n: c.unread })]
      : unread.map((m) => `${contactName(c)}: ${msgText(m)}`);
    return `
      <div class="lock-n" data-action="open" data-id="${c.id}">
        <div class="app-icon" style="--c:${c.color}">${c.glyph}</div>
        <div class="lock-n-text">
          <div class="lock-n-app">${c.app} <span>${ago(c.lastAt)}</span></div>
          ${lines.map((l) => `<div class="lock-n-line">${escapeHtml(l)}</div>`).join("")}
        </div>
      </div>`;
  }

  function html(conversations, { hint = true } = {}) {
    const date = new Date().toLocaleDateString(I18n.locale(), { weekday: "short", month: "short", day: "numeric" });
    const items = conversations.filter((c) => c.unread > 0).sort((a, b) => b.lastAt - a.lastAt);
    return `
      <div class="lock" data-action="unlock">
        <div class="lock-head">
          <div class="lock-clock">${clock()}</div>
          <div class="lock-sub">${escapeHtml(date)} ☀ ${t("os.temp")}</div>
          <div class="lock-sub">${escapeHtml(agenda())}</div>
        </div>
        <div class="lock-list">${items.map(notification).join("")}</div>
        ${hint ? `<div class="unlock-hint">${t("os.unlock")}</div>` : ""}
      </div>`;
  }

  window.LockScreen = { html, initialConversations, msgText, contactName, escapeHtml };
})();
