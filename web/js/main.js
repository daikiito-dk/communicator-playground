(function () {
  "use strict";

  const tabs = document.querySelectorAll(".tabs [data-tab]");

  function fitAll() {
    window.Customizer.fit();
    window.Simulator.fit();
  }

  function selectTab(name) {
    for (const tab of tabs) {
      const on = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", on);
      document.getElementById("tab-" + tab.dataset.tab).hidden = !on;
    }
    const p = new URLSearchParams(location.hash.slice(1));
    p.set("tab", name);
    history.replaceState(null, "", "#" + p.toString());
    // 非表示のステージは大きさが 0 なので、表示してから寸法を合わせます。
    fitAll();
  }

  const I18n = window.I18n;
  I18n.apply();
  I18n.writeHash();
  const langSelect = document.getElementById("lang");
  for (const [code, { name }] of Object.entries(I18n.LANGS)) langSelect.add(new Option(name, code));
  langSelect.value = I18n.lang;
  langSelect.addEventListener("change", () => I18n.setLang(langSelect.value));
  I18n.onChange((lang) => {
    langSelect.value = lang;
    window.Customizer.refresh();
    window.Simulator.refresh();
  });

  window.Customizer.init();
  window.Simulator.init();
  window.Simulator.applyLook(window.Customizer.getState());
  window.Customizer.onChange((look) => window.Simulator.applyLook(look));

  for (const tab of tabs) tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  window.addEventListener("resize", fitAll);

  const initial = new URLSearchParams(location.hash.slice(1)).get("tab");
  selectTab(initial === "simulate" ? "simulate" : "customize");
})();
