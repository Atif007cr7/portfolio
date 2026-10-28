// Generates service pages, the blog, 404.html, privacy-policy.html, sitemap.xml and robots.txt, and syncs the
// service links and structured data in index.html. No dependencies:  node scripts/build-pages.mjs
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { services, projects } from "../content/services.mjs";
import { frontMatter, render, imageSize } from "./markdown.mjs";

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
const OG_IMAGE = { url: `${SITE}/assets/og-image.png`, width: 1200, height: 630, alt: OG_ALT };
// Local date (YYYY-MM-DD), matching the git commit dates used for lastmod below.
const TODAY = new Date().toLocaleDateString("en-CA");
const bySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c");
const list = (v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
const fmtDate = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// ---- blog posts ----
// One Markdown file per post: content/blog/<slug>.md, images in assets/blog/<slug>/.
// The syntax is documented in scripts/markdown.mjs. Add `draft: true` to keep a post out of the build.
const BLOG = {
  title: "Flutter, Dart & Backend Development Blog | Atif",
  description: "Hands-on tutorials on Flutter, Dart, Serverpod, BLoC and backend development, written for students and developers by freelance developer Ansari Mohd Atif.",
  h1: "Hands-on Flutter and backend tutorials",
};
const BLOG_SRC = join(ROOT, "content/blog");
const posts = (existsSync(BLOG_SRC) ? readdirSync(BLOG_SRC) : [])
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const slug = f.slice(0, -3);
    const { data, body } = frontMatter(readFileSync(join(BLOG_SRC, f), "utf8"), f);
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`${f}: file names must be lowercase-with-hyphens`);
    for (const k of ["title", "h1", "description", "date", "cover", "coverAlt"]) if (!data[k]) throw new Error(`${f}: missing ${k}`);
    for (const k of ["date", "updated"]) if (data[k] && !/^\d{4}-\d{2}-\d{2}$/.test(data[k])) throw new Error(`${f}: ${k} must be YYYY-MM-DD`);
    return { ...data, slug, body, file: f, path: `/blog/${slug}`, tags: list(data.tags), services: list(data.services), draft: data.draft === "true" };
  })
  .filter((p) => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

// Every internal path a link may point to. Links anywhere else fail the build.
const PATHS = new Set(["", "blog", "privacy-policy", ...services.map((s) => s.slug), ...posts.map((p) => p.path.slice(1))]);
const knownPath = (href) => href.startsWith("/") && PATHS.has(href.slice(1).replace(/[?#].*$/, ""));
// Escapes text and turns [link text](/path) into an internal link.
const rich = (s, from) => esc(s).replace(/\[([^\]]+)\]\((\/[a-z0-9/-]*)\)/g, (_, text, href) => {
  if (!knownPath(href)) throw new Error(`${from}: unknown link ${href}`);
  return `<a href="${href}">${text}</a>`;
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

// `meta` adds [property, content] pairs after the og:image tags; `css` adds stylesheets after page.css.
function head({ title, description, path, schema, type = "website", image = OG_IMAGE, meta = [], css = [], links = [] }) {
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
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image.url}">
  <meta property="og:image:width" content="${image.width}">
  <meta property="og:image:height" content="${image.height}">
  <meta property="og:image:alt" content="${esc(image.alt)}">
${meta.map(([p, c]) => `  <meta property="${p}" content="${esc(c)}">\n`).join("")}  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image.url}">
  <meta name="twitter:image:alt" content="${esc(image.alt)}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/favicon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
${links.map((l) => `  ${l}\n`).join("")}  <link rel="preload" href="/assets/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/page.css">
${css.map((href) => `  <link rel="stylesheet" href="${href}">\n`).join("")}${schema ? `  <script type="application/ld+json">\n${json(schema)}\n  </script>\n` : ""}</head>`;
}

const nav = (current) => `
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
        <a class="chip hide-m" href="/blog"${current === "blog" ? ' aria-current="page"' : ""}>Blog</a>
        <a class="chip chip-hot" href="/#contact">Hire me <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <div class="dots" aria-hidden="true"></div>
  </header>
  <div class="menu" id="menu" hidden>
    <nav aria-label="Mobile navigation">
      <a href="/">Home</a><a href="/#services">Services</a><a href="/#work">Work</a><a href="/#gigs">Gigs</a><a href="/blog">Blog</a><a href="/#contact">Contact</a>
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
        <div><h2 class="small-caps foot-h">Work</h2><a href="/#work">Portfolio</a><a href="/#gigs">Gigs</a><a href="/#skills">Skills</a><a href="/#faq">FAQ</a><a href="/blog">Blog</a></div>
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

// A list of links to blog posts (service pages, the end of each post).
const postLinks = (items) => `<div class="sp-posts">${items.map((p) => `<a class="sp-post" href="${p.path}"><span class="small-caps">${esc(p.tags.slice(0, 3).join(" · "))}</span><strong>${esc(p.h1)}</strong><em aria-hidden="true">↗</em></a>`).join("")}</div>`;

function servicePage(s) {
  const path = `/${s.slug}`;
  const quote = `/?service=${encodeURIComponent(s.formValue)}#contact`;
  const work = s.work.map((k) => projects[k]);
  const reading = posts.filter((p) => p.services.includes(s.slug));
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
          <div class="faq sp-faq">${s.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${rich(a, s.slug)}</p></details>`).join("")}</div>
        </div>
      </div>
    </section>

    <section class="sp-section sp-blue" aria-labelledby="related-title">
      <div class="wrap">
        <p class="small-caps kicker">Related services</p>
        <h2 id="related-title" class="sp-h2">Often combined with</h2>
        <div class="sp-related">${s.related.map((r) => `<a class="sp-rel" href="/${r}"><span>${esc(bySlug[r].nav)}</span><em aria-hidden="true">↗</em></a>`).join("")}</div>${reading.length ? `
        <p class="small-caps kicker sp-posts-title">From the blog</p>
        ${postLinks(reading)}` : ""}
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

// ---- blog pages ----
const FEED = `<link rel="alternate" type="application/rss+xml" title="${esc(NAME)} — blog" href="/blog/feed.xml">`;
const blogImage = (from, src, alt, { eager = false } = {}) => {
  if (!src.startsWith("/assets/")) throw new Error(`${from}: images must live under /assets (got ${src})`);
  const file = join(ROOT, src);
  if (!existsSync(file)) throw new Error(`${from}: image not found: ${src}`);
  const [w, h] = imageSize(file);
  return `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};
// Links inside posts: internal ones must exist, external ones open in a new tab.
const postLinkAttrs = (from) => (href) => {
  if (/^https?:\/\//.test(href)) {
    if (href.startsWith(SITE)) throw new Error(`${from}: use a relative link instead of ${href}`);
    return ' target="_blank" rel="noopener"';
  }
  if (href.startsWith("#") || href.startsWith("mailto:")) return "";
  if (!knownPath(href)) throw new Error(`${from}: unknown link ${href}`);
  return "";
};
const readingTime = (words) => `${Math.max(1, Math.round(words / 200))} min read`;
const author = { "@type": "Person", "@id": `${SITE}/#person`, name: NAME, url: `${SITE}/` };

function postPage(p) {
  const r = p.rendered;
  const url = SITE + p.path;
  const [cw, ch] = imageSize(join(ROOT, p.cover));
  const others = posts.filter((o) => o !== p).slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: p.h1,
        description: p.description,
        url,
        mainEntityOfPage: url,
        image: [SITE + p.cover],
        datePublished: p.date,
        dateModified: p.updated || p.date,
        author,
        publisher: author,
        isPartOf: { "@type": "Blog", "@id": `${SITE}/blog#blog`, url: `${SITE}/blog` },
        keywords: p.tags,
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: p.h1, item: url },
        ],
      },
    ],
  };
  const meta = [
    ["article:published_time", p.date],
    ["article:modified_time", p.updated || p.date],
    ["article:author", `${SITE}/`],
    ...p.tags.map((t) => ["article:tag", t]),
  ];

  return `${head({ title: p.title, description: p.description, path: p.path, schema, type: "article", image: { url: SITE + p.cover, width: cw, height: ch, alt: p.coverAlt }, meta, css: ["/css/blog.css"], links: [FEED] })}${nav("blog")}
  <main id="main">
    <article class="post">
      <header class="sp-hero post-hero" id="top">
        <div class="wrap">
          <nav class="crumbs small-caps" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/blog">Blog</a></li></ol></nav>
          <p class="small-caps post-kicker">${esc(p.tags.join(" · "))}</p>
          <h1 class="post-h1">${esc(p.h1)}</h1>
          <p class="post-dek">${esc(p.description)}</p>
          <p class="post-meta small-caps"><span>By <a href="/" rel="author">${NAME}</a></span><span><time datetime="${p.date}">${fmtDate(p.date)}</time></span>${p.updated ? `<span>Updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ""}<span>${readingTime(r.words)}</span></p>
        </div>
      </header>

      <div class="paper post-body">
        <div class="wrap">
          <figure class="post-cover">${blogImage(p.file, p.cover, p.coverAlt, { eager: true })}</figure>
          <div class="post-layout">${r.toc.length > 2 ? `
            <nav class="toc" aria-labelledby="toc-title"><p class="small-caps" id="toc-title">On this page</p><ol>${r.toc.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join("")}</ol></nav>` : ""}
            <div class="prose">
