/* Lightweight script for service pages: menu, cursor spotlight, nav hide. */
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
