# ansariatif.tech — SEO audit, keyword map & plan

Audit date: 2026-09-25 · Canonical host: **https://ansariatif.tech** (no www). In Vercel → Domains, `ansariatif.tech` must be the primary domain and `www.ansariatif.tech` must redirect (308) to it.

---

## 1. Current SEO status (before this change)

| Item | Status |
|---|---|
| Stack | Static HTML/CSS/JS on Vercel (not Next.js). No build step. |
| Pages | **1** (`/`). Every nav link is an in-page `#anchor`. Any other URL returns Vercel's plain-text 404. |
| Title / description | Present, keyword-relevant. |
| Canonical | **Wrong** — `https://YOUR-DOMAIN.com/` (placeholder). |
| Open Graph / Twitter | Present, but `og:url` and `og:image` point to the placeholder domain. |
| robots.txt | Reachable, but `Sitemap:` line points to the placeholder domain. |
| sitemap.xml | Reachable, but lists only the placeholder URL. |
| Structured data | Person, ProfessionalService, FAQPage (valid JSON), URLs point to the placeholder domain. |
| Indexability | `index, follow`, no noindex. |
| Performance (lab, 4× CPU throttle, mobile) | LCP ≈ 0.9 s, CLS 0.003, TBT ≈ 76 ms, 283 KB, 13 requests. Good. |

## 2. Technical SEO issues

| Priority | Issue | Fix |
|---|---|---|
| CRITICAL | Canonical, `og:url`, `og:image`, JSON-LD `@id`/`url`, robots `Sitemap:` and sitemap `<loc>` all use `YOUR-DOMAIN.com`. Google may ignore the page's own URL or treat it as a duplicate of a domain you don't own. | Point everything at `https://ansariatif.tech/…`. |
| CRITICAL | Animated headings render their text twice after JS (e.g. H1 "…ATIFATIF", H2 "Shipped & liveShipped & live"). | Split-letter animation must keep one text copy (aria-label on the heading, letters `aria-hidden`). |
| HIGH | Hidden placeholder links (`wa.me/91XXXXXXXXXX`, `linkedin.com/in/your-profile`, `github.com/your-username`) are in the DOM. | Remove until real URLs exist; then add them to `sameAs`. |
| HIGH | No custom 404 page; no clean-URL config. | `404.html` + `vercel.json` (`cleanUrls`, no trailing slash). |
| MEDIUM | Several H2s are creative but non-descriptive ("Good questions", "Ready-made gigs"). | Make H2s describe the section while keeping the style. |
| MEDIUM | FAQPage rich results are now limited to authoritative gov/health sites, so the markup is harmless but won't produce stars/dropdowns. | Keep only where FAQs are visible; don't rely on it. |
| LOW | Google Fonts CSS is render-blocking. | Acceptable today (LCP 0.9 s). Self-host fonts later if field data (CrUX) shows issues. |

## 3. Indexing issues

- Only one URL exists, so Google can only rank the homepage, and a homepage can't be the best answer for 40+ distinct commercial queries.
- The placeholder canonical is the single biggest indexing risk. Fix first.
- The sitemap must list real URLs, and the host must match the canonical (www).

## 4. Site architecture problems

- No service pages, no portfolio/case-study pages, no about/contact pages, no blog.
- No internal links between topics (only `#anchors`).
- Everything competes on one URL.

## 5. Keyword → page map (phase 1 = implemented now)

Primary keyword first; variations are used naturally in copy, not repeated.

