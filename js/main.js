/* =========================================================
   Ansari Mohd Atif — Portfolio
   Scroll choreography: Lenis (smooth scroll) + GSAP ScrollTrigger.
   A single 3D phone travels through the "journey" sections.
   ========================================================= */

// Where enquiries go. To receive form submissions without opening the visitor's
// email app, create a free form at https://formspree.io and paste its URL here,
// e.g. "https://formspree.io/f/abcdwxyz". Left empty, the form opens a pre-filled email.
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = "codewithatif@gmail.com";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);
const motion = hasGsap && !reduceMotion;
if (!motion) root.classList.add("no-motion");

/* ---------- Build the phone's 3D body (stacked rounded layers) ---------- */
$$("[data-phone]").forEach((phone) => {
  const depth = 22, count = 12;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const ly = document.createElement("i");
    ly.className = "ly";
    ly.style.transform = `translateZ(${(-depth / 2 + 1 + (i * (depth - 2)) / (count - 1)).toFixed(2)}px)`;
    frag.appendChild(ly);
  }
  phone.prepend(frag);
});

/* ---------- Split text into characters (words kept together) ---------- */
function split(el) {
  const text = el.textContent.trim();
  el.innerHTML = `<span class="sr">${text}</span>` + text
    .split(" ")
    .map((word) => `<span class="w" aria-hidden="true" style="display:inline-block;white-space:nowrap">${[...word].map((c) => `<span class="ch">${c}</span>`).join("")}</span>`)
    .join('<span class="sp"> </span>');
  return $$(".ch", el);
}
if (motion) {
  $$(".split").forEach(split);
  $$("[data-fill]").forEach((el) => { el.classList.add("split"); split(el); });
}

/* ---------- Fit big lines edge to edge ---------- */
function fitText() {
  $$("[data-fit]").forEach((el) => {
    el.style.fontSize = "100px";
    el.style.width = "";
    const avail = el.clientWidth;
    el.style.width = "max-content";
    const natural = el.getBoundingClientRect().width;
    el.style.width = "";
    let size = 100 * (avail / natural) * 0.985;
    if (el.dataset.maxVh) size = Math.min(size, (window.innerHeight * Number(el.dataset.maxVh)) / 100);
    if (natural && avail) el.style.fontSize = `${Math.floor(size)}px`;
  });
}
fitText();
document.fonts?.ready.then(() => { fitText(); if (motion) ScrollTrigger.refresh(); });

/* ---------- Menu ---------- */
const menu = $("#menu");
const menuBtn = $(".menu-open");
const setMenu = (open) => {
  menu.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  if (open) $("a", menu).focus();
};
menuBtn.addEventListener("click", () => setMenu(true));
$(".menu-close").addEventListener("click", () => setMenu(false));
$$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

/* ---------- Gig buttons pre-select the service in the form ---------- */
$$("[data-gig]").forEach((btn) =>
  btn.addEventListener("click", () => {
    $("#type").value = btn.dataset.gig;
    $(".form-note").textContent = `Selected: ${btn.dataset.gig}. Add a few details and send.`;
  })
);

/* ---------- Background pattern spotlight follows the cursor ---------- */
if (window.matchMedia("(hover: hover)").matches) {
  let raf = 0, mx = 0, my = 0;
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      root.style.setProperty("--mx", `${mx}px`);
      root.style.setProperty("--my", `${my}px`);
      raf = 0;
    });
  }, { passive: true });
}

/* ---------- Counters ---------- */
function countUp(el) {
  const to = Number(el.dataset.to);
  if (!motion) { el.textContent = to; return; }
  const obj = { v: 0 };
  gsap.to(obj, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(obj.v)) });
}
if (!motion) $$(".count").forEach(countUp);

/* ---------- Contact form ---------- */
const form = $("#contact-form");
const note = $(".form-note", form);
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let valid = true;
  $$("[required]", form).forEach((f) => {
    const ok = f.value.trim() !== "" && f.checkValidity();
    f.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
  });
  if (!valid) { note.textContent = "Please add your name, a valid email and a few project details."; return; }

  const data = Object.fromEntries(new FormData(form));
  if (FORM_ENDPOINT) {
    note.textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      note.textContent = "Thanks! Your enquiry was sent — I'll reply within 24 hours.";
    } catch {
      note.textContent = `Something went wrong. Please email me directly at ${CONTACT_EMAIL}.`;
    }
    return;
  }
  const subject = `Project enquiry: ${data.type} — ${data.name}`;
  const body = [`Name: ${data.name}`, `Email: ${data.email}`, `Service: ${data.type}`, `Budget: ${data.budget || "Not specified"}`, "", data.message].join("\n");
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  note.textContent = `Opening your email app… If nothing happens, email ${CONTACT_EMAIL}.`;
});