${r.html}
              <aside class="post-author" aria-label="About the author">
                <p class="small-caps">Written by</p>
                <p class="post-author-name"><a href="/">${NAME}</a></p>
                <p>Atif is a freelance full-stack developer from India. He builds Flutter apps and the backends behind them with Serverpod, Laravel, FastAPI and Node.js. <a href="${LINKEDIN}" target="_blank" rel="me noopener">LinkedIn</a></p>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </article>

    <section class="sp-section sp-blue" aria-labelledby="next-title">
      <div class="wrap sp-two">
        <div>
          <p class="small-caps kicker">Keep going</p>
          <h2 id="next-title" class="sp-h2">${others.length ? "Read next" : "Related services"}</h2>
          ${others.length ? postLinks(others) : ""}
          <div class="sp-related sp-related-stack">${p.services.map((sl) => `<a class="sp-rel" href="/${sl}"><span>${esc(bySlug[sl].nav)}</span><em aria-hidden="true">↗</em></a>`).join("")}<a class="sp-rel" href="/blog"><span>All articles</span><em aria-hidden="true">↗</em></a></div>
        </div>
        <div class="sp-cta-card">
          <p class="small-caps">Working on an app?</p>
          <p class="sp-cta-big">Let's build it properly.</p>
          <p>I build Flutter apps and their backends for startups and businesses. Tell me what you're working on and I'll reply with next steps.</p>
          <a class="chip chip-big" href="/#contact">Start a project ↗</a>
        </div>
      </div>
    </section>
  </main>
