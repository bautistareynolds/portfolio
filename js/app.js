(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const valid = new Set(tabs.map(t => t.dataset.tab));

  function activate(id, push) {
    if (!valid.has(id)) id = "about";
    for (const t of tabs) {
      const on = t.dataset.tab === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    for (const p of panels) {
      const on = p.dataset.panel === id;
      p.hidden = !on;
      p.classList.toggle("is-active", on);
    }
    if (push) {
      const next = "#" + id;
      if (location.hash !== next) history.pushState(null, "", next);
    } else if (location.hash !== "#" + id) {
      history.replaceState(null, "", "#" + id);
    }
  }

  // click
  for (const t of tabs) {
    t.addEventListener("click", () => activate(t.dataset.tab, true));
  }

  // keyboard: arrows, Home/End
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    tablist.addEventListener("keydown", (e) => {
      const idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;
      let next = -1;
      if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      else return;
      e.preventDefault();
      tabs[next].focus();
      activate(tabs[next].dataset.tab, true);
    });
  }

  // in-panel links like [projects →]
  for (const a of document.querySelectorAll("[data-link]")) {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("data-link");
      activate(id, true);
      document.getElementById("tab-" + id)?.focus();
    });
  }

  // hash routing
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (valid.has(id)) activate(id, false);
  });
  window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);
    if (valid.has(id)) activate(id, false);
  });

  // init
  const initial = location.hash.slice(1);
  activate(valid.has(initial) ? initial : "about", false);
})();

// copy buttons (contact panel)
(() => {
  const buttons = [...document.querySelectorAll(".copy-btn")];
  for (const btn of buttons) {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      const done = () => {
        btn.classList.add("is-copied");
        const ico = btn.querySelector(".copy-ico");
        const prev = ico ? ico.innerHTML : "";
        if (ico) ico.innerHTML = '<path d="M20 6 9 17l-5-5"/>';
        setTimeout(() => {
          btn.classList.remove("is-copied");
          if (ico) ico.innerHTML = prev;
        }, 1200);
      };
      try {
        await navigator.clipboard.writeText(text);
        done();
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch {}
        document.body.removeChild(ta);
      }
    });
  }
})();

