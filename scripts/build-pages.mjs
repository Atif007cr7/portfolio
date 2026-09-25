// Generates service pages, 404.html, sitemap.xml and robots.txt, and syncs the
// service links in index.html. No dependencies:  node scripts/build-pages.mjs
import { writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { services, projects } from "../content/services.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Canonical production origin (no www). www.ansariatif.tech must redirect here in Vercel → Domains.
const SITE = "https://ansariatif.tech";
const EMAIL = "codewithatif@gmail.com";
const TODAY = new Date().toISOString().slice(0, 10);
const bySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c");

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
  <meta name="author" content="Ansari Mohd Atif">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#1f3fd8">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Atif — Freelance Developer">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/assets/og-image.png">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet">
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

const serviceLinks = (cls = "") => services.map((s) => `<a${cls} href="/${s.slug}">${esc(s.nav)}</a>`).join("");

const footer = () => `
  <footer class="footer">
    <div class="wrap">
      <div class="dots" aria-hidden="true"></div>
      <div class="foot-cols foot-cols-services">
        <div><h2 class="small-caps foot-h">Services</h2>${serviceLinks()}</div>
        <div><h2 class="small-caps foot-h">Work</h2><a href="/#work">Portfolio</a><a href="/#gigs">Gigs</a><a href="/#skills">Skills</a><a href="/#faq">FAQ</a></div>
        <div><h2 class="small-caps foot-h">Contact</h2><a href="mailto:${EMAIL}">${EMAIL}</a><a href="/#contact">Start a project</a></div>
        <p class="foot-seo">Atif (Ansari Mohd Atif) is a freelance full-stack developer for websites, web apps, e-commerce, Flutter mobile apps, backend APIs, databases, AI, automation and DevOps, working with clients in India and internationally.</p>
      </div>
      <p class="wordmark" aria-hidden="true">ATIF<i>.</i></p>
      <div class="foot-bottom small-caps"><span>© <span id="year">${TODAY.slice(0, 4)}</span> Ansari Mohd Atif</span><a href="#top">Back to top ↑</a></div>
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
        <div class="sp-intro">${s.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
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
        <div class="sp-work">${work.map((w) => `<article class="sp-proj"><p class="small-caps">${esc(w.type)}</p><h3>${esc(w.name)}</h3><dl class="facts"><div><dt>Platform</dt><dd>${esc(w.platform)}</dd></div><div><dt>My role</dt><dd>${esc(w.role)}</dd></div><div><dt>Stack</dt><dd>${esc(w.stack)}</dd></div></dl></article>`).join("")}</div>
        <p class="sp-more"><a class="chip" href="/#work">See all projects ↗</a></p>
      </div>
    </section>
` : ""}
    <section class="paper sp-section" aria-labelledby="price-title">
      <div class="wrap sp-two">
        <div>
          <p class="small-caps kicker">Pricing</p>
          <h2 id="price-title" class="sp-h2">Pricing approach</h2>
          <p class="sp-lead">Every project is quoted after a short discovery call, as a fixed price for a clear scope or an hourly/monthly estimate for ongoing work. The main things that affect cost:</p>
          <ul class="sp-checks dark">${s.costFactors.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        </div>
        <div>
          <p class="small-caps kicker">FAQ</p>
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
        <p class="sp-final-sub">Freelance ${esc(s.eyebrow.toLowerCase())} for startups and businesses in India and worldwide.</p>
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

// ---- write pages ----
for (const s of services) {
  for (const r of s.related) if (!bySlug[r]) throw new Error(`${s.slug}: unknown related slug ${r}`);
  if (s.title.length > 70) console.warn(`! title long (${s.title.length}): ${s.slug}`);
  if (s.description.length > 170) console.warn(`! description long (${s.description.length}): ${s.slug}`);
  write(`${s.slug}.html`, servicePage(s));
}
write("404.html", notFound());

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

// ---- sync service links into the homepage footer ----
const indexPath = join(ROOT, "index.html");
const index = readFileSync(indexPath, "utf8");
const synced = index.replace(/(<!-- services-links:start -->)[\s\S]*?(<!-- services-links:end -->)/, `$1${serviceLinks()}$2`);
if (synced !== index) writeFileSync(indexPath, synced);


console.log(`Built ${services.length} service pages, 404.html, sitemap.xml (${pages.length} URLs), robots.txt`);
