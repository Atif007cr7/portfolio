// Generates service pages, 404.html, privacy-policy.html, sitemap.xml and robots.txt, and syncs the
// service links and structured data in index.html. No dependencies:  node scripts/build-pages.mjs
import { writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { services, projects } from "../content/services.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Canonical production origin. Vercel serves www and 308-redirects ansariatif.tech here,
// so every canonical, sitemap and structured-data URL must use www.
const SITE = "https://www.ansariatif.tech";
const EMAIL = "codewithatif@gmail.com";
// Site name for Google (WebSite structured data, og:site_name): one unique name, used consistently.
const NAME = "Ansari Mohd Atif";
const ALT_NAMES = ["Ansari Atif", "Atif"];
// Public profiles that represent you (LinkedIn, GitHub, Upwork…). Added to Person.sameAs.
const LINKEDIN = "https://www.linkedin.com/in/mohd-ansari-atif-56512a20b/";
const SAME_AS = [LINKEDIN];
const OG_ALT = "Ansari Mohd Atif (Atif), freelance developer for apps, web, cloud and automation";
const TODAY = new Date().toISOString().slice(0, 10);
const bySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c");
// Escapes text and turns [link text](/slug) into an internal link. Unknown slugs fail the build.
const rich = (s, from) => esc(s).replace(/\[([^\]]+)\]\(\/([a-z0-9-]*)\)/g, (_, text, slug) => {
  if (slug && !bySlug[slug]) throw new Error(`${from}: unknown link /${slug}`);
  return `<a href="/${slug}">${text}</a>`;
});
// Plain text from a small HTML fragment (for structured data built from visible content).
const text = (html) => html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();

const PROCESS = [
  ["Discovery call", "We talk through your goals, users and must-haves. You get honest advice, including when something isn't worth building."],
  ["Scope & estimate", "A written scope with milestones and a fixed quote or clear hourly estimate, so there are no surprises."],
  ["Build in milestones", "Regular demos and test builds you can try, with feedback built into each milestone."],
  ["Test, deploy & launch", "Testing, deployment to your servers or stores, and a launch checklist."],
  ["Support & growth", "Fixes, updates and new features after launch, whenever you need them."],
];