// Modals & blueprints
(() => {
  const modalOpenBtns = [...document.querySelectorAll(".btn-arch-modal, .modal-open-btn")];

  modalOpenBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-modal");
      const modalEl = document.getElementById(modalId);
      if (!modalEl) return;
      modalEl.classList.add("is-active");
      modalEl.setAttribute("aria-hidden", "false");
    });
  });

  // Blueprint inspector node data
  const nodeDetails = {
    "orchid-coord": {
      title: "Coordinator Core (FastAPI)",
      port: "Port 8000",
      desc: "Task supervisor loop, flock lock management (/tmp/orchid-agent.lock), agent lease reaper, LiteLLM budget minting, and staging draft findings for human review."
    },
    "orchid-db": {
      title: "State & Telemetry Store",
      port: "PostgreSQL 16 (:5433) + Redis 7",
      desc: "PostgreSQL holds task lifecycle tables, scope definitions, and drafted findings. Redis Pub/Sub streams live agent execution telemetry to operator dashboards."
    },
    "orchid-gateway": {
      title: "Failover LLM Gateway (LiteLLM)",
      port: "Port 4000",
      desc: "Tiered proxy router balancing primary models (Claude 3.7 / Gemini 2.5 Pro) with automated 429/5xx failover to Flash models, plus per-agent spend budgets ($5.00 limit)."
    },
    "orchid-worker": {
      title: "Disposable Agent Swarm",
      port: "Isolated Sandboxes (agent-01..N)",
      desc: "Isolated execution sandboxes with dedicated Playwright browser sessions, cookie jars, ephemeral mail inboxes, and finding drafts (findings_draft tool only)."
    },
    "orchid-mail": {
      title: "Gaggle Mail Intake Sink",
      port: "gaggle-mail MCP",
      desc: "Shared secret authenticated sink (x-orchid-secret) generating ephemeral inboxes (@gaggle.land) for automated email verification and OTP code extraction."
    },
    "orchid-shaper": {
      title: "Egress Traffic Shaper (mitmproxy)",
      port: "Port 8080",
      desc: "Centralized token-bucket rate limiter enforcing target host limits compiled from scope YAML, injecting security research headers, and logging all egress bytes."
    },
    "orchid-browser": {
      title: "Stealth Browser Engine",
      port: "Playwright Runtime",
      desc: "Headless/headed browser automation with storage state save/restore, anti-bot handling, DOM snapshotting, and network interception."
    },
    "orchid-gate": {
      title: "Human-in-the-Loop Review Gate",
      port: "Manual Verification",
      desc: "Security boundary: Autonomous agents lack submission privileges entirely. All discovered vulnerabilities are drafted and require human operator review before dispatch."
    },
    "orchid-target": {
      title: "Authorized Bounty Scopes & Sinks",
      port: "External Target Hosts",
      desc: "Strictly scoped target endpoints receiving rate-controlled HTTP/WebSocket requests with research attribution headers attached."
    },
    "orchid-librarian": {
      title: "Autonomous Librarian Engine",
      port: "Background Scheduler (2h Loop)",
      desc: "Coordinator daemon that reads agent journal entries past each agent's watermark, calls LLM models to extract quirk, dead_end, and endpoint facts, dedupes them into KB markdown files, and automatically mints new recon tasks."
    },
    "orchid-accounts": {
      title: "Dual-Account Checkout Pool",
      port: "Account Checkout Manager",
      desc: "Pool of authenticated target accounts managed by the coordinator. Grants agent-01 dual credentials (browser-a for victim, browser-b for attacker) to conclusively prove authorization bypasses (BOLA/IDOR)."
    },
    "orchid-tokenbucket": {
      title: "Two-Tier Shared Token Bucket",
      port: "mitmproxy / ratelimit.py",
      desc: "Globally shared token bucket across all agents: strict 'backend' bucket (capacity: 8, rate: 2 req/s for API/JSON) prevents host anti-abuse bans, while 'static' bucket (capacity: 60, rate: 30 req/s) handles media and assets."
    },
    "orchid-connect": {
      title: "CONNECT 407 Tunnel Auth",
      port: "mitmproxy http_connect Hook",
      desc: "Intercepts HTTPS CONNECT tunnels before headers are sent to authenticate agents without triggering Chromium auth errors, stripping Proxy-Authorization before forwarding to the target."
    },
    "orchid-dash": {
      title: "Operator Real-Time Dashboard",
      port: "WebSocket :8000 + SPA UI",
      desc: "Live operator telemetry stream showing active agent execution steps, model burn rates, spend budgets, and pending vulnerability drafts for review."
    },
    "orchid-kb": {
      title: "Target Knowledge & Scope YAML",
      port: "Librarian + PostgreSQL",
      desc: "Historical target intelligence, technology profiles, scope boundary definitions, and proxy floor rules loaded dynamically by agent supervisor loops."
    },
    "orchid-keys": {
      title: "Spend Budget Caps & Keys",
      port: "Per-Task Key Minting",
      desc: "Ephemeral LiteLLM gateway tokens minted per task with strict $5.00 spend caps to guarantee zero runaway model costs."
    },
    "orchid-store-coord": {
      title: "coordinator.db (SQLite Store)",
      port: "coordinator/coordinator.db",
      desc: "Primary coordinator database: tasks, account leases, fingerprints, findings drafts, heartbeats, complaints, model switches, and librarian run state."
    },
    "orchid-store-proxy": {
      title: "Proxy Logstore (index.db + requests.jsonl)",
      port: "logs/proxy/index.db",
      desc: "Pure web egress request store: req_id, timestamp, agent_id, account_id, method, URL, status, bytes, and duration. Rotated hourly to *.jsonl.gz."
    },
    "orchid-store-llm": {
      title: "LiteLLM Spend & Inference Store",
      port: "Postgres (:5433) / LiteLLM",
      desc: "Model inference database tracking start/end times, model names, prompt tokens, completion tokens, time-to-first-token (TTFT), and per-agent spend."
    },
    "orchid-store-fs": {
      title: "Filesystem Knowledge & Journals",
      port: "shared/knowledge-base/ & agents/<id>/",
      desc: "Unstructured durable store: Markdown KB slices, target quirks, verified dead-ends, per-agent execution journals, and full request detail JSONs."
    },
    "orchid-attack-victim": {
      title: "Victim Session (browser-a)",
      port: "Playwright Profile A",
      desc: "Legitimate target user session logged in via checked-out pool account. Accesses protected resources, creates secret payloads, and extracts target resource IDs/tokens."
    },
    "orchid-attack-attacker": {
      title: "Attacker Session (browser-b / curl)",
      port: "Playwright Profile B + Shell",
      desc: "Hostile user session attempting unauthorized state mutations and data reads against victim's resource ID to prove IDOR/BOLA bypasses."
    },
    "orchid-attack-proof": {
      title: "Comparative Exploit Verification",
      port: "findings_draft Evidence Gate",
      desc: "Side-by-side automated verification: validates that attacker session achieved 200 OK access to victim's private resource without required authorization."
    },
    "orchid-fast-loop": {
      title: "Task Execution Loop (Minutes)",
      port: "Agent Supervisor Iteration",
      desc: "Oldest open task claimed with 1800s lease ➔ sandboxed agent execution ➔ dual-account probe ➔ journal entry written ➔ task released as done, inconclusive, or blocked."
    },
    "orchid-slow-loop": {
      title: "Librarian Distillation Loop (2 Hours)",
      port: "Coordinator Scheduler Thread",
      desc: "Scans agent journals past watermarks ➔ calls LLM to extract quirk, dead-end, and endpoint facts ➔ appends deduplicated knowledge ➔ auto-mints recon tasks for new endpoints."
    },
    "orchid-gauge-backend": {
      title: "Backend Token Bucket (Strict Pacing)",
      port: "Capacity: 8, Rate: 2 req/s",
      desc: "Global token bucket throttling API, GraphQL, and JSON calls across all agents simultaneously, guaranteeing the swarm never triggers target anti-abuse ban waves."
    },
    "orchid-gauge-static": {
      title: "Static Token Bucket (High Capacity)",
      port: "Capacity: 60, Rate: 30 req/s",
      desc: "High-throughput token bucket dedicated to images, scripts, CSS, and media assets, ensuring full browser DOM fidelity without failing page asset loads."
    },
    "gaggle-dev": {
      title: "Git Repository & Commit Trigger",
      port: "GitHub Repository",
      desc: "Code commits and pull requests to main trigger the automated CI/CD pipeline via GitHub Actions webhooks."
    },
    "gaggle-ci": {
      title: "Integration CI Workflow (.github/workflows/ci.yml)",
      port: "GitHub Actions Matrix",
      desc: "Spins up ephemeral PostgreSQL 16 and Redis 7 service containers with health checks to run 'go vet ./...' and 'go test ./...'. Frontend job runs Node 24 'npm ci', 'npm run lint', and 'npm run build'."
    },
    "gaggle-cd": {
      title: "Terraform & Continuous Deployment",
      port: "AWS EC2 + SSH Pipeline",
      desc: "Terraform provisions the AWS EC2 instance (Amazon Linux 2023) and VPC security groups (ports 22, 80, 443). GitHub Actions CD pipes base64 secrets to /tmp/gaggle-env and executes deploy/apply.sh over SSH to update and run the full Docker Compose stack (Nginx, Go Chi, Postgres, Redis)."
    },
    "gaggle-client": {
      title: "Web Client (React 18 + TypeScript)",
      port: "Browser / SPA",
      desc: "Single-page application running in the user's browser with shadcn/ui components, communicating with the AWS EC2 host over HTTPS :443 with HttpOnly cookie sessions and real-time SSE streams."
    },
    "gaggle-nginx": {
      title: "Edge Reverse Proxy (Nginx)",
      port: "Port 443 / 80 (Docker)",
      desc: "Containerized edge proxy on the AWS EC2 host. Handles TLS 1.3 termination with Certbot automated renewal, serves cached static SPA assets, and reverse-proxies /api/* and SSE event streams to Go Chi :8080."
    },
    "gaggle-api": {
      title: "Core Backend API Server (Go Chi)",
      port: "Port 8080",
      desc: "High-performance HTTP server handling JWT access auth + HttpOnly refresh cookie rotation, keyset cursor pagination, sliding-window rate limiters, and SSE broadcast brokers."
    },
    "gaggle-postgres": {
      title: "Relational Database (PostgreSQL 16)",
      port: "Port 5432",
      desc: "ACID persistence for users, posts, replies, and bookmarks with automated startup migrations and EBS volume persistence on AWS EC2."
    },
    "gaggle-redis": {
      title: "Event Bus & Cache (Redis 7)",
      port: "Port 6379",
      desc: "In-memory Pub/Sub message broker for real-time notification push, sliding-window auth rate limiters, and cached home feed timelines."
    }
  };

  document.querySelectorAll(".svg-group-node").forEach((node) => {
    const handleNode = () => {
      const inspectKey = node.getAttribute("data-inspect");
      const info = nodeDetails[inspectKey];
      if (!info) return;

      const svgWrap = node.closest(".svg-diagram-wrap");
      if (svgWrap) {
        svgWrap.querySelectorAll(".svg-group-node").forEach((n) => n.classList.remove("is-active"));
        node.classList.add("is-active");
      }

      const modal = node.closest(".tech-modal");
      if (!modal) return;

      if (inspectKey.startsWith("orchid")) {
        const t = modal.querySelector("#orchid-insp-title");
        const p = modal.querySelector("#orchid-insp-port");
        const d = modal.querySelector("#orchid-insp-desc");
        if (t) t.textContent = info.title;
        if (p) p.textContent = info.port;
        if (d) d.textContent = info.desc;
      } else if (inspectKey.startsWith("gaggle")) {
        const t = modal.querySelector("#gaggle-insp-title");
        const p = modal.querySelector("#gaggle-insp-port");
        const d = modal.querySelector("#gaggle-insp-desc");
        if (t) t.textContent = info.title;
        if (p) p.textContent = info.port;
        if (d) d.textContent = info.desc;
      }
    };

    node.addEventListener("click", handleNode);
    node.addEventListener("mouseenter", handleNode);
  });

  // Diagram variant switcher
  document.querySelectorAll(".dvar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const variant = btn.getAttribute("data-variant");
      const modal = btn.closest(".tech-modal");
      if (!modal) return;

      const switcher = btn.closest(".diagram-variant-switcher");
      if (switcher) {
        switcher.querySelectorAll(".dvar-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      }

      modal.querySelectorAll(".orchid-variant-pane").forEach((pane) => {
        pane.classList.remove("is-active");
      });
      const targetPane = modal.querySelector(`#pane-orchid-${variant}`);
      if (targetPane) {
        targetPane.classList.add("is-active");
      }
    });
  });

  // SVG zone filter buttons
  document.querySelectorAll(".svg-layer-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-svg-filter");
      const modal = btn.closest(".tech-modal");
      if (!modal) return;

      const bar = btn.closest(".svg-layer-filter-bar");
      if (bar) {
        bar.querySelectorAll(".svg-layer-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      }

      const svg = modal.querySelector(".schematic-svg");
      if (!svg) return;

      if (filter === "all") {
        svg.classList.remove("has-layer-filter");
        svg.querySelectorAll("[data-layer]").forEach((el) => {
          el.classList.remove("is-dimmed");
        });
      } else {
        svg.classList.add("has-layer-filter");
        svg.querySelectorAll("[data-layer]").forEach((el) => {
          const layers = (el.getAttribute("data-layer") || "").split(" ");
          if (layers.includes(filter)) {
            el.classList.remove("is-dimmed");
          } else {
            el.classList.add("is-dimmed");
          }
        });
      }
    });
  });

  document.querySelectorAll(".tech-modal-overlay").forEach((overlay) => {
    const closeBtn = overlay.querySelector(".modal-close-btn");
    const close = () => {
      overlay.classList.remove("is-active");
      overlay.setAttribute("aria-hidden", "true");
    };
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".tech-modal-overlay.is-active").forEach((overlay) => {
        overlay.classList.remove("is-active");
        overlay.setAttribute("aria-hidden", "true");
      });
    }
  });
})();

