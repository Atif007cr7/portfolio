// Small Markdown renderer for blog posts, with build-time syntax highlighting. No dependencies.
//
// Supported, and nothing else:
//   front matter      --- key: value --- at the top of the file
//   headings          ## and ### (the post title is the H1)
//   paragraphs, lists - item / 1. item (one level; indent continuation lines)
//   code blocks       ```dart lib/path/to/file.dart   (language, then an optional file name)
//   images            ![alt text](/assets/blog/x.svg "Caption") on a line of its own
//   notes             > text  (rendered as a highlighted aside)
//   tables            | a | b | with a |---|---| separator row
//   inline            `code`, **bold**, *italic*, [text](/internal-or-https-url)
import { readFileSync } from "node:fs";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function frontMatter(src, file) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const data = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim()) continue;
    const i = line.indexOf(":");
    if (i < 1) throw new Error(`${file}: bad front matter line "${line}"`);
    data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: src.slice(m[0].length) };
}

// ---- syntax highlighting ----
// Each language is an ordered list of [token class, regex source]. Earlier rules win.
const DART_KW = "abstract|as|assert|async|await|base|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|null|on|operator|part|of|required|rethrow|return|sealed|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|when|while|with|yield";
const STRINGS = `'''[\\s\\S]*?'''|"""[\\s\\S]*?"""|'(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*"`;
const LANGS = {
  dart: [
    ["com", String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`],
    ["str", `r?(?:${STRINGS})`],
    ["meta", String.raw`@[A-Za-z_]\w*`],
    ["kw", String.raw`\b(?:${DART_KW})\b`],
    ["type", String.raw`\b_?[A-Z][A-Za-z0-9_]*\b`],
    ["num", String.raw`\b\d+(?:\.\d+)?\b`],
    ["fn", String.raw`\b[a-z_][A-Za-z0-9_]*(?=\s*(?:<[^>()]*>)?\()`],
  ],
  yaml: [
    ["com", String.raw`(?<=^|\s)#[^\n]*`],
    ["key", String.raw`(?<=^[ \t]*(?:- )?)[A-Za-z_][\w.-]*(?=\s*:)`],
    ["str", STRINGS],
    ["kw", String.raw`\b(?:true|false|null|now)\b`],
    ["type", String.raw`\b[A-Z][A-Za-z0-9_]*\b`],
    ["num", String.raw`\b\d+(?:\.\d+)*\b`],
  ],
  bash: [
    ["com", String.raw`(?<=^|\s)#[^\n]*`],
    ["str", STRINGS],
    ["fn", String.raw`(?<=^[ \t]*)[a-z][\w.-]*`],
    ["attr", String.raw`(?<=\s)--?[\w-]+(?:=[^\s]*)?`],
  ],
};
LANGS.sh = LANGS.shell = LANGS.bash;
LANGS.yml = LANGS.yaml;
// Shown above a code block that has no file name.
const CODE_LABELS = { bash: "Terminal", sh: "Terminal", shell: "Terminal", dart: "Dart", yaml: "YAML", yml: "YAML", text: "", "": "" };

export function highlight(code, lang) {
  const rules = LANGS[lang];
  if (!rules) return esc(code);
  const re = new RegExp(rules.map(([, src]) => `(${src})`).join("|"), "gm");
  let out = "", last = 0;
  for (const m of code.matchAll(re)) {
    if (!m[0]) continue;
    const cls = rules[m.slice(1).findIndex((g) => g !== undefined)][0];
    out += esc(code.slice(last, m.index)) + `<span class="tok-${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

// ---- image size (so <img> gets width/height and the layout doesn't shift) ----
export function imageSize(file) {
  const b = readFileSync(file);
  if (file.endsWith(".svg")) {
    const tag = b.toString("utf8").match(/<svg[^>]*>/)?.[0] || "";
    const w = tag.match(/\swidth="(\d+)/)?.[1], h = tag.match(/\sheight="(\d+)/)?.[1];
    if (w && h) return [+w, +h];
    const vb = tag.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
    if (vb) return [Math.round(vb[1]), Math.round(vb[2])];
  } else if (b.toString("ascii", 1, 4) === "PNG") {
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  } else if (b.toString("ascii", 0, 3) === "GIF") {
    return [b.readUInt16LE(6), b.readUInt16LE(8)];
  } else if (b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === "VP8L") { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  } else if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length;) {
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  throw new Error(`${file}: can't read image size (use svg, png, jpg, gif or webp)`);
}

// ---- inline ----
// `link(href)` validates internal links and returns attributes for external ones.
function inline(text, link) {
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(`<code>${c}</code>`) - 1}\u0000`);
  s = s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => `<a href="${href}"${link(href.replace(/&amp;/g, "&"))}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i]);
}

