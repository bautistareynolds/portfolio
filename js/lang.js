// language toggle — pairs with the inline head bootstrap (data-lang set pre-paint)
(() => {
  const KEY = "portfolio:lang";
  const html = document.documentElement;

  const HEAD = {
    en: {
      title: "bautistareynolds — software engineer",
      desc: "Software Engineer — portfolio. Projects, security research, experience.",
      ogTitle: "bautistareynolds — Software Engineer",
      ogDesc: "Software Engineer seeking roles. Projects, HackerOne, experience.",
      themeLabel: "dark",
      themeAria: "toggle theme",
    },
    es: {
      title: "bautistareynolds — ingeniero de software",
      desc: "Ingeniero de Software — portafolio. Proyectos, investigación de seguridad, experiencia.",
      ogTitle: "bautistareynolds — Ingeniero de Software",
      ogDesc: "Ingeniero de Software buscando roles. Proyectos, HackerOne, experiencia.",
      themeLabel: "oscuro",
      themeAria: "cambiar tema",
    },
  };

  function apply(lang) {
    if (lang !== "en" && lang !== "es") lang = "en";
    const h = HEAD[lang];
    html.dataset.lang = lang;
    html.lang = lang;
    document.title = h.title;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", h.desc);
    const ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute("content", h.ogTitle);
    const ogD = document.querySelector('meta[property="og:description"]');
    if (ogD) ogD.setAttribute("content", h.ogDesc);
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", h.themeAria);
    }
  }

  function current() {
    return html.dataset.lang === "es" ? "es" : "en";
  }

  function toggle() {
    const next = current() === "en" ? "es" : "en";
    try { localStorage.setItem(KEY, next); } catch {}
    if (location.search) {
      const url = new URL(location.href);
      url.search = "";
      history.replaceState(null, "", url);
    }
    apply(next);
  }

  const btn = document.getElementById("lang-toggle");
  if (btn) btn.addEventListener("click", toggle);

  window.addEventListener("popstate", () => {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "en" || q === "es") apply(q);
    else apply(current());
  });

  // sync on load (covers ?lang= deep links + back/forward)
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "es") apply(q);
  else apply(current());
})();
