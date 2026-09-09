(() => {
  const KEY = "portfolio:theme";
  const html = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const meta = document.querySelector('meta[name="color-scheme"]');

  function getInitial() {
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "light" || q === "dark") return q;
    const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
    if (saved === "light" || saved === "dark") return saved;
    return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  let current = getInitial();

  function syncUI(theme) {
    if (meta) meta.content = theme === "light" ? "light" : "dark";
    html.style.colorScheme = theme;
    if (btn) {
      btn.setAttribute("aria-pressed", String(theme === "light"));
      btn.setAttribute("aria-label", theme === "light" ? "switch to dark" : "switch to light");
      const en = btn.querySelector(".lang-en");
      const es = btn.querySelector(".lang-es");
      if (en) en.textContent = theme === "light" ? "light" : "dark";
      if (es) es.textContent = theme === "light" ? "claro" : "oscuro";
    }
  }

  function apply(theme, { animate = true } = {}) {
    if (theme !== "light" && theme !== "dark") theme = "dark";
    current = theme;
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doSwap = () => {
      html.dataset.theme = theme;
      syncUI(theme);
      try { localStorage.setItem(KEY, theme); } catch {}
      if (location.search) {
        const url = new URL(location.href);
        url.search = "";
        history.replaceState(null, "", url);
      }
    };

    if (!animate || prefersReduced) {
      doSwap();
      return;
    }

    // progressive stagger via .theme-animating class
    html.classList.add("theme-animating");
    // Trigger in next frame so transition properties apply
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        doSwap();
      });
    });
    const dur = 700;
    setTimeout(() => html.classList.remove("theme-animating"), dur);
  }

  // init without animation (avoid FOUC double transition)
  html.dataset.theme = current;
  syncUI(current);

  if (btn) {
    btn.addEventListener("click", () => {
      const next = current === "dark" ? "light" : "dark";
      // View Transition API if available — gives a nicer progressive reveal, fallback to stagger
      if (document.startViewTransition) {
        document.startViewTransition(() => apply(next, { animate: false }));
        // still add stagger class for browsers that support VT
        html.classList.add("theme-animating");
        setTimeout(() => html.classList.remove("theme-animating"), 700);
      } else {
        apply(next, { animate: true });
      }
    });
  }

  // respect system changes only if no explicit choice saved
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    if (saved) return;
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "light" || q === "dark") return;
    apply(e.matches ? "light" : "dark", { animate: true });
  });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if ((e.altKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "t") {
      e.preventDefault();
      apply(current === "dark" ? "light" : "dark", { animate: true });
    }
  });

  // expose
  window.__theme = { get: () => current, set: (t) => apply(t, { animate: true }) };
})();