// ---- blocks ----
// Returns { html, toc: [[id, text]], words, images: [src] }.
export function render(md, { file, link, image }) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [], toc = [], images = [], ids = new Set();
  let words = 0, i = 0, para = [];
  const count = (s) => (words += s.split(/\s+/).filter(Boolean).length);
  const flush = () => {
    if (!para.length) return;
    const t = para.join(" ");
    count(t);
    out.push(`<p>${inline(t, link)}</p>`);
    para = [];
  };
  const heading = (level, raw) => {
    let id = slugify(raw);
    while (ids.has(id)) id += "-2";
    ids.add(id);
    count(raw);
    if (level === 2) toc.push([id, inline(raw, () => "").replace(/<[^>]+>/g, "")]);
    out.push(`<h${level} id="${id}">${inline(raw, link)}</h${level}>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (!line.trim()) { flush(); i++; continue; }

    if ((m = line.match(/^```(\w*)\s*(.*)$/))) {
      flush();
      const [, lang, name] = m, body = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) body.push(lines[i]);
      if (i >= lines.length) throw new Error(`${file}: unclosed code block`);
      i++;
      const code = body.join("\n");
      words += Math.round(code.split(/\s+/).length / 3); // code is skimmed, not read word by word
      const label = name ? `<span class="code-file">${esc(name)}</span>` : `<span class="code-lang">${esc(CODE_LABELS[lang] ?? lang)}</span>`;
      out.push(`<div class="code"><div class="code-bar">${label}<button class="code-copy" type="button" hidden>Copy</button></div><pre${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${highlight(code, lang)}</code></pre></div>`);
      continue;
    }
    if ((m = line.match(/^(#{2,3}) (.+)$/))) { flush(); heading(m[1].length, m[2].trim()); i++; continue; }
    if (/^#\s/.test(line)) throw new Error(`${file}: use ## or ### (the title is the H1)`);

    if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/))) {
      flush();
      const [, alt, src, caption] = m;
      if (!alt) throw new Error(`${file}: image ${src} needs alt text`);
      images.push(src);
      // The image links to itself so readers on small screens can open it full size.
      out.push(`<figure class="post-fig"><a class="post-fig-link" href="${esc(src)}">${image(src, alt)}</a>${caption ? `<figcaption>${inline(caption, link)}</figcaption>` : ""}</figure>`);
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      const body = [];
      for (; i < lines.length && lines[i].startsWith(">"); i++) body.push(lines[i].replace(/^>\s?/, ""));
      const paras = body.join("\n").split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
      paras.forEach(count);
      out.push(`<aside class="note">${paras.map((p) => `<p>${inline(p, link)}</p>`).join("")}</aside>`);
      continue;
    }
    if (/^(- |\d+\. )/.test(line)) {
      flush();
      const ordered = /^\d/.test(line), items = [];
      for (; i < lines.length; i++) {
        const l = lines[i];
        if (/^(- |\d+\. )/.test(l)) items.push(l.replace(/^(- |\d+\. )/, ""));
        else if (/^\s{2,}\S/.test(l) && items.length) items[items.length - 1] += " " + l.trim();
        else break;
      }
      items.forEach(count);
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t, link)}</li>`).join("")}</${tag}>`);
      continue;
    }
    if (line.startsWith("|")) {
      flush();
      const rows = [];
      for (; i < lines.length && lines[i].startsWith("|"); i++) rows.push(lines[i].replace(/^\||\|\s*$/g, "").split("|").map((c) => c.trim()));
      if (!rows[1]?.every((c) => /^:?-+:?$/.test(c))) throw new Error(`${file}: table needs a |---| separator row`);
      rows.flat().forEach(count);
      const [head, , ...body] = rows;
      out.push(`<div class="table"><table><thead><tr>${head.map((c) => `<th>${inline(c, link)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c, link)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flush();
  return { html: out.join("\n"), toc, words, images };
}