${footer()}`;
}

function blogIndex() {
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${SITE}/blog#blog`,
        name: `${NAME} — blog`,
        description: BLOG.description,
        url: `${SITE}/blog`,
        inLanguage: "en",
        author,
        publisher: author,
        blogPost: posts.map((p) => ({ "@type": "BlogPosting", "@id": `${SITE}${p.path}#article`, headline: p.h1, url: SITE + p.path, datePublished: p.date, image: SITE + p.cover })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        ],
      },
    ],
  };
  const card = (p, i) => `
          <article class="post-card${i === 0 ? " featured" : ""}">
            <div class="post-card-img">${blogImage(p.file, p.cover, p.coverAlt, { eager: i === 0 })}</div>
            <div class="post-card-body">
              <p class="small-caps post-card-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${readingTime(p.rendered.words)}</p>
              <h3><a href="${p.path}">${esc(p.h1)}</a></h3>
              <p>${esc(p.description)}</p>
              <ul class="mini-tags" aria-label="Topics">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            </div>
          </article>`;

  return `${head({ title: BLOG.title, description: BLOG.description, path: "/blog", schema, css: ["/css/blog.css"], links: [FEED] })}${nav("blog")}
  <main id="main">
    <section class="sp-hero" id="top">
      <div class="wrap">
        <nav class="crumbs small-caps" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Blog</li></ol></nav>
        <h1 class="sp-h1">${esc(BLOG.h1)}</h1>
        <div class="sp-intro"><p>Step-by-step guides on Flutter, Dart, Serverpod, state management and APIs. Each one builds something real and explains why the code is shaped the way it is. They're written for students and developers who learn by building.</p></div>${tags.length ? `
        <ul class="sp-stack" aria-label="Topics">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </section>

    <section class="paper sp-section" aria-labelledby="posts-title">
      <div class="wrap">
        <p class="small-caps kicker">Articles</p>
        <h2 id="posts-title" class="sp-h2">Latest articles</h2>
        <div class="post-grid">${posts.length ? posts.map(card).join("") : `<p>The first article is on its way.</p>`}
        </div>
      </div>
    </section>

    <section class="sp-final">
      <div class="wrap">
        <p class="sp-final-big">Got a project?</p>
        <p class="sp-final-sub">I build Flutter apps, websites and backends for startups and businesses in India and worldwide.</p>
        <div class="sp-ctas center"><a class="chip chip-hot chip-big" href="/#contact">Start a project ↗</a><a class="chip chip-big" href="/flutter-development">Flutter development</a></div>
      </div>
    </section>
  </main>
