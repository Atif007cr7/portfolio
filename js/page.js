/* Lightweight script for service and blog pages: menu, cursor spotlight, nav hide, code copy. */
const root = document.documentElement;
const menu = document.getElementById("menu");
const menuBtn = document.querySelector(".menu-open");
const setMenu = (open) => {
  menu.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  if (open) menu.querySelector("a").focus();
};
menuBtn.addEventListener("click", () => setMenu(true));
document.querySelector(".menu-close").addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

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

const nav = document.querySelector(".nav");
let lastY = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  nav.classList.toggle("hide", y > 400 && y > lastY);
  lastY = y;
}, { passive: true });

// Blog code blocks: the Copy button stays hidden until this script can make it work.
for (const btn of document.querySelectorAll(".code-copy")) {
  btn.hidden = false;
  btn.addEventListener("click", async () => {
    const code = btn.closest(".code").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1600);
  });
}
