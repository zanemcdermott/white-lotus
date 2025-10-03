/* =========================================================
   White Lotus Landscaping — JS (clean build)
   - Mobile nav
   - Smooth anchor scrolling (respects reduced motion)
   - Gallery lightbox (a11y)
   - Contact form (Formspree-ready)
   - Footer current year
   - Before/After slider (fixed)
   - Darken header on scroll (rAF-throttled)
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Mobile nav ---------- */
  const toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close nav after clicking a link
    $$(".nav a:not(.btn)").forEach(a =>
      a.addEventListener("click", () => document.body.classList.remove("nav-open"))
    );
  }

  /* ---------- Smooth anchor scroll ---------- */
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 68;
  const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  $$(".nav a[href^='#'], a.to-top[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - (headerHeight + 8);
      window.scrollTo(prefersReduce ? { top: y } : { top: y, behavior: "smooth" });
    });
  });

  /* ---------- Gallery lightbox (a11y) ---------- */
  const galleryImgs = $$(".gallery .tile img, .thumbs .figure img");
  if (galleryImgs.length) {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;place-items:center;z-index:80;padding:20px;";
    overlay.innerHTML = `
      <figure style="max-width:min(1200px,92vw);max-height:90vh;margin:0;display:grid;gap:10px;position:relative;">
        <img alt="" style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:12px;border:1px solid rgba(255,255,255,.15)"/>
        <figcaption style="text-align:center;color:#C9C5D3"></figcaption>
        <button type="button" aria-label="Close" style="
          position:absolute;top:14px;right:14px;border:1px solid rgba(255,255,255,.25);
          background:transparent;color:#fff;padding:6px 10px;border-radius:999px;cursor:pointer">Close ✕</button>
      </figure>`;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    document.body.appendChild(overlay);

    const imgEl = $("img", overlay);
    const capEl = $("figcaption", overlay);
    const closeBtn = $("button", overlay);
    let prevActive = null;

    const open = (src, cap) => {
      prevActive = document.activeElement;
      imgEl.src = src;
      capEl.textContent = cap || "";
      overlay.style.display = "grid";
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };
    const close = () => {
      overlay.style.display = "none";
      imgEl.removeAttribute("src");
      document.body.style.overflow = "";
      prevActive?.focus();
    };

    galleryImgs.forEach(img =>
      img.addEventListener("click", () => open(img.src, img.alt || img.dataset.caption))
    );
    overlay.addEventListener("click", e => e.target === overlay && close());
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", e => e.key === "Escape" && overlay.style.display !== "none" && close());
  }

  /* ---------- Contact form (Formspree-ready) ---------- */
  const form = $("#contactForm");
  if (form) {
    const status = document.createElement("p");
    status.id = "formStatus";
    status.className = "form-note";
    form.appendChild(status);

    const submitBtn = $("button[type='submit'], input[type='submit']", form);

    form.addEventListener("submit", async e => {
      e.preventDefault();

      const name = $("[name='name']", form)?.value?.trim();
      const email = $("[name='email']", form)?.value?.trim();
      const message = $("[name='message']", form)?.value?.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

      if (!name || !email || !message) {
        setStatus("Please fill in name, email, and a brief description.", true);
        return;
      }
      if (!emailOk) {
        setStatus("Please enter a valid email address.", true);
        return;
      }

      const endpoint = form.getAttribute("action") || "";
      if (!endpoint) {
        setStatus("Form endpoint not configured. Add your Formspree URL to the form’s action attribute.", true);
        return;
      }

      const formData = new FormData(form);
      if (!formData.has("_subject")) formData.append("_subject", "New Quote Request — White Lotus Landscaping");

      try {
        submitBtn && (submitBtn.disabled = true);
        setStatus("Sending…");

        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" }
        });

        if (res.ok) {
          form.reset();
          setStatus("Thanks! Your message has been sent. We’ll be in touch soon.", false, true);
          const redirect = form.getAttribute("data-thanks");
          if (redirect) window.location.href = redirect;
        } else {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.errors?.[0]?.message || `Request failed (${res.status})`);
        }
      } catch (err) {
        setStatus(err.message || "Something went wrong. Please try again.", true);
      } finally {
        submitBtn && (submitBtn.disabled = false);
      }
    });

    function setStatus(msg, isError = false, success = false) {
      status.textContent = msg;
      status.className = "form-note " + (isError ? "form-error" : success ? "form-success" : "");
    }
  }

  /* ---------- Footer year ---------- */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Before/After slider (FIXED) ---------- */
  document.querySelectorAll(".ba").forEach(box => {
    const range = box.querySelector(".ba-range");
    const chips = box.querySelectorAll(".ba-chip");
    if (!range) return;

    const apply = (v) => {
      const num = Math.max(0, Math.min(100, Number(v)));
      box.style.setProperty("--pos", num + "%");
      range.value = String(num);
      if (chips.length) {
        const pick = num <= 50 ? 0 : 100;
        chips.forEach(c => c.classList.toggle("active", Number(c.dataset.value) === pick));
      }
    };

    apply(isFinite(Number(range.value)) ? range.value : 50);

    range.addEventListener("input", e => apply(e.target.value));
    chips.forEach(c => c.addEventListener("click", () => apply(c.dataset.value)));

    // drag anywhere on the box
    const drag = (ev) => {
      const r = box.getBoundingClientRect();
      const pct = ((ev.clientX - r.left) / r.width) * 100;
      apply(pct);
    };
    box.addEventListener("pointerdown", (e) => {
      if (e.target === range) return; // let native range handle
      e.preventDefault();
      drag(e);
      const move = (e2) => drag(e2);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up, { once: true });
    });
  });
});