function head({ title, description, path, schema }) {
  const url = SITE + path;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="${NAME}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#1f3fd8">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${OG_ALT}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/assets/og-image.png">
  <meta name="twitter:image:alt" content="${OG_ALT}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/page.css">
${schema ? `  <script type="application/ld+json">\n${json(schema)}\n  </script>\n` : ""}</head>`;
}

const nav = () => `
<body class="page">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="nav">
    <div class="nav-row">
      <nav class="nav-group" aria-label="Main navigation">
        <a class="chip hide-m" href="/#services">Services</a>
        <a class="chip hide-m" href="/#work">Work</a>
        <a class="chip hide-m" href="/#gigs">Gigs</a>
        <a class="chip hide-m" href="/#faq">FAQ</a>
        <button class="chip show-m menu-open" aria-expanded="false" aria-controls="menu">Menu</button>
      </nav>
      <a href="/" class="brand" aria-label="Atif — home">
        <span class="brand-badge" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs><text class="emblem-ring"><textPath href="#ring">MOBILE ✦ WEB ✦ CLOUD ✦ AUTOMATION ✦</textPath></text><path class="emblem-a" d="M60 34 L77 80 H68.5 L65 70 H55 L51.5 80 H43 Z M57.5 63 H62.5 L60 56 Z"/></svg></span>
        <span class="brand-word">ATIF<i>.</i></span>
      </a>
      <div class="nav-group right">
        <a class="chip chip-hot" href="/#contact">Hire me <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <div class="dots" aria-hidden="true"></div>
  </header>
  <div class="menu" id="menu" hidden>
    <nav aria-label="Mobile navigation">
      <a href="/">Home</a><a href="/#services">Services</a><a href="/#work">Work</a><a href="/#gigs">Gigs</a><a href="/#contact">Contact</a>
    </nav>
    <button class="chip menu-close">Close</button>
  </div>
`;

// Project facts in display order. A row is only rendered when the project has that field.
const PROJECT_FACTS = [["Platform", "platform"], ["My role", "role"], ["Stack", "stack"], ["Publisher", "by"]];
const projectLinks = (w) => {
  const links = [[w.url, w.url?.includes("play.google.com") ? "Google Play" : "Website"], [w.ios, "App Store"]].filter(([href]) => href);
  return links.length ? `<div class="proj-links">${links.map(([href, label]) => `<a class="proj-link" href="${esc(href)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span></a>`).join("")}</div>` : "";
};

// Lowercases a label for use mid-sentence, keeping acronyms and product names ("AI development", not "ai development").
const lower = (s) => s.split(" ").map((w) => (/^(AI|API|DevOps|Flutter)$/.test(w) ? w : w.toLowerCase())).join(" ");

const serviceLinks = (cls = "") => services.map((s) => `<a${cls} href="/${s.slug}">${esc(s.nav)}</a>`).join("");

const footer = () => `
  <footer class="footer">
    <div class="wrap">
      <div class="dots" aria-hidden="true"></div>
      <div class="foot-cols foot-cols-services">
        <div><h2 class="small-caps foot-h">Services</h2>${serviceLinks()}</div>
        <div><h2 class="small-caps foot-h">Work</h2><a href="/#work">Portfolio</a><a href="/#gigs">Gigs</a><a href="/#skills">Skills</a><a href="/#faq">FAQ</a></div>
        <div><h2 class="small-caps foot-h">Contact</h2><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${LINKEDIN}" target="_blank" rel="me noopener">LinkedIn</a><a href="/#contact">Start a project</a></div>
        <p class="foot-seo">Atif (Ansari Mohd Atif) is a freelance full-stack developer for websites, web apps, e-commerce, Flutter mobile apps, backend APIs, databases, AI, automation and DevOps, working with clients in India and internationally.</p>
      </div>
      <p class="wordmark" aria-hidden="true">ATIF<i>.</i></p>
      <div class="foot-bottom small-caps"><span>© <span id="year">${TODAY.slice(0, 4)}</span> ${NAME}</span><a href="/privacy-policy">Privacy policy</a><a href="#top">Back to top ↑</a></div>
    </div>
  </footer>
  <div class="fabs">
    <a class="fab" href="mailto:${EMAIL}" aria-label="Email me">✉</a>
    <a class="fab" href="/#contact" aria-label="Start a project">↗</a>
  </div>
  <script src="/js/page.js" defer></script>
</body>
</html>
`;

function servicePage(s) {
  const path = `/${s.slug}`;
  const quote = `/?service=${encodeURIComponent(s.formValue)}#contact`;
  const work = s.work.map((k) => projects[k]);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${SITE}${path}#service`,
        name: s.eyebrow,
        serviceType: s.eyebrow,
        description: s.description,
        url: SITE + path,
        provider: { "@id": `${SITE}/#person` },
        areaServed: ["India", "United Arab Emirates", "Saudi Arabia", "United Kingdom", "United States"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: s.eyebrow, item: SITE + path },
        ],
      },
    ],
  };

  return `${head({ title: s.title, description: s.description, path, schema })}${nav()}
  <main id="main">
    <section class="sp-hero" id="top">
      <div class="wrap">
        <nav class="crumbs small-caps" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">${esc(s.eyebrow)}</li></ol></nav>
        <h1 class="sp-h1">${esc(s.h1)}</h1>
        <div class="sp-intro">${s.intro.map((p) => `<p>${rich(p, s.slug)}</p>`).join("")}</div>
        <div class="sp-ctas">
          <a class="chip chip-hot chip-big" href="${quote}">Request a quote ↗</a>
          <a class="chip chip-big" href="#process">How it works</a>
        </div>
        <ul class="sp-stack" aria-label="Technologies">${s.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
    </section>

    <section class="paper sp-section" aria-labelledby="offers-title">
      <div class="wrap">
        <p class="small-caps kicker">${esc(s.eyebrow)}</p>
        <h2 id="offers-title" class="sp-h2">${esc(s.offersTitle)}</h2>
        <div class="sp-offers">${s.offers.map(([h, p]) => `<article class="svc-card"><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join("")}</div>
      </div>
    </section>

    <section class="sp-section sp-blue" aria-labelledby="included-title">
      <div class="wrap sp-two">
        <div>
          <p class="small-caps kicker">Deliverables</p>
          <h2 id="included-title" class="sp-h2">What's included</h2>
          <ul class="sp-checks">${s.included.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        </div>
        <div class="sp-cta-card">
          <p class="small-caps">Get a development estimate</p>
          <p class="sp-cta-big">Tell me what you're building.</p>
          <p>Share your idea or requirements and I'll reply with next steps and an estimate.</p>
          <a class="chip chip-big" href="${quote}">Discuss your project ↗</a>
        </div>
      </div>
    </section>

    <section class="paper sp-section" id="process" aria-labelledby="process-title">
      <div class="wrap">
        <p class="small-caps kicker">Process</p>
        <h2 id="process-title" class="sp-h2">How the project works</h2>
        <ol class="sp-process">${PROCESS.map(([h, p], i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("")}</ol>
      </div>
    </section>
${work.length ? `
    <section class="sp-section sp-blue" aria-labelledby="work-title">
      <div class="wrap">
        <p class="small-caps kicker">Portfolio</p>
        <h2 id="work-title" class="sp-h2">Relevant work</h2>
        <div class="sp-work">${work.map((w) => `<article class="sp-proj"><p class="small-caps">${esc(w.type)}</p><h3>${esc(w.name)}</h3><dl class="facts">${PROJECT_FACTS.filter(([, k]) => w[k]).map(([label, k]) => `<div><dt>${label}</dt><dd>${esc(w[k])}</dd></div>`).join("")}</dl>${projectLinks(w)}</article>`).join("")}</div>
        <p class="sp-more"><a class="chip" href="/#work">See all projects ↗</a></p>
      </div>
    </section>
` : ""}
    <section class="paper sp-section" aria-labelledby="price-title">
      <div class="wrap sp-two">
        <div>
          <p class="small-caps kicker">${esc(s.eyebrow)} pricing</p>
          <h2 id="price-title" class="sp-h2">Pricing approach</h2>
          <p class="sp-lead">Every project is quoted after a short discovery call, as a fixed price for a clear scope or an hourly/monthly estimate for ongoing work. The main things that affect ${esc(lower(s.eyebrow))} cost:</p>
          <ul class="sp-checks dark">${s.costFactors.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        </div>
        <div>
          <p class="small-caps kicker">${esc(s.eyebrow)} FAQ</p>
          <h2 class="sp-h2">Common questions</h2>
          <div class="faq sp-faq">${s.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
        </div>
      </div>
    </section>

    <section class="sp-section sp-blue" aria-labelledby="related-title">
      <div class="wrap">
        <p class="small-caps kicker">Related services</p>
        <h2 id="related-title" class="sp-h2">Often combined with</h2>
        <div class="sp-related">${s.related.map((r) => `<a class="sp-rel" href="/${r}"><span>${esc(bySlug[r].nav)}</span><em aria-hidden="true">↗</em></a>`).join("")}</div>
      </div>
    </section>

    <section class="sp-final">
      <div class="wrap">
        <p class="sp-final-big">Start your project.</p>
        <p class="sp-final-sub">Freelance ${esc(lower(s.eyebrow))} for startups and businesses in India and worldwide.</p>
        <div class="sp-ctas center"><a class="chip chip-hot chip-big" href="${quote}">Request a quote ↗</a><a class="chip chip-big" href="mailto:${EMAIL}">${EMAIL}</a></div>
      </div>
    </section>
  </main>
${footer()}`;
}

function notFound() {
  return `${head({ title: "Page not found | Atif", description: "This page doesn't exist. Explore web, app, backend, AI and automation development services by Atif.", path: "/404" }).replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">').replace(/\s*<link rel="canonical"[^>]*>/, "")}${nav()}
  <main id="main">
    <section class="sp-hero" id="top">
      <div class="wrap">
        <p class="small-caps kicker">Error 404</p>
        <h1 class="sp-h1">This page doesn't exist.</h1>
        <div class="sp-intro"><p>The link may be old or mistyped. Here's where you can go instead:</p></div>
        <div class="sp-ctas"><a class="chip chip-hot chip-big" href="/">Go to homepage ↗</a><a class="chip chip-big" href="/#contact">Contact me</a></div>
        <div class="sp-related sp-404">${services.map((s) => `<a class="sp-rel" href="/${s.slug}"><span>${esc(s.nav)}</span><em aria-hidden="true">↗</em></a>`).join("")}</div>
      </div>
    </section>
  </main>
${footer()}`;
}

// Privacy policy for the kids' game: no accounts, nothing collected by us, third-party ads only.
// Each section is [heading, blocks]; a block is a paragraph (string) or a bullet list (array).
// Bump PRIVACY_UPDATED by hand whenever the wording changes.
const PRIVACY_UPDATED = "10 October 2026";
const PRIVACY = [
  ["The short version", [[
    "The Game has no login, sign-up or account.",
    "We do not collect, store or share personal information about players.",
    "The Game shows ads, which are delivered by a third-party advertising network.",
  ]]],
  ["Information we collect", [
    "We do not collect any personal information. The Game does not ask for a name, email address, phone number, photos, contacts or location, and there is no account to create.",
    "Any game progress or settings are saved only on the device and are not sent to us.",
  ]],
  ["Advertising", [
    "The Game is free and is supported by ads. Ads are served by a third-party advertising network, not by us. To show ads and measure how they perform, the ad network may automatically collect some technical information from the device, such as:",
    ["IP address", "Device type, operating system and language", "An advertising or device identifier, where one is available", "Which ads were shown or tapped"],
    "This information is collected and handled by the ad network under its own privacy policy. We do not receive it in a form that identifies a player.",
  ]],
  ["Children's privacy", [
    "The Game is made for children, so it is built to work without personal information: there is no account, no sign-up and nothing a child has to enter about themselves. We do not knowingly collect personal information from children.",
    `If you are a parent or guardian and believe your child's personal information has been shared with us, email <a href="mailto:${EMAIL}">${EMAIL}</a> and we will delete it.`,
  ]],
  ["Your choices", [
    "You can reset or delete the advertising identifier, or limit ad tracking, in the device's privacy settings. Uninstalling the Game removes anything it saved on the device.",
  ]],
  ["Sharing and selling data", [
    "Because we do not collect personal information, we have nothing to sell, rent or share.",
  ]],
  ["Changes to this policy", [
    "If the Game or this policy changes, we will update this page and the date at the top.",
  ]],
  ["Contact", [
    `Questions about this policy? Email <a href="mailto:${EMAIL}">${EMAIL}</a>.`,
  ]],
];

function privacyPolicy() {
  return `${head({ title: "Privacy Policy | Atif", description: "Privacy policy for the kids' game by Ansari Mohd Atif: no login, no personal information collected by us, and how third-party ads work.", path: "/privacy-policy" })}${nav()}
  <main id="main">
    <section class="sp-hero" id="top">
      <div class="wrap">
        <p class="small-caps kicker">Legal</p>
        <h1 class="sp-h1">Privacy policy</h1>
        <div class="sp-intro"><p>This policy applies to the kids' game (the “Game”) published by ${NAME} (“we”, “us”). Last updated ${PRIVACY_UPDATED}.</p></div>
      </div>
    </section>

    <section class="paper sp-section">
      <div class="wrap">
        <div class="sp-legal">${PRIVACY.map(([h, blocks]) => `
          <h2>${h}</h2>${blocks.map((b) => `
          ${Array.isArray(b) ? `<ul>${b.map((i) => `<li>${i}</li>`).join("")}</ul>` : `<p>${b}</p>`}`).join("")}`).join("")}
        </div>
      </div>
    </section>
  </main>
${footer()}`;
}

// Write only when content changed, so unchanged pages keep their real last-modified date.
function write(file, content) {
  const full = join(ROOT, file);
  if (existsSync(full) && readFileSync(full, "utf8") === content) return;
  writeFileSync(full, content);
}

// Last-modified date: last git commit touching the file, or today if it has uncommitted changes.
function lastModified(file) {
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", file], { cwd: ROOT, encoding: "utf8" }).trim();
    if (dirty) return TODAY;
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: ROOT, encoding: "utf8" }).trim();
    return date || TODAY;
  } catch {
    return TODAY;
  }
}

