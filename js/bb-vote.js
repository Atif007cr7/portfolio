// Bigg Boss 20 fan vote: live leaderboard + one vote per mobile number every 6 hours.
// Data lives in Cloud Firestore (Firebase project "abc-funland-ads-mob"):
//   bb20_contestants/{id}  name, votes, lastVoteId     (public, read by the leaderboard)
//   bb20_voters/{phone}    phone, lastVoteAt, ...       (private, enforces the 6-hour wait)
//   bb20_votes/{voteId}    phone, contestantId, at      (private log of every vote)
// The rules in firebase/firestore.rules check every vote, so the 6-hour limit holds even
// if someone skips this page and writes to Firestore directly.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getFirestore, collection, doc, onSnapshot, writeBatch, serverTimestamp, increment,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Firebase web config is public by design; access is controlled by the Firestore rules.
const app = initializeApp({
  apiKey: "AIzaSyAPRGucmvVxzrLrdkGcbG5XM-OnkmyAXnQ",
  authDomain: "abc-funland-ads-mob.firebaseapp.com",
  projectId: "abc-funland-ads-mob",
  storageBucket: "abc-funland-ads-mob.firebasestorage.app",
  messagingSenderId: "424748834710",
  appId: "1:424748834710:web:180ff003ac3256ef7dc7b7",
});
const db = getFirestore(app);

const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const fmt = new Intl.NumberFormat("en-IN");
const $ = (id) => document.getElementById(id);

// ---------- contestants (from the cards in the HTML) ----------
const people = [...document.querySelectorAll(".bb-card")].map((el) => ({
  id: el.dataset.id,
  name: el.dataset.name,
  role: el.dataset.role,
  photo: el.dataset.photo || "",
  pos: el.dataset.pos || "",
  initials: el.dataset.initials || "",
  colors: el.querySelector(".bb-photo-none")?.getAttribute("style") || "",
  el,
}));
const byId = Object.fromEntries(people.map((p) => [p.id, p]));
const votes = {};

function avatar(p) {
  const span = document.createElement("span");
  span.className = "bb-ava";
  if (p.photo) {
    const img = document.createElement("img");
    img.src = p.photo; img.alt = ""; img.loading = "lazy";
    if (p.pos) img.style.objectPosition = p.pos;
    span.append(img);
  } else {
    span.setAttribute("style", p.colors);
    const t = document.createElement("span");
    t.textContent = p.initials;
    span.append(t);
  }
  return span;
}

// ---------- leaderboard ----------
const board = $("bb-board");
const rows = {};
for (let i = 0; i < people.length; i++) {
  const li = document.createElement("li");
  li.className = "bb-row skeleton";
  li.setAttribute("aria-hidden", "true");
  board.append(li);
}

function buildRow(p) {
  const li = document.createElement("li");
  li.className = "bb-row";
  li.dataset.id = p.id;
  li.innerHTML = `<span class="bb-rank"></span><span class="bb-who"><b></b><small></small></span><span class="bb-bar" aria-hidden="true"><i></i></span><span class="bb-num"><b></b><small></small></span>`;
  li.querySelector(".bb-rank").after(avatar(p));
  li.querySelector(".bb-who b").textContent = p.name;
  li.querySelector(".bb-who small").textContent = p.role;
  return li;
}

let firstRender = true;
function render() {
  const total = people.reduce((s, p) => s + (votes[p.id] || 0), 0);
  const ranked = [...people].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0) || a.name.localeCompare(b.name));
  const max = Math.max(1, ...ranked.map((p) => votes[p.id] || 0));

  // FLIP: remember where rows were, reorder, then animate from old to new position.
  const before = {};
  for (const [id, li] of Object.entries(rows)) before[id] = li.getBoundingClientRect().top;
  if (firstRender) board.replaceChildren();

  ranked.forEach((p, i) => {
    const n = votes[p.id] || 0;
    const li = rows[p.id] || (rows[p.id] = buildRow(p));
    const prev = Number(li.dataset.votes ?? n);
    li.dataset.votes = n;
    li.classList.toggle("lead", i === 0 && n > 0);
    li.querySelector(".bb-rank").textContent = i + 1;
    li.querySelector(".bb-who b").innerHTML = "";
    li.querySelector(".bb-who b").append(p.name, ...(i === 0 && n > 0 ? [Object.assign(document.createElement("span"), { className: "bb-crown", textContent: "👑" })] : []));
    li.querySelector(".bb-bar i").style.width = `${(n / max) * 100}%`;
    li.querySelector(".bb-num b").textContent = fmt.format(n);
    li.querySelector(".bb-num small").textContent = total ? `${((n / total) * 100).toFixed(1)}%` : "0%";
    li.setAttribute("aria-label", `Rank ${i + 1}: ${p.name}, ${fmt.format(n)} votes`);
    if (n > prev) { li.classList.remove("bump"); void li.offsetWidth; li.classList.add("bump"); }
    board.append(li);

    // card
    const card = p.el;
    card.querySelector("[data-votes]").textContent = fmt.format(n);
    const chip = card.querySelector(".bb-rank-chip");
    chip.hidden = total === 0;
    chip.textContent = `#${i + 1}`;
    chip.classList.toggle("top", i === 0);
  });

  if (!firstRender && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const [id, li] of Object.entries(rows)) {
      const dy = (before[id] ?? 0) - li.getBoundingClientRect().top;
      if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 600, easing: "cubic-bezier(.16,1,.3,1)" });
    }
  }
  firstRender = false;
  $("bb-live-text").textContent = `Live · ${fmt.format(total)} vote${total === 1 ? "" : "s"}`;
}