${footer()}`;
}

const rss = () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(NAME)} — blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(BLOG.description)}</description>
    <language>en</language>
${posts.map((p) => `    <item>
      <title>${esc(p.h1)}</title>
      <link>${SITE}${p.path}</link>
      <guid>${SITE}${p.path}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`).join("\n")}
  </channel>
</rss>
`;

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

// Privacy policy for ABC Fun Land: no accounts, nothing collected by us, child-directed AdMob ads only.
// Google Play matches the app name, package and developer named here against the store listing, so keep them in sync.
// Each section is [heading, blocks]; a block is a paragraph (string) or a bullet list (array).
// Bump PRIVACY_UPDATED by hand whenever the wording changes.
const APP_NAME = "ABC Fun Land";
const APP_PACKAGE = "com.ansariatif.bmsutility.abcfunland";
const PRIVACY_UPDATED = "28 October 2026";
const PRIVACY = [
  ["About this app", [
    `This privacy policy applies to <strong>${APP_NAME}</strong>, a learning game for young children available on Google Play (package name <code>${APP_PACKAGE}</code>). ${APP_NAME} is developed and published by ${NAME}, an individual developer (“we”, “us”).`,
  ]],
  ["The short version", [[
    `${APP_NAME} has no login, sign-up or account.`,
    "We do not collect, store or share personal information about players.",
    "The app asks for no device permissions such as camera, microphone, location, contacts or photos.",
    "The app shows child-appropriate ads from Google AdMob, configured for children.",
  ]]],
  ["Information we collect", [
    `We do not collect any personal information. ${APP_NAME} does not ask for a name, email address, phone number, photos, contacts or location, and there is no account to create.`,
    "Game settings (music and sound on or off, child lock) and progress are saved only on the device and are never sent to us. Letter and word voices are spoken by the device's built-in text-to-speech engine.",
  ]],
  ["Advertising (Google AdMob)", [
    `${APP_NAME} is free and is supported by ads from Google AdMob, operated by Google LLC. Every ad request is marked as directed to children, and ads are limited to the “G” (general audiences) content rating, so Google serves only non-personalised ads and does not use the information for interest-based advertising or remarketing. The app does not request the Android advertising ID.`,
    "To show ads, prevent fraud and measure how ads perform, Google may automatically collect limited technical information from the device, such as:",
    ["IP address (used to estimate a general location, such as the country)", "Device model, operating system and language", "App-instance or diagnostic information about the ads shown or tapped"],
    `This information goes to Google, not to us, and is handled under <a href="https://policies.google.com/privacy" rel="noopener">Google's Privacy Policy</a> and <a href="https://support.google.com/admob/answer/6223431" rel="noopener">its policy for child-directed apps</a>. AdMob is a Google Play Families self-certified ads SDK. We do not receive anything that identifies a player.`,
  ]],
  ["Children's privacy", [
    `${APP_NAME} is made for children and follows the Google Play Families policy and the US Children's Online Privacy Protection Act (COPPA). It works without personal information: there is no account, no sign-up and nothing a child has to enter about themselves. Settings and outside links are behind a grown-ups-only question. We do not knowingly collect personal information from children.`,
    `If you are a parent or guardian and believe your child's personal information has been shared with us, email <a href="mailto:${EMAIL}">${EMAIL}</a> and we will delete it.`,
  ]],
  ["Sharing and selling data", [
    "Because we do not collect personal information, we have nothing to sell, rent or share. The only third party involved is Google AdMob, as described above.",
  ]],
  ["Data retention and deletion", [
    `We keep no player data on our servers. Everything ${APP_NAME} saves stays on the device, and uninstalling the app or clearing its data removes it.`,
  ]],
  ["Security", [
    "Because no personal information leaves the device through us, there is no player data held by us that could be exposed. Ad traffic to Google is sent over encrypted (HTTPS) connections.",
  ]],
  ["Changes to this policy", [
    "If the app or this policy changes, we will update this page and the date at the top.",
  ]],
  ["Contact", [
    `Questions about this policy or ${APP_NAME}? Email ${NAME} at <a href="mailto:${EMAIL}">${EMAIL}</a>.`,
  ]],
];