| URL | Primary keyword | Secondary / variations | Intent | Title (≤ 60) | H1 |
|---|---|---|---|---|---|
| `/` | freelance full stack developer | freelance web developer India, hire freelance developer, freelance software developer, software development agency alternative | Commercial / navigational | Freelance Full-Stack Developer in India — Web, App & AI \| Atif | Ansari Mohd Atif — Freelance Full-Stack Developer |
| `/web-development` | website development | web developer, freelance web developer, custom website development, affordable web development, website maintenance | Commercial | Website Development Services by a Freelance Web Developer | Website development that turns visitors into clients |
| `/web-app-development` | web application development | custom web application development, admin dashboard, portal, SaaS dashboard | Commercial | Custom Web Application Development | Custom web applications built around your workflow |
| `/ecommerce-development` | ecommerce website development | ecommerce website developer, ecommerce development, online store, ecommerce app | Commercial | E-commerce Website Development — Custom Online Stores | E-commerce websites and apps that are built to sell |
| `/mobile-app-development` | mobile app development | mobile app developer, freelance app developer, Android app development, iOS app development, cross-platform app development, hire app developer | Commercial | Mobile App Development — Android & iOS Apps | Mobile app development for Android and iOS |
| `/flutter-development` | Flutter developer | hire Flutter developer, Flutter app development, Flutter + backend, Dart | Commercial (hire) | Hire a Flutter Developer — Flutter App Development | Hire a Flutter developer who also builds the backend |
| `/backend-development` | backend development | backend developer, API development, REST API development, database development, hire backend developer, Laravel/FastAPI/Node.js backends | Commercial | Backend & API Development — Hire a Backend Developer | Backend and API development for web and mobile apps |
| `/api-integration` | API integration | third-party API integration, WhatsApp API integration, CRM/ERP integration, webhooks | Commercial | API Integration Services — Third-Party & WhatsApp APIs | API integration that connects your tools |
| `/payment-gateway-integration` | payment gateway integration | Razorpay integration, subscriptions, webhooks, UPI payments | Commercial | Payment Gateway Integration — Razorpay for Web & Apps | Payment gateway integration for websites and apps |
| `/ai-development` | AI development | AI integration, AI automation, LLM integration, AI chatbot, RAG | Commercial | AI Development & AI Integration Services | AI development and integration for real business use |
| `/business-automation` | business automation | workflow automation, automation developer, Python automation, Playwright | Commercial | Business & Workflow Automation Services | Business and workflow automation that saves hours |
| `/devops-server-management` | server management | DevOps, cloud deployment, AWS deployment, Docker, cPanel/Hostinger, website maintenance | Commercial | DevOps, AWS & Server Management Services | DevOps, cloud deployment and server management |

### Cannibalisation decisions

- **backend vs API development vs database development:** one page (`/backend-development`) for now. Split `/api-development` or `/database-development` out only if Search Console shows separate queries with impressions landing on the wrong page.
- **web development vs custom web development:** merged into `/web-development`. **Web app** stays separate (software/portal intent vs brochure/business-site intent).
- **mobile vs Flutter:** `/mobile-app-development` = the business outcome (an app for Android and iOS). `/flutter-development` = hiring intent for the technology (Flutter + backend architecture, Dart, Serverpod). They link to each other.
- **AI development vs AI automation vs business automation:** AI integration and AI automation go on `/ai-development`. Non-AI workflow automation (scripts, bots, schedulers, Playwright) goes on `/business-automation`.
- **Payment gateway vs API integration:** separate. Payments have distinct, high-intent queries and you have real Razorpay experience.

## 6. Missing pages (phase 2 — needs your input or real material)

| Page | Why it waits |
|---|---|
| `/portfolio` + `/case-studies/<project>` | Needs real details per project (problem, your role, screenshots, store links, outcome you can verify). |
| `/about` | Needs your real bio: years of experience, location/city, education, how you work. |
| `/contact` | Can ship any time; waits for real WhatsApp/LinkedIn/GitHub links. |
| `/laravel-development`, `/python-development` (FastAPI, Django), `/nodejs-development`, `/nextjs-development` | Worth building once each has at least one real project or code sample to point to. |
| `/saas-development`, `/mvp-development` | Strong startup intent. Best written with a real MVP/SaaS story. |
| `/blog` | See §7. Articles should come from your experience, with your own numbers. |
| City/country pages | **Not recommended now.** Create one only where you have genuine local relevance (clients or projects there) *and* Search Console shows city-modified queries. Mention service areas on the homepage and About page instead. |

## 7. Content opportunities (blog, phase 2)

Order roughly by commercial value × how uniquely you can answer:

1. How to integrate Razorpay in Flutter + Laravel (with webhooks) — you have direct experience.
2. Flutter + Laravel (or FastAPI) architecture for production apps.
3. How much does app development cost in India? (Use your real pricing ranges and what drives them.)
4. How much does an e-commerce website cost?
5. Flutter vs native app development — when each makes sense.
6. How to build an MVP in weeks, not months (scope, stack, launch checklist).
7. Laravel vs Node.js for your backend.
8. How to add AI (LLM + vector search) to an existing app.
9. How to automate business workflows with Python and Playwright.
10. How to choose a freelance developer (and when an agency is better).

