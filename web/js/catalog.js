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
    { label: "", value: "Apps", cls: "mod round apps", cx: 24.56, titleKey: "key.apps" },
    { label: "", value: " ", cls: "space", cx: 39.4, w: 20.8, titleKey: "key.space" },
    { label: "", value: "ClicksKey", cls: "clicks round", cx: 54.1, titleKey: "key.clicks" },
    { label: "☺", value: "Emoji", cls: "mod round", cx: 61.5, titleKey: "key.emoji" },
    { label: "alt", value: "Alt", cls: "mod round small", cx: 68.9 },
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

    // 公式サイトのカバー一覧（カルーセルの並び順）。色は製品画像の平らな部分から計測し、上下に明暗をつけています。
    // どのカバーも同じ穴あき（パンチング）仕上げです。
    covers: [
      { id: "cognac", name: "Cognac", bg: "linear-gradient(160deg, #8c6845, #6a4b2f)" },
      { id: "surf", name: "Surf", bg: "linear-gradient(160deg, #4f596a, #383f4b)" },
      { id: "miami-beach", name: "Miami Beach", bg: "linear-gradient(160deg, #b07689, #8a5466)" },
      { id: "dune", name: "Dune", bg: "linear-gradient(160deg, #bab5ae, #938e88)" },
      { id: "spice", name: "Spice", bg: "linear-gradient(160deg, #9a6c34, #744f22)" },
      { id: "clover", name: "Clover", bg: "linear-gradient(160deg, #37402f, #252b20)" },
      { id: "vino", name: "Vino", bg: "linear-gradient(160deg, #3e2f2f, #291e1e)" },
      { id: "onyx", name: "Onyx", bg: "linear-gradient(160deg, #42423f, #2a2a28)" },
      { id: "surge", name: "Surge", bg: "linear-gradient(160deg, #b6b553, #919138)" },
      { id: "bloom", name: "Bloom", bg: "linear-gradient(160deg, #8a7984, #675863)" },
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
      { id: "case", nameKey: "acc.case" },
      { id: "ring", nameKey: "acc.ring" },
    ],

    // 名前と最初のメッセージは i18n.js の contact.<id> と contact.<id>.msg です。
    contacts: [
      { id: "mom", app: "SMS", color: "#ff7eb6" },
      { id: "boss", app: "Slack", color: "#ff5a4f" },
      { id: "telegram", app: "Telegram", color: "#4fb3ff" },
      { id: "whatsapp", app: "WhatsApp", color: "#4ce07a" },
    ],
  };
})();