// ---- homepage structured data ----
// Built from services.mjs and the FAQ that is visible on the homepage, so they can't drift apart.
const KNOWS_ABOUT = [
  "Web Development", "E-commerce Development", "Web Application Development", "Mobile App Development",
  "Flutter", "Dart", "PHP", "Laravel", "Python", "FastAPI", "Django", "Node.js", "Next.js", "JavaScript",
  "PostgreSQL", "MySQL", "MongoDB", "Firebase", "AWS", "Docker", "REST APIs", "API Integration",
  "Payment Gateway Integration", "Razorpay", "Serverpod", "Kong API Gateway", "Playwright", "Business Automation",
  "AI Integration", "Large Language Models", "Vector Databases", "DevOps", "Server Management", "Database Management",
];

function homeSchema(index) {
  const faqSection = index.match(/<section[^>]*\bid="faq"[^>]*>([\s\S]*?)<\/section>/)?.[1] || "";
  const faqs = [...faqSection.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map(([, q, a]) => [text(q), text(a)]);
  if (!faqs.length) throw new Error("index.html: no FAQ found in #faq");
  const person = { "@id": `${SITE}/#person` };
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: NAME, alternateName: ALT_NAMES, inLanguage: "en", publisher: person },
      {
        "@type": "Person",
        ...person,
        name: NAME,
        alternateName: ALT_NAMES,
        url: `${SITE}/`,
        email: `mailto:${EMAIL}`,
        jobTitle: "Freelance Full-Stack Developer",
        address: { "@type": "PostalAddress", addressCountry: "IN" },
        ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
        knowsAbout: KNOWS_ABOUT,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Software development services",
          itemListElement: services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", "@id": `${SITE}/${s.slug}#service`, name: s.eyebrow, url: `${SITE}/${s.slug}` } })),
        },
      },
      { "@type": "FAQPage", "@id": `${SITE}/#faq`, mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };
}