/* ---------- Darken header on scroll (throttled) ---------- */
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  let ticking = false;
  const handle = () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(handle);
      ticking = true;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  handle();
})();

/* ===== Lightbox: grouped per project card ===== */
(() => {
  // Build overlay once
  const lb = document.createElement("div");
  lb.className = "lb";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.innerHTML = `
    <figure class="lb-fig">
      <img class="lb-img" alt="">
      <figcaption class="lb-cap"></figcaption>
      <button type="button" class="lb-btn lb-prev" aria-label="Previous">‹</button>
      <button type="button" class="lb-btn lb-next" aria-label="Next">›</button>
      <button type="button" class="lb-close" aria-label="Close">✕</button>
      <div class="lb-count" aria-live="polite"></div>
    </figure>`;
  document.body.appendChild(lb);

  const imgEl = lb.querySelector(".lb-img");
  const capEl = lb.querySelector(".lb-cap");
  const prevBtn = lb.querySelector(".lb-prev");
  const nextBtn = lb.querySelector(".lb-next");
  const closeBtn = lb.querySelector(".lb-close");
  const countEl = lb.querySelector(".lb-count");

  let state = { list: [], i: 0, prevActive: null };

  const show = (i) => {
    if (!state.list.length) return;
    state.i = (i + state.list.length) % state.list.length;
    const it = state.list[state.i];
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    capEl.textContent = it.alt || "";
    countEl.textContent = `${state.i + 1} / ${state.list.length}`;
  };
  const open = (items, index) => {
    state.list = items;
    if (!state.list.length) return;
    state.prevActive = document.activeElement;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    show(index);
    closeBtn.focus();
  };
  const close = () => {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    imgEl.removeAttribute("src");
    state.prevActive?.focus();
  };

  // For each project card, gather images and attach click handlers
  document.querySelectorAll('.card[data-cat]').forEach(card => {
    const gridImgs = [...card.querySelectorAll('.build-grid img')];
    if (!gridImgs.length) return;

    // Optional: include BA before/after first if present
    const before = card.querySelector('.ba img.before');
    const after  = card.querySelector('.ba img.after');

    const items = [];
    if (before?.src) items.push({ src: before.src, alt: before.alt || "Before" });
    if (after?.src)  items.push({ src: after.src,  alt: after.alt  || "After"  });
    gridImgs.forEach(img => items.push({ src: img.src, alt: img.alt || "" }));

    // Click to open starting at the clicked thumbnail index (offset by BA count)
    const offset = (before?1:0) + (after?1:0);
    gridImgs.forEach((img, idx) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => open(items, offset + idx));
    });
  });

  // Overlay controls
  prevBtn.addEventListener("click", () => show(state.i - 1));
  nextBtn.addEventListener("click", () => show(state.i + 1));
  closeBtn.addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(state.i - 1);
    if (e.key === "ArrowRight") show(state.i + 1);
  });

  // Swipe
  let sx = 0, sy = 0;
  imgEl.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; imgEl.setPointerCapture(e.pointerId); });
  imgEl.addEventListener("pointerup", (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 30 && Math.abs(dy) < 40) (dx > 0 ? prevBtn : nextBtn).click();
  });
})();