Each article links to its matching service page, and each service page links to its best article(s).

## 8. Internal linking

- Homepage service cards link to their service pages (done).
- Global footer lists every service page (done).
- Each service page has "Related services" (3–4 links), a breadcrumb and CTAs back to the quote form (done).
- Later: portfolio items ↔ service pages, blog ↔ service pages.

## 9. Structured data

| Where | Types |
|---|---|
| `/` | `WebSite`, `Person` (Ansari Mohd Atif), `ProfessionalService` (areaServed: India, UAE, Saudi Arabia, UK, USA), `FAQPage` (visible FAQs only) |
| Service pages | `Service` (provider = Person), `BreadcrumbList` |
| Later | `Article` on blog posts; `CreativeWork` on case studies. Never add `Review`/`AggregateRating` without real reviews. |

## 10. Performance

Already good in lab tests. Keep:
- no heavy images (the visuals are CSS/SVG);
- service pages load **without** GSAP/Lenis (lighter than the homepage);
- long-cache headers for `/assets`, `/css`, `/js` via `vercel.json`.

Re-check field data in Search Console → Core Web Vitals after ~28 days of traffic.

## 11. Conversion

- Every service page: an H1 that states the service, "Request a quote" CTA above the fold, what's included, process, relevant work, pricing approach, FAQs, final CTA.
- CTAs deep-link to the homepage form with the service pre-selected (`/?service=…#contact`).
- **Needed from you:** a real WhatsApp number (the biggest conversion lever for Indian and Gulf clients), plus LinkedIn and GitHub links.

## 12. Priority order

| Priority | Task | Status |
|---|---|---|
| CRITICAL | Fix canonical / OG / JSON-LD / robots / sitemap to `https://ansariatif.tech` | ✅ done |
| CRITICAL | Fix duplicated heading text | ✅ done |
| CRITICAL | Create phase-1 service pages (11) with unique content | ✅ done |
| HIGH | Remove placeholder links | ✅ done |
| HIGH | `vercel.json` (clean URLs, caching), custom `404.html` | ✅ done |
| HIGH | Homepage → service page links, footer service links, descriptive H2s | ✅ done |
| HIGH | Google Search Console: add Domain property, submit sitemap, inspect URLs | ⏳ you (steps below) |
| HIGH | Real WhatsApp / LinkedIn / GitHub links + `sameAs` | ⏳ needs your links |
| MEDIUM | About, Contact, Portfolio/case-study pages | ⏳ needs your details |
| MEDIUM | First 3 blog articles (Razorpay, Flutter + Laravel, app cost) | ⏳ needs your pricing |
| MEDIUM | Analytics (Vercel Web Analytics or GA4) | ⏳ your choice |
| LOW | Tech pages (Laravel, Python, Node.js, Next.js), SaaS/MVP pages | ⏳ when you have proof |
| LOW | Self-host fonts | optional |

---

## How pages are built

- `index.html` is hand-written (the animated homepage).
- Service pages, `sitemap.xml` and `robots.txt` are **generated**:
  ```bash
  node scripts/build-pages.mjs
  ```
  - Content lives in `content/services.mjs`, one object per page.
  - Templates live in `scripts/build-pages.mjs`.
  - To add a page, add an object to `content/services.mjs` and re-run the script. It is automatically added to the sitemap, the footer and the related-service links.
- Generated files are committed, so Vercel needs no build step.

## Google Search Console (do this after deploying)

1. Go to https://search.google.com/search-console, **Add property → Domain**, and enter `ansariatif.tech`. Verify with the DNS TXT record at your domain registrar. A Domain property covers both `www` and the apex.
2. **Sitemaps** → submit `https://ansariatif.tech/sitemap.xml`.
3. **URL Inspection** → inspect `https://ansariatif.tech/` and 3–4 service pages → **Request indexing**.
4. After 2–4 weeks, check **Pages** (indexing), **Performance** (queries, impressions, CTR) and **Core Web Vitals**.
5. Every month: find pages with impressions but low CTR (improve title/description) and queries ranking at positions 8–20 (improve and expand that page's content).

Optional analytics: enable **Vercel Web Analytics** (no cookies, one click in the Vercel dashboard), or add GA4 with a consent banner if you target UK/EU clients.
