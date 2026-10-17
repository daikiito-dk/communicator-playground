// 商品とデバイスのデータ。将来の販売・発注ではこのデータに SKU や価格、在庫を足して使う想定です。
// 色はすべて公式サイトの写真から起こした推定値です。
(function () {
  "use strict";

  // 文字キーと、alt で入力する副刻印（公式の正面図から読み取り）。
  const keys = (letters, subs = "") =>
    [...letters].map((c, i) => ({ label: c, sub: subs[i], value: c.toLowerCase() }));
  const K = {
    del: { label: "⌫", value: "Backspace", cls: "mod" },
    shift: { label: "⇧", value: "Shift", cls: "mod" },
    ret: { label: "↵", value: "Enter", cls: "mod" },
    dot: { label: ".", sub: "$", value: "." },
  };
  const SUB1 = "#123()_-+@";
  const SUB2 = "*456/:;'\"";

  // 最下段は横位置（cx、mm）が上 3 段と揃っていないため、正面図の実測値で個別に置きます。
  const bottomRow = [
    { label: "123", value: "Sym", cls: "mod round small", cx: 9.74 },
    { label: "ctrl", sub: "0", value: "Ctrl", cls: "mod round small", cx: 17.15 },
    { label: "⌕", value: "Apps", cls: "mod round", cx: 24.56, title: "アプリ検索" },
    { label: "", value: " ", cls: "space", cx: 39.4, w: 20.8, title: "スペース（指紋センサー）" },
    { label: "◆", value: "ClicksKey", cls: "clicks round", cx: 54.1, title: "Clicks Key" },
    { label: "alt", sub: "☺", value: "Alt", cls: "mod round small", cx: 61.5 },
    { label: "123", value: "Sym", cls: "mod round small", cx: 68.9 },
  ];

  window.CommunicatorCatalog = {
    bodies: [
      {
        id: "smoke", name: "Smoke", defaultCover: "dune",
        color: "linear-gradient(160deg, #f1f0ee, #d9d8d5)",
        swatch: "#e6e5e2", keyBg: "#2a2a2c", keyFg: "#f4f4f4",
      },
      {
        id: "onyx", name: "Onyx", defaultCover: "onyx",
        color: "linear-gradient(160deg, #2a2a2d, #141416)",
        swatch: "#1d1d1f", keyBg: "#2e2e32", keyFg: "#e8e8ec",
      },
      {
        id: "clover", name: "Clover", defaultCover: "clover",
        color: "linear-gradient(160deg, #4b6b45, #2f4a2c)",
        swatch: "#3f5d3a", keyBg: "#232a22", keyFg: "#eef2ec",
      },
    ],

    covers: [
      { id: "surf", name: "Surf", bg: "linear-gradient(150deg, #e9f6fb 0%, #7cc6e8 45%, #2f7fc1 100%)" },
      { id: "miami-beach", name: "Miami Beach", bg: "linear-gradient(150deg, #ffb3c7 0%, #ffd6a5 50%, #6fd6c8 100%)" },
      { id: "dune", name: "Dune", bg: "linear-gradient(160deg, #e6d4b3, #c9ae84)" },
      { id: "spice", name: "Spice", bg: "linear-gradient(160deg, #ee7a3a, #c4531f)" },
      { id: "clover", name: "Clover", bg: "linear-gradient(160deg, #4b6b45, #2f4a2c)" },
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
        rows: [
          keys("QWERTYUIOP", SUB1),
          [...keys("ASDFGHJKL", SUB2), K.del],
          [K.shift, ...keys("ZXCVBNM", "789%?!,"), K.dot, K.ret],
          bottomRow,
        ],
      },
      // AZERTY と QWERTZ の副刻印は未確認のため、QWERTY と同じ位置に置いています。
      azerty: {
        name: "Français (AZERTY)",
        rows: [
          keys("AZERTYUIOP", SUB1),
          keys("QSDFGHJKLM", SUB2),
          [K.shift, ...keys("WXCVBN", "789%?!"), K.dot, K.del, K.ret],
          bottomRow,
        ],
      },
      qwertz: {
        name: "Deutsch (QWERTZ)",
        rows: [
          keys("QWERTZUIOP", SUB1),
          [...keys("ASDFGHJKL", SUB2), K.del],
          [K.shift, ...keys("YXCVBNM", "789%?!,"), K.dot, K.ret],
          bottomRow,
        ],
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