$("#year").textContent = new Date().getFullYear();

/* =========================================================
   MOTION (skipped entirely for reduced motion / no GSAP)
   ========================================================= */
if (motion) {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: "smooth" });
    })
  );

  /* ---------- Nav hides on scroll down ---------- */
  const nav = $(".nav");
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle("hide", y > window.innerHeight * 0.6 && y > lastY);
      lastY = y;
    },
  });

  /* ---------- Hero intro ---------- */
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".hero-giant .ch", { yPercent: 115, duration: 1.3, stagger: 0.035 })
    .from(".hero-sub .ch", { yPercent: 115, duration: 1, stagger: 0.02 }, 0.35)
    .from([".hero-kicker", ".hero-foot", ".scroll-cue", ".nav-row"], { autoAlpha: 0, y: 20, duration: 1, stagger: 0.08 }, 0.5)
    .from(".hero .dots", { scaleX: 0, transformOrigin: "left", duration: 1.4 }, 0.2)
    .from(".phone-intro", { y: () => window.innerHeight, rotation: -18, duration: 1.8 }, 0.25);

  /* ---------- Letter fill on headings ---------- */
  $$("[data-fill]").forEach((el) => {
    gsap.fromTo($$(".ch", el), { opacity: 0.18 }, {
      opacity: 1, stagger: 0.05, ease: "none",
      scrollTrigger: { trigger: el, start: "top 88%", end: "top 38%", scrub: true },
    });
  });
  $$(".pattern-text").forEach((el) => {
    gsap.from($$(".ch", el), {
      yPercent: 100, rotate: 8, opacity: 0, stagger: 0.04, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 80%" },
    });
  });

  /* ---------- Phone journey ---------- */
  const journey = $(".journey");
  const phonePos = $(".phone-pos");
  const phone = $(".phone-layer [data-phone]");
  const body = $$(".ly, .face", phone);
  const plates = $$(".plate", phone);
  const screen = $(".screen", phone);
  const screens = $$(".scr", phone);
  const angle = $(".angle");
  const blockB = $(".angle-block.right");
  const explode = $(".explode");
  const process = $(".process");

  function showScreen(name) {
    screens.forEach((s) => s.classList.toggle("is-on", s.dataset.scr === name));
    screen.classList.toggle("is-dark", !!$(`.scr[data-scr="${name}"].dark`, phone));
  }

  const mm = gsap.matchMedia();
  mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
    const { mobile } = ctx.conditions;
    const vw = window.innerWidth, vh = window.innerHeight;
    const top = (el) => el.getBoundingClientRect().top + window.scrollY - journey.offsetTop;
    const dist = journey.offsetHeight - vh;
    const at = (px) => gsap.utils.clamp(0, 1, px / dist);

    const tA = at(top(angle));
    const tB = at(top(blockB));
    const tE0 = at(top(explode));
    const tE1 = at(top(explode) + explode.offsetHeight - vh);
    const tP0 = at(top(process));
    const dE = tE1 - tE0;

    const P = mobile
      ? {
          hero: { x: 0, y: vh * 0.4, scale: 0.78, rotationX: 14, rotationY: -16, rotationZ: 4 },
          a: { x: vw * 0.14, y: vh * 0.2, scale: 0.6, rotationX: -8, rotationY: 160, rotationZ: -14 },
          b: { x: -vw * 0.12, y: -vh * 0.17, scale: 0.6, rotationX: 6, rotationY: 336, rotationZ: 10 },
          e: { x: 0, y: vh * 0.02, scale: 0.52, rotationX: 56, rotationY: 360, rotationZ: -36 },
          p: { x: 0, y: -vh * 0.16, scale: 0.58, rotationX: 0, rotationY: 350, rotationZ: 0 },
          gap: 70,
        }
      : {
          hero: { x: 0, y: vh * 0.44, scale: 1, rotationX: 14, rotationY: -16, rotationZ: 4 },
          a: { x: vw * 0.21, y: vh * 0.02, scale: 0.95, rotationX: -8, rotationY: 160, rotationZ: -14 },
          b: { x: -vw * 0.2, y: 0, scale: 0.95, rotationX: 6, rotationY: 336, rotationZ: 10 },
          e: { x: 0, y: vh * 0.05, scale: Math.min(0.8, vh / 1050), rotationX: 56, rotationY: 360, rotationZ: -36 },
          p: { x: vw * 0.2, y: vh * 0.02, scale: Math.min(1, vh / 820), rotationX: 0, rotationY: 350, rotationZ: 0 },
          gap: 84,
        };

    const pos = (pose) => ({ x: pose.x, y: pose.y, scale: pose.scale });
    const rot = (pose) => ({ rotationX: pose.rotationX, rotationY: pose.rotationY, rotationZ: pose.rotationZ });

    gsap.set(phonePos, pos(P.hero));
    gsap.set(phone, rot(P.hero));
    gsap.set(plates, { z: 0, opacity: 0 });
    gsap.set(body, { opacity: 1 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: { trigger: journey, start: "top top", end: "bottom bottom", scrub: 1.1 },
    });
    // hero -> angle A (shows the branded back) -> angle B (front again)
    tl.to(".phone-hint", { autoAlpha: 0, duration: tA * 0.3, ease: "none" }, 0)
      .to(phonePos, { ...pos(P.a), duration: tA }, 0)
      .to(phone, { ...rot(P.a), duration: tA }, 0)
      .to(phonePos, { ...pos(P.b), duration: tB - tA }, tA)
      .to(phone, { ...rot(P.b), duration: tB - tA }, tA)
      // into the isometric exploded pose
      .to(phonePos, { ...pos(P.e), duration: tE0 - tB }, tB)
      .to(phone, { ...rot(P.e), duration: tE0 - tB }, tB)
      .to(body, { opacity: 0, duration: dE * 0.12, ease: "none" }, tE0 + dE * 0.06)
      .to(plates, { opacity: 1, duration: dE * 0.1, ease: "none" }, tE0 + dE * 0.06)
      .to(plates, { z: (i) => (2 - i) * P.gap, duration: dE * 0.3, ease: "power3.out" }, tE0 + dE * 0.1)
      .to(phone, { rotationZ: P.e.rotationZ + 10, duration: dE * 0.6, ease: "none" }, tE0 + dE * 0.15)
      // collapse back into a phone
      .to(plates, { z: 0, duration: dE * 0.14, ease: "power3.in" }, tE0 + dE * 0.76)
      .to(plates, { opacity: 0, duration: dE * 0.06, ease: "none" }, tE0 + dE * 0.9)
      .to(body, { opacity: 1, duration: dE * 0.06, ease: "none" }, tE0 + dE * 0.9)
      // process pose, then leave
      .to(phonePos, { ...pos(P.p), duration: tP0 - tE1 }, tE1)
      .to(phone, { ...rot(P.p), duration: tP0 - tE1 }, tE1)
      .to(phonePos, { y: -vh * 1.25, duration: 0.035, ease: "power2.in" }, 0.965)
      .to(phone, { rotationZ: -28, rotationY: 300, duration: 0.035, ease: "power2.in" }, 0.965);
    tl.set({}, {}, 1);

    return () => gsap.set([phonePos, phone, plates, body], { clearProps: "all" });
  });

  // hide the fixed phone once the journey is over
  ScrollTrigger.create({
    trigger: journey, start: "top top", end: "bottom top",
    onLeave: () => gsap.set(".phone-layer", { autoAlpha: 0 }),
    onEnterBack: () => gsap.set(".phone-layer", { autoAlpha: 1 }),
  });

  // exploded layer captions
  const layerItems = $$(".layers li");
  ScrollTrigger.create({
    trigger: explode, start: "top top", end: "bottom bottom",
    onUpdate: (self) => {
      const p = self.progress;
      const cur = Math.floor(((p - 0.28) / 0.46) * layerItems.length);
      layerItems.forEach((li, i) => li.classList.toggle("is-on", p > 0.74 && p < 0.9 ? true : i === cur));
    },
  });

  // process steps: swap phone screen, caption and giant word
  const stepEls = $$(".steps > li");
  const dots = $$(".step-dots i");
  const bigword = $(".bigword");
  const count = $(".step-count");
  const stepScreens = ["code", "api", "pay", "deploy", "store", "auto"];
  const stepWords = ["Build", "Connect", "Get paid", "Deploy", "Launch", "Automate"];
  let step = -1;
  function setStep(i) {
    if (i === step) return;
    step = i;
    stepEls.forEach((el, n) => el.classList.toggle("is-on", n === i));
    dots.forEach((d, n) => d.classList.toggle("is-on", n === i));
    count.textContent = String(i + 1).padStart(2, "0");
    showScreen(stepScreens[i]);
    gsap.fromTo(bigword, { yPercent: -40, opacity: 0 }, { yPercent: -50, opacity: 1, duration: 0.6, ease: "expo.out", onStart: () => (bigword.textContent = stepWords[i]) });
  }
  ScrollTrigger.create({
    trigger: process, start: "top top", end: "bottom bottom",
    onUpdate: (self) => setStep(Math.min(5, Math.floor(self.progress * 6))),
    onLeaveBack: () => { step = -1; showScreen("home"); },
  });
  gsap.set(bigword, { xPercent: -50, yPercent: -50 });

  /* ---------- Interactive phone ---------- */
  const tiltEl = $(".phone-tilt");
  const cycle = ["home", "code", "api", "pay", "deploy", "store", "auto"];
  let cycleIndex = 0;
  const st = { tx: 0, ty: 0, targetX: 0, targetY: 0, spin: 0, lean: 0, dragging: false, startX: 0, startSpin: 0, lastX: 0, vel: 0, moved: 0 };
  const touched = () => root.classList.add("touched");

  if (window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", (e) => {
      st.targetY = (e.clientX / window.innerWidth - 0.5) * 26;
      st.targetX = -(e.clientY / window.innerHeight - 0.5) * 16;
    }, { passive: true });
  }

  tiltEl.addEventListener("pointerdown", (e) => {
    st.dragging = true; st.startX = st.lastX = e.clientX; st.startSpin = st.spin; st.vel = 0; st.moved = 0;
    gsap.killTweensOf(st, "spin");
    tiltEl.setPointerCapture(e.pointerId);
  });
  tiltEl.addEventListener("pointermove", (e) => {
    if (!st.dragging) return;
    const dx = e.clientX - st.startX;
    st.moved = Math.max(st.moved, Math.abs(dx));
    st.vel = e.clientX - st.lastX; st.lastX = e.clientX;
    st.spin = st.startSpin + dx * 0.7;
  });
  const release = () => {
    if (!st.dragging) return;
    st.dragging = false;
    touched();
    if (st.moved < 6) {
      // tap: switch the screen with a little bounce
      cycleIndex = (cycleIndex + 1) % cycle.length;
      showScreen(cycle[cycleIndex]);
      gsap.fromTo(".phone-intro", { scale: 0.93 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" });
      return;
    }
    // fling, then settle facing front (or back) with a spring
    const target = Math.round((st.spin + st.vel * 14) / 180) * 180;
    gsap.to(st, { spin: target, duration: 1.4, ease: "elastic.out(1, 0.55)" });
  };
  tiltEl.addEventListener("pointerup", release);
  tiltEl.addEventListener("pointercancel", release);

  const glare = $(".phone-layer .glare");
  gsap.ticker.add(() => {
    st.tx += (st.targetX - st.tx) * 0.08;
    st.ty += (st.targetY - st.ty) * 0.08;
    const v = lenis ? lenis.velocity : 0;
    st.lean += (gsap.utils.clamp(-12, 12, -v * 0.5) - st.lean) * 0.1;
    gsap.set(tiltEl, { rotationX: st.tx, rotationY: st.ty + st.spin, rotationZ: st.lean });
    glare.style.setProperty("--gx", `${50 - st.ty * 3}%`);
    glare.style.setProperty("--gy", `${25 + st.tx * 4}%`);
  });

  /* ---------- Work: horizontal scroll ---------- */
  const track = $(".work-track");
  mm.add("(min-width: 901px)", () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -distance(), ease: "none",
      scrollTrigger: { trigger: ".work", pin: ".work-pin", start: "top top", end: () => "+=" + distance(), scrub: 1, invalidateOnRefresh: true },
    });
  });
  gsap.from(".card", { y: 80, opacity: 0, stagger: 0.08, duration: 1.1, ease: "expo.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".work", start: "top 70%" } });

  /* ---------- Numbers ---------- */
  $$(".count").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => countUp(el) }));

  /* ---------- Marquees react to scroll speed ---------- */
  const tracks = $$(".mq-track").map((el) => ({ el, dir: Number(el.dataset.dir), x: 0, half: 0 }));
  const measure = () => tracks.forEach((t) => (t.half = t.el.scrollWidth / 2));
  measure();
  window.addEventListener("resize", measure);
  let scrollDir = 1;
  gsap.ticker.add((time, dt) => {
    const v = lenis ? lenis.velocity : 0;
    if (v) scrollDir = Math.sign(v);
    const boost = 1 + Math.min(Math.abs(v) * 0.12, 6);
    tracks.forEach((t) => {
      t.x += t.dir * scrollDir * 0.06 * dt * boost;
      if (t.half) t.x = gsap.utils.wrap(-t.half, 0, t.x);
      t.el.style.transform = `translate3d(${t.x}px,0,0)`;
    });
  });

  /* ---------- Simple reveals ---------- */
  ScrollTrigger.batch(".why-item, .faq details, .skill-group, .num, .svc-card, .gig", {
    start: "top 88%",
    onEnter: (els) => gsap.from(els, { y: 50, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out", overwrite: true, clearProps: "transform,opacity" }),
  });
  gsap.from(".call-wrap", { y: 160, rotate: 12, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".contact-grid", start: "top 75%" } });
  gsap.from(".wordmark", { yPercent: 60, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".wordmark", start: "top 95%" } });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { fitText(); ScrollTrigger.refresh(); }, 200);
  });
}
