// 商品とデバイスのデータ。将来の販売・発注ではこのデータに SKU や価格、在庫を足して使う想定です。
// 色はすべて公式サイトの写真から起こした推定値です。
(function () {
  "use strict";

  const letters = (s) => [...s].map((c) => ({ label: c, value: c.toLowerCase() }));
  const K = {
    del: { label: "⌫", value: "Backspace", cls: "mod" },
    shift: { label: "⇧", value: "Shift", cls: "mod" },
    ret: { label: "↵", value: "Enter", cls: "mod" },
    alt: { label: "alt", value: "Alt", cls: "mod small" },
    sym: { label: "sym", value: "Sym", cls: "mod small" },
    space: { label: "", value: " ", units: 6, cls: "space", title: "スペース（指紋センサー）" },
    clicks: { label: "◆", value: "ClicksKey", cls: "clicks", title: "Clicks Key（位置は推定）" },
    dot: { label: ".", value: "." },
    comma: { label: ",", value: "," },
  };
  const bottomRow = [K.alt, K.sym, K.space, K.clicks, K.comma];

  window.CommunicatorCatalog = {
    bodies: [
      {
        id: "smoke", name: "Smoke", defaultCover: "dune",
        color: "linear-gradient(160deg, #c3c6cc, #8e9197)",
        swatch: "#a9acb2", keyBg: "#e4e5e9", keyFg: "#26272a",
      },
      {
        id: "onyx", name: "Onyx", defaultCover: "onyx",
        color: "linear-gradient(160deg, #2a2a2d, #141416)",
        swatch: "#1d1d1f", keyBg: "#2e2e32", keyFg: "#e8e8ec",
      },
      {
        id: "clover", name: "Clover", defaultCover: "clover",
        color: "linear-gradient(160deg, #4f7d5f, #2f5240)",
        swatch: "#3f6b4f", keyBg: "#5d8a6c", keyFg: "#f1f6f2",
      },
    ],

    covers: [
      { id: "surf", name: "Surf", bg: "linear-gradient(150deg, #e9f6fb 0%, #7cc6e8 45%, #2f7fc1 100%)" },
      { id: "miami-beach", name: "Miami Beach", bg: "linear-gradient(150deg, #ffb3c7 0%, #ffd6a5 50%, #6fd6c8 100%)" },
      { id: "dune", name: "Dune", bg: "linear-gradient(160deg, #e6d4b3, #c9ae84)" },
      { id: "spice", name: "Spice", bg: "linear-gradient(160deg, #ee7a3a, #c4531f)" },
      { id: "clover", name: "Clover", bg: "linear-gradient(160deg, #5d9a6c, #3c6e4d)" },
      { id: "vino", name: "Vino", bg: "linear-gradient(160deg, #8a2a45, #561528)" },
      { id: "onyx", name: "Onyx", bg: "linear-gradient(160deg, #2b2b2e, #111113)" },
      { id: "surge", name: "Surge", bg: "linear-gradient(160deg, #e3ff5c, #a6d61c)" },
      { id: "bloom", name: "Bloom", bg: "radial-gradient(circle at 30% 30%, #f7b6de, #b26fd6 60%, #6e4ab8)" },
      {
        id: "cognac", name: "Cognac",
        bg: "repeating-linear-gradient(35deg, rgba(0,0,0,.06) 0 2px, transparent 2px 5px), linear-gradient(160deg, #a35e2e, #6e3a17)",
      },
    ],

    layouts: {
      qwerty: {
        name: "English (QWERTY)",
        rows: [letters("QWERTYUIOP"), [...letters("ASDFGHJKL"), K.del], [K.shift, ...letters("ZXCVBNM"), K.dot, K.ret], bottomRow],
      },
      azerty: {
        name: "Français (AZERTY)",
        rows: [letters("AZERTYUIOP"), letters("QSDFGHJKLM"), [K.shift, ...letters("WXCVBN"), K.dot, K.del, K.ret], bottomRow],
      },
      qwertz: {
        name: "Deutsch (QWERTZ)",
        rows: [letters("QWERTZUIOP"), [...letters("ASDFGHJKL"), K.del], [K.shift, ...letters("YXCVBNM"), K.dot, K.ret], bottomRow],
      },
    },

    accessories: [
      { id: "case", name: "ミニマルケース" },
      { id: "ring", name: "Qi2 リングスタンド" },
    ],

    contacts: [
      { id: "mom", name: "お母さん", app: "SMS", color: "#ff7eb6", greeting: "今日は晩ごはんいる？" },
      { id: "boss", name: "上司", app: "Slack", color: "#ff5a4f", greeting: "資料の確認お願いします" },
      { id: "telegram", name: "サークル", app: "Telegram", color: "#4fb3ff", greeting: "週末の集合場所決まった？" },
      { id: "whatsapp", name: "Alex", app: "WhatsApp", color: "#4ce07a", greeting: "See you tomorrow!" },
    ],
  };
})();