const live = $("bb-live");
onSnapshot(collection(db, "bb20_contestants"), (snap) => {
  snap.forEach((d) => { if (byId[d.id]) votes[d.id] = d.data().votes || 0; });
  live.classList.add("on"); live.classList.remove("err");
  render();
  for (const b of document.querySelectorAll(".bb-vote-btn")) b.disabled = false;
}, (err) => {
  console.error(err);
  live.classList.remove("on"); live.classList.add("err");
  $("bb-live-text").textContent = "Couldn't load votes. Refresh to retry.";
});

// ---------- per-device memory (convenience only; Firestore rules are the real limit) ----------
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const lastVotes = () => store.get("bb20.lastVotes") || {};
function waitLeft(phone) {
  const t = lastVotes()[phone];
  return t ? Math.max(0, t + COOLDOWN_MS - Date.now()) : 0;
}
const fmtWait = (ms) => {
  const m = Math.ceil(ms / 60000), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
};
const fmtWhen = (t) => {
  const d = new Date(t), today = new Date();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === today.toDateString() ? `${time} today` : `${time} tomorrow`;
};

// Accepts 9876543210, 98765 43210, +91 98765 43210, 09876543210.
function normalisePhone(raw) {
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
const validPhone = (p) => /^[6-9]\d{9}$/.test(p);

// ---------- vote dialog ----------
const dlg = $("bb-dialog");
const form = $("bb-form");
const input = $("bb-phone");
const msg = $("bb-msg");
const submit = $("bb-submit");
const field = input.closest(".bb-phone-field");
let current = null;
let sending = false;

function say(text, kind = "") { msg.textContent = text; msg.className = `bb-msg ${kind}`; }
function checkWait() {
  const phone = normalisePhone(input.value);
  field.classList.remove("bad");
  if (!validPhone(phone)) { say(""); submit.disabled = false; return; }
  const left = waitLeft(phone);
  if (left) { say(`This number already voted. It can vote again in ${fmtWait(left)}.`, "info"); submit.disabled = true; }
  else { say(""); submit.disabled = false; }
}

function openVote(id) {
  current = byId[id];
  $("bb-dlg-title").textContent = current.name;
  const ava = $("bb-dlg-ava");
  const a = avatar(current);
  ava.replaceChildren(...a.childNodes);
  ava.setAttribute("style", a.getAttribute("style") || "");
  form.hidden = false;
  $("bb-done").hidden = true;
  input.value = store.get("bb20.phone") || "";
  checkWait();
  dlg.showModal();
  if (!input.value) input.focus(); else submit.focus();
}

document.getElementById("bb-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".bb-vote-btn");
  if (btn && !btn.disabled) openVote(btn.closest(".bb-card").dataset.id);
});
dlg.addEventListener("click", (e) => { if (e.target === dlg && !sending) dlg.close(); }); // backdrop click
dlg.addEventListener("cancel", (e) => { if (sending) e.preventDefault(); });
input.addEventListener("input", checkWait);
$("bb-done-close").addEventListener("click", () => {
  dlg.close();
  document.getElementById("leaderboard").scrollIntoView({ behavior: "smooth" });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (sending || !current) return;
  const phone = normalisePhone(input.value);
  if (!validPhone(phone)) {
    field.classList.add("bad");
    say("Enter a valid 10-digit Indian mobile number.", "bad");
    input.focus();
    return;
  }
  if (waitLeft(phone)) return checkWait();

  sending = true;
  submit.disabled = true;
  submit.textContent = "Sending…";
  say("");
  const slow = setTimeout(() => say("Still sending. Check your internet connection.", "info"), 10000);

  // One vote = three writes that must succeed together (see firebase/firestore.rules).
  const voteRef = doc(collection(db, "bb20_votes"));
  const batch = writeBatch(db);
  batch.set(voteRef, { phone, contestantId: current.id, at: serverTimestamp() });
  batch.set(doc(db, "bb20_voters", phone), {
    phone, lastVoteAt: serverTimestamp(), lastVoteId: voteRef.id, lastContestant: current.id, totalVotes: increment(1),
  }, { merge: true });
  batch.update(doc(db, "bb20_contestants", current.id), { votes: increment(1), lastVoteId: voteRef.id });

  try {
    await batch.commit();
    const now = Date.now();
    store.set("bb20.phone", phone);
    store.set("bb20.lastVotes", { ...lastVotes(), [phone]: now });
    $("bb-done-text").textContent = `Your vote for ${current.name} is in. This number can vote again at ${fmtWhen(now + COOLDOWN_MS)}.`;
    form.hidden = true;
    $("bb-done").hidden = false;
    $("bb-done-close").focus();
  } catch (err) {
    console.error(err);
    if (err.code === "permission-denied") {
      say("This number has already voted in the last 6 hours. Try again later.", "bad");
    } else {
      say("Couldn't record your vote. Check your connection and try again.", "bad");
    }
  } finally {
    clearTimeout(slow);
    sending = false;
    submit.textContent = "Confirm vote";
    submit.disabled = false;
  }
});