function privacyPolicy() {
  return `${head({ title: `${APP_NAME} Privacy Policy | Atif`, description: `Privacy policy for ${APP_NAME} (${APP_PACKAGE}), the kids' learning game by ${NAME}: no login, no personal information collected, child-directed Google AdMob ads.`, path: "/privacy-policy" })}${nav()}
  <main id="main">
    <section class="sp-hero" id="top">
      <div class="wrap">
        <p class="small-caps kicker">Legal</p>
        <h1 class="sp-h1">${APP_NAME} privacy policy</h1>
        <div class="sp-intro"><p>For the ${APP_NAME} app (<code>${APP_PACKAGE}</code>) by ${NAME}. Last updated ${PRIVACY_UPDATED}.</p></div>
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
const allPages = [...services.map((s) => ({ ...s, id: s.slug })), ...posts.map((p) => ({ ...p, id: p.path })), { ...BLOG, id: "/blog" }];
for (const key of ["title", "description", "h1"]) {
  const seen = new Set();
  for (const pg of allPages) {
    if (seen.has(pg[key])) throw new Error(`${pg.id}: duplicate ${key} "${pg[key]}"`);
    seen.add(pg[key]);
  }
}
for (const pg of allPages) {
  if (pg.title.length > 70) console.warn(`! title long (${pg.title.length}): ${pg.id}`);
  if (pg.description.length > 170) console.warn(`! description long (${pg.description.length}): ${pg.id}`);
}
for (const s of services) {
  for (const r of s.related) if (!bySlug[r]) throw new Error(`${s.slug}: unknown related slug ${r}`);
  write(`${s.slug}.html`, servicePage(s));
}
write("404.html", notFound());
write("privacy-policy.html", privacyPolicy());

// Blog: /blog (blog/index.html), one page per post, and an RSS feed. Old post pages are removed.
mkdirSync(join(ROOT, "blog"), { recursive: true });
const blogFiles = new Set(["index.html", "feed.xml"]);
for (const p of posts) {
  for (const sl of p.services) if (!bySlug[sl]) throw new Error(`${p.file}: unknown service ${sl}`);
  p.rendered = render(p.body, { file: p.file, link: postLinkAttrs(p.file), image: (src, alt) => blogImage(p.file, src, alt) });
  write(`blog/${p.slug}.html`, postPage(p));
  blogFiles.add(`${p.slug}.html`);
}
write("blog/index.html", blogIndex());
write("blog/feed.xml", rss());
for (const f of readdirSync(join(ROOT, "blog"))) if (!blogFiles.has(f)) unlinkSync(join(ROOT, "blog", f));

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
// Every .html page (top level and blog/) is included automatically unless it is the 404 page,
// carries a noindex robots tag, or declares a canonical pointing somewhere else.
const htmlFiles = [
  ...readdirSync(ROOT).filter((f) => f.endsWith(".html") && f !== "404.html"),
  ...readdirSync(join(ROOT, "blog")).filter((f) => f.endsWith(".html")).map((f) => `blog/${f}`),
];
const pages = htmlFiles
  .map((file) => {
    const html = readFileSync(join(ROOT, file), "utf8");
    const path = "/" + file.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
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
const outputFiles = [
  ...readdirSync(ROOT).filter((f) => /\.(html|xml|txt)$/.test(f)),
  ...readdirSync(join(ROOT, "blog")).map((f) => `blog/${f}`),
];
for (const file of outputFiles) {
  const bad = (readFileSync(join(ROOT, file), "utf8").match(hostPattern) || []).filter((u) => !u.startsWith(SITE));
  if (bad.length) throw new Error(`${file}: URLs not on ${SITE}: ${[...new Set(bad)].join(", ")}`);
}

console.log(`Built ${services.length} service pages, ${posts.length} blog post${posts.length === 1 ? "" : "s"} + /blog, 404.html, sitemap.xml (${pages.length} URLs), robots.txt`);