// ---- write pages ----
// Google shows one title link and snippet per page: titles, descriptions and H1s must be unique.
for (const key of ["title", "description", "h1"]) {
  const seen = new Set();
  for (const s of services) {
    if (seen.has(s[key])) throw new Error(`${s.slug}: duplicate ${key} "${s[key]}"`);
    seen.add(s[key]);
  }
}
for (const s of services) {
  for (const r of s.related) if (!bySlug[r]) throw new Error(`${s.slug}: unknown related slug ${r}`);
  if (s.title.length > 70) console.warn(`! title long (${s.title.length}): ${s.slug}`);
  if (s.description.length > 170) console.warn(`! description long (${s.description.length}): ${s.slug}`);
  write(`${s.slug}.html`, servicePage(s));
}
write("404.html", notFound());
write("privacy-policy.html", privacyPolicy());

// ---- sync the homepage: footer service links + structured data ----
// Runs before the sitemap so index.html's lastmod reflects these changes.
const indexPath = join(ROOT, "index.html");
const index = readFileSync(indexPath, "utf8");
for (const marker of ["services-links", "schema"]) {
  if (!index.includes(`<!-- ${marker}:start -->`)) throw new Error(`index.html: missing <!-- ${marker}:start --> marker`);
}
const synced = index
  .replace(/(<!-- services-links:start -->)[\s\S]*?(<!-- services-links:end -->)/, (_, a, b) => a + serviceLinks() + b)
  .replace(/(<!-- schema:start -->)[\s\S]*?(<!-- schema:end -->)/, (_, a, b) => `${a}\n  <script type="application/ld+json">\n${json(homeSchema(index))}\n  </script>\n  ${b}`);