// Photo gallery
(() => {
  const container = document.querySelector(".gallery-container");
  const galleryEl = document.querySelector(".gallery");
  if (!container || !galleryEl) return;

  const items = [
    {
      id: "kunimi",
      filename: "kunimi-neighborhood.webp",
      city: "Sendai",
      region: "Tohoku",
      src: "assets/img/japan/kunimi-neighborhood.webp",
      alt: "Kunimi neighborhood in Sendai",
      captionHtml: '<span class="lang-en">Kunimi neighborhood — Sendai</span><span class="lang-es">Barrio de Kunimi — Sendai</span>'
    },
    {
      id: "gyoen",
      filename: "shinjuku-gyoen.webp",
      city: "Tokyo",
      region: "Kanto",
      src: "assets/img/japan/shinjuku-gyoen.webp",
      alt: "Shinjuku Gyoen National Garden in Tokyo",
      captionHtml: '<span class="lang-en">Shinjuku Gyoen National Garden — Tokyo</span><span class="lang-es">Jardín Nacional Shinjuku Gyoen — Tokio</span>'
    },
    {
      id: "shinkansen",
      filename: "shinkansen-sendai-station.webp",
      city: "Sendai",
      region: "Tohoku",
      src: "assets/img/japan/shinkansen-sendai-station.webp",
      alt: "Shinkansen at Sendai Station",
      captionHtml: '<span class="lang-en">Shinkansen at Sendai Station</span><span class="lang-es">Shinkansen en la estación de Sendai</span>'
    },
    {
      id: "kanda",
      filename: "kanda-shrine.webp",
      city: "Tokyo",
      region: "Kanto",
      src: "assets/img/japan/kanda-shrine.webp",
      alt: "Kanda Myojin shrine, Zuishin-mon main gate, Tokyo",
      captionHtml: '<span class="lang-en">Kanda Myojin — Zuishin-mon gate, Tokyo</span><span class="lang-es">Kanda Myojin — puerta Zuishin-mon, Tokio</span>'
    },
    {
      id: "yamagata",
      filename: "yamagata.webp",
      city: "Yamagata",
      region: "Tohoku",
      src: "assets/img/japan/yamagata.webp",
      alt: "Mountain valley landscape in Yamagata",
      captionHtml: '<span class="lang-en">mountain valley landscape — Yamagata</span><span class="lang-es">paisaje del valle montañoso — Yamagata</span>'
    },
    {
      id: "team",
      filename: "with-the-team.webp",
      city: "Tokyo",
      region: "Kanto",
      src: "assets/img/japan/with-the-team.webp",
      alt: "The internship team and mentors in Tokyo",
      captionHtml: '<span class="lang-en">with the internship team &amp; mentors — Tokyo</span><span class="lang-es">con el equipo de la pasantía y los mentores — Tokio</span>'
    }
  ];

  const stackWrap = document.createElement("div");
  stackWrap.className = "stack-wrap";
  const stackRotations = [-5, 3, -2, 4, -4, 2];
  stackWrap.innerHTML =
    '<div class="stack-stage">' +
    items.map((it, i) => `
      <div class="stack-card ${i===0?'is-active':''}" data-idx="${i}" style="transform: rotate(${stackRotations[i]}deg) translateX(${(i-2.5)*18}px); z-index: ${items.length - i}">
        <img src="${it.src}" alt="${it.alt}">
        <div class="stack-caption">${it.captionHtml}</div>
      </div>`).join("") +
    '</div>' +
    '<div class="stack-controls">' +
    '<span class="stack-counter">01 / 06 — ' + items[0].city + ' (' + items[0].region + ')</span>' +
    '<div class="stack-nav">' +
    '<button type="button" class="stack-btn st-prev">‹ <span class="lang-en">prev</span><span class="lang-es">anterior</span></button>' +
    '<button type="button" class="stack-btn st-next"><span class="lang-en">next</span><span class="lang-es">siguiente</span> ›</button>' +
    '</div>' +
    '</div>';
  container.appendChild(stackWrap);

  let stackIdx = 0;
  const stackCards = [...stackWrap.querySelectorAll(".stack-card")];
  const stackCounter = stackWrap.querySelector(".stack-counter");

  function updateStack(i) {
    stackIdx = (i + items.length) % items.length;
    stackCards.forEach((card, idx) => {
      const offset = (idx - stackIdx + items.length) % items.length;
      card.classList.toggle("is-active", idx === stackIdx);
      if (idx === stackIdx) {
        card.style.zIndex = "10";
      } else {
        card.style.zIndex = String(10 - offset);
        card.style.transform = `rotate(${stackRotations[idx]}deg) translateX(${(offset - 2.5) * 22}px)`;
      }
    });
    stackCounter.innerHTML = `0${stackIdx + 1} / 0${items.length} — ${items[stackIdx].city} (${items[stackIdx].region})`;
  }

  stackCards.forEach((card, i) => card.addEventListener("click", () => updateStack(i)));
  stackWrap.querySelector(".st-prev").addEventListener("click", () => updateStack(stackIdx - 1));
  stackWrap.querySelector(".st-next").addEventListener("click", () => updateStack(stackIdx + 1));

  // Global Keyboard Navigation (j/k or ArrowLeft/ArrowRight)
  document.addEventListener("keydown", (e) => {
    if (document.getElementById("panel-experience")?.getAttribute("hidden") !== null) return;
    const delta = (e.key === "ArrowRight" || e.key === "j") ? 1 : ((e.key === "ArrowLeft" || e.key === "k") ? -1 : 0);
    if (delta) updateStack(stackIdx + delta);
  });
})();
