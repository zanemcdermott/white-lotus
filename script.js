/* =========================================================
   White Lotus Landscaping — JS
   - Mobile nav
   - Smooth anchor scrolling
   - Gallery lightbox
   - Contact form (Formspree-ready)
   - Footer current year
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
  const headerHeight = $(".site-header")?.offsetHeight || 68;
  $$(".nav a[href^='#'], a.to-top[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - (headerHeight + 8);
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  /* ---------- Gallery lightbox ---------- */
  const galleryImgs = $$(".gallery .tile img, .thumbs .figure img");
  if (galleryImgs.length) {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;place-items:center;z-index:80;padding:20px;";
    overlay.innerHTML = `
      <figure style="max-width:min(1200px,92vw);max-height:90vh;margin:0;display:grid;gap:10px;">
        <img alt="" style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:12px;border:1px solid rgba(255,255,255,.15)"/>
        <figcaption style="text-align:center;color:#C9C5D3"></figcaption>
        <button aria-label="Close"
          style="position:absolute;top:14px;right:14px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;padding:6px 10px;border-radius:999px;cursor:pointer">Close ✕</button>
      </figure>`;
    document.body.appendChild(overlay);

    const imgEl = $("img", overlay);
    const capEl = $("figcaption", overlay);
    const closeBtn = $("button", overlay);

    const open = (src, cap) => {
      imgEl.src = src;
      capEl.textContent = cap || "";
      overlay.style.display = "grid";
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      overlay.style.display = "none";
      imgEl.removeAttribute("src");
      document.body.style.overflow = "";
    };

    galleryImgs.forEach(img =>
      img.addEventListener("click", () => open(img.src, img.alt || img.dataset.caption))
    );
    overlay.addEventListener("click", e => e.target === overlay && close());
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", e => e.key === "Escape" && close());
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

      if (!name || !email || !message) {
        setStatus("Please fill in name, email, and a brief description.", true);
        return;
      }

      const endpoint = form.getAttribute("action") || "";
      const formData = new FormData(form);

      // Optional subject for Formspree
      if (!formData.has("_subject")) formData.append("_subject", "New Quote Request — White Lotus Landscaping");

      try {
        submitBtn && (submitBtn.disabled = true);
        setStatus("Sending…");

        if (endpoint.startsWith("https://")) {
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
        } else {
          // Not configured yet
          throw new Error(
            "Form endpoint not configured. Add your Formspree URL to the form’s action attribute."
          );
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


});

// Darken header once you start scrolling (helps over hero images)
const header = document.querySelector('.site-header');
if (header){
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

document.querySelectorAll('.ba').forEach(box=>{
  const range = box.querySelector('.ba-range');
  const chips = box.querySelectorAll('.ba-chip');
  if (!range || !chips.length) return;

  const setPos = (pct)=>{
    range.value = pct;
    range.dispatchEvent(new Event('input', { bubbles: true }));
  };

  chips.forEach(c=>{
    c.addEventListener('click', ()=>{
      setPos(c.dataset.value);
      chips.forEach(x=>x.classList.toggle('active', x===c));
    });
  });

  const init = Number(range.value || 50);
  chips.forEach(c=>c.classList.toggle(
    'active',
    Number(c.dataset.value) === (init <= 50 ? 0 : 100)
  ));
});