if (synced !== index) writeFileSync(indexPath, synced);

// ---- sitemap + robots ----
// Every top-level .html page is included automatically unless it is the 404 page,
// carries a noindex robots tag, or declares a canonical pointing somewhere else.
const pages = readdirSync(ROOT)
  .filter((f) => f.endsWith(".html") && f !== "404.html")
  .map((file) => {
    const html = readFileSync(join(ROOT, file), "utf8");
    const path = file === "index.html" ? "/" : `/${file.slice(0, -5)}`;
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    return { file, loc: SITE + path, indexable: !/noindex/i.test(robots) && canonical === SITE + path };
  })
  .filter((p) => p.indexable)
  .sort((a, b) => (a.loc === `${SITE}/` ? -1 : b.loc === `${SITE}/` ? 1 : a.loc.localeCompare(b.loc)));

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${lastModified(p.file)}</lastmod>\n  </url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// ---- checks ----
// The homepage drops out of the sitemap silently if its canonical is wrong, so fail loudly instead.
if (!pages.some((p) => p.file === "index.html")) throw new Error(`index.html: canonical must be ${SITE}/`);
// Any absolute URL to this site that isn't on the canonical origin points at a redirect.
const hostPattern = new RegExp(`https?://(?:www\\.)?${new URL(SITE).hostname.replace(/^www\./, "").replace(/\./g, "\\.")}[^"'\\s<)]*`, "g");
for (const file of readdirSync(ROOT).filter((f) => /\.(html|xml|txt)$/.test(f))) {
  const bad = (readFileSync(join(ROOT, file), "utf8").match(hostPattern) || []).filter((u) => !u.startsWith(SITE));
  if (bad.length) throw new Error(`${file}: URLs not on ${SITE}: ${[...new Set(bad)].join(", ")}`);
}

console.log(`Built ${services.length} service pages, 404.html, sitemap.xml (${pages.length} URLs), robots.txt`);
