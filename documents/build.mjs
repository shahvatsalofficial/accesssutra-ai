#!/usr/bin/env node
// Builds the documentation website into documents/html (index.html, 13 pages, assets, 404, samples, test-results, SEO files)
// from documents/md/*.md and the recorded proof in docs/proof. Dependency-free. Light theme by default, dark via toggle (remembered).
// Markdown directives on their own line: {{svg:name}} {{flow:name}} {{chart:name}} {{cmp:name}} {{rules}} {{evidence}}.  Inline: {{VERSION}} etc.
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, RULES_VERSION } from '../packages/core/checks.mjs';
import { DIAGRAMS, FLOWS } from '../scripts/site/diagrams.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mdDir = path.join(root, 'documents/md'), out = path.join(root, 'documents/html'), assetDir = path.join(out, 'assets');
const GH = 'https://github.com/shahvatsalofficial/accesssutra-ai';
const SITE = 'https://shahvatsalofficial.github.io/accesssutra-ai/';
const NPM = 'https://www.npmjs.com/package/accesssutra-ai';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headingId = (t) => t.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
const rd = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));

const env = rd('docs/proof/environment.json'), bench = rd('docs/proof/benchmark.json'), fuzz = rd('docs/proof/fuzz-results.json');
const assure = rd('docs/proof/assurance-sample/assurance-report.json'), demo = rd('examples/reports/demo/assessment.json');
const VERSION = env.version, nRules = Object.keys(RULES).length;
const vars = { VERSION, NODE: env.node, PLATFORM: env.platform, RECORDED: env.recordedAt, TESTS: env.tests, PASS: env.pass, FAIL: env.fail, SKIPPED: env.skipped, CHECKS: env.assuranceChecks, CHECKS_PASSED: env.assurancePassed, CHECKS_SKIPPED: env.assuranceSkipped, CHECKS_FAILED: env.assuranceFailed, VERDICT: env.verdict, CASES: env.corpusCases, PRECISION: (env.precision * 100).toFixed(1) + '%', RECALL: (env.recall * 100).toFixed(1) + '%', FUZZ: env.fuzzInputs, FUZZ_UNEXPECTED: env.fuzzUnexpected, FUZZ_MAX_MS: env.fuzzMaxMs, RULES: env.rules };
const fill = (s) => s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error('Unknown placeholder ' + k); return String(vars[k]); });

const GROUPS = [
  ['Start here', ['01-executive-summary', '05-user-guide', '13-real-world-scenarios']],
  ['Reference', ['02-functional-specification', '04-technical-reference', '07-rules-and-evidence']],
  ['Design and trust', ['03-architecture', '06-security-and-privacy', '08-test-report', '10-legal-and-governance']],
  ['Project', ['09-operations-and-release', '11-roadmap-and-faq', '12-glossary']],
];
const ORDER = GROUPS.flatMap((g) => g[1]);

const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  terminal: '<path d="M4 17l6-6-6-6M12 19h8"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
};
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')}</defs></svg>`;
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

// ---------- Markdown ----------
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      u = u.replace(/&amp;/g, '&');
      if (!/^(https?:|#|mailto:)/.test(u)) { if (/^[\w-]+\.md(#|$)/.test(u)) u = u.replace(/\.md(#|$)/, '.html$1'); else u = `${GH}/blob/main/${u.replace(/^(\.\.\/)+/, '')}`; }
      return `<a href="${esc(u)}"${/^https?:/.test(u) ? ' rel="noopener"' : ''}>${t}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:)]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}

function mdToHtml(md, ctx) {
  const lines = md.split(/\r?\n/), outp = [], toc = [];
  let i = 0, firstQuote = true; const para = [];
  const flush = () => { if (para.length) { outp.push(`<p>${inline(para.join(' '))}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { flush(); i++; continue; }
    const fence = l.match(/^```(\w*)/);
    if (fence) { flush(); const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; outp.push(`<pre class="code" data-lang="${esc(fence[1])}"><code>${esc(buf.join('\n'))}</code><button class="copy" type="button">Copy</button></pre>`); continue; }
    const dir = l.match(/^\{\{([a-z]+)(?::(\w+))?\}\}$/);
    if (dir) { flush(); outp.push(ctx.directive(dir[1], dir[2])); i++; continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush(); const id = headingId(h[2]); const n = h[1].length;
      if (n === 2 || n === 3) toc.push({ level: n, text: h[2].replace(/`/g, ''), id });
      outp.push(n === 1 ? `<h1>${inline(h[2])}</h1>` : `<h${n} id="${id}">${inline(h[2])}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${n}>`); i++; continue;
    }
    if (/^---+\s*$/.test(l)) { flush(); outp.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(l)) {
      flush(); const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const text = buf.join(' '); const k = text.match(/^\*\*(Warning|Important|Tip|Note)\*\*\s*/);
      if (firstQuote && !k) { firstQuote = false; outp.push(`<blockquote class="lead-q">${inline(text)}</blockquote>`); }
      else outp.push(`<blockquote class="callout-${k ? k[1].toLowerCase() : 'note'}">${k ? `<strong>${k[1]}.</strong> ${inline(text.slice(k[0].length))}` : inline(text)}</blockquote>`);
      firstQuote = false; continue;
    }
    if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      flush(); const cells = (r) => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
      const head = cells(l), align = cells(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : 'left')); i += 2; const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      outp.push(`<div class="table-wrap"><table><thead><tr>${head.map((c, k) => `<th scope="col" style="text-align:${align[k]}">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, k) => `<td style="text-align:${align[k]}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    const li = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      flush(); const ordered = /\d/.test(li[2]); const items = [];
      while (i < lines.length) { const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/); if (m) { items.push({ depth: Math.floor(m[1].length / 2), text: m[3] }); i++; } else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += ' ' + lines[i].trim(); i++; } else break; }
      const tag = ordered ? 'ol' : 'ul'; let html = '', depth = -1;
      for (const it of items) { while (depth < it.depth) { html += `<${tag}>`; depth++; } while (depth > it.depth) { html += `</li></${tag}>`; depth--; } html += `<li>${inline(it.text)}`; }
      while (depth >= 0) { html += `</li></${tag}>`; depth--; }
      outp.push(html); continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  return { html: outp.join('\n'), toc };
}

// ---------- data-driven blocks ----------
const bars = (rows, cls = '') => `<div class="bars">${rows.map(([l, v, max, c]) => `<div class="bar"><span class="lab">${esc(l)}</span><div class="trk"><div class="fill ${c || cls}" style="width:${max ? Math.max(3, Math.round(100 * v / max)) : 0}%"></div></div><span class="val">${v}</span></div>`).join('')}</div>`;
const chart = (title, body, note = '') => `<figure class="chart"><h4>${esc(title)}</h4>${body}${note ? `<p class="note">${esc(note)}</p>` : ''}</figure>`;
const stack = (parts, label) => `<div class="stack" role="img" aria-label="${esc(label)}">${parts.map(([v, c]) => `<i style="width:${v}%;background:var(--${c})"></i>`).join('')}</div>`;
const FAMILY = { DOC: 'Document', FORM: 'Forms', IMG: 'Names', BTN: 'Names', LINK: 'Names', FRAME: 'Names', ID: 'References', ARIA: 'References', FOCUS: 'Keyboard', KEY: 'Keyboard', VIEW: 'Zoom and timing', MEDIA: 'Zoom and timing', REFRESH: 'Zoom and timing' };
const CHARTS = {
  rules: () => { const c = {}; for (const id of Object.keys(RULES)) { const f = FAMILY[id.split('-')[1]]; c[f] = (c[f] || 0) + 1; } const rows = Object.entries(c).sort((a, b) => b[1] - a[1]); const sev = { serious: 0, moderate: 0, minor: 0, critical: 0 }; for (const r of Object.values(RULES)) sev[r.severity]++;
    return chart(`${nRules} rules by family`, bars(rows.map(([k, v]) => [k, v, rows[0][1]]))) + chart('Default severity split', stack([[100 * sev.serious / nRules, 'bad'], [100 * sev.moderate / nRules, 'warn']], `${sev.serious} serious, ${sev.moderate} moderate`) + `<p class="legend"><span><b style="background:var(--bad)"></b>${sev.serious} serious</span><span><b style="background:var(--warn)"></b>${sev.moderate} moderate</span></p>`, 'Severity is a rule-level heuristic. Real impact depends on the task and the person.'); },
  wcag: () => { const c = {}; for (const r of Object.values(RULES)) for (const w of r.wcag) c[w] = (c[w] || 0) + 1; const rows = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true })); return chart('Rules per candidate WCAG 2.2 criterion', bars(rows.map(([k, v]) => [`SC ${k}`, v, rows[0][1]])), 'Candidate references by number only. A rule firing does not prove a failure of that criterion, and no rule firing does not prove conformance.'); },
  bench: () => { const rs = bench.rules.filter((r) => r.tp + r.fn > 0); return chart('Gold corpus: planted defects found, per rule', bars(rs.map((r) => [r.ruleId, r.tp, Math.max(...rs.map((x) => x.tp + x.fn)), r.fn === 0 ? 'ok' : 'bad'])), `${bench.tp} of ${bench.tp + bench.fn} labelled defects found, ${bench.fp} false positives, over ${bench.cases} cases. Labels written by the maintainer: a regression guard, not a real-world accuracy figure.`); },
  tests: () => chart('Recorded test run', stack([[100 * env.pass / env.tests, 'ok'], [100 * env.skipped / env.tests, 'warn'], [100 * env.fail / env.tests, 'bad']], `${env.pass} passed, ${env.skipped} skipped, ${env.fail} failed`) + `<p class="legend"><span><b style="background:var(--ok)"></b>${env.pass} passed</span><span><b style="background:var(--warn)"></b>${env.skipped} skipped (symlinks need OS privilege on Windows)</span><span><b style="background:var(--bad)"></b>${env.fail} failed</span></p>`, `Node ${env.node}, ${env.platform}, ${env.recordedAt}.`),
  checks: () => { const by = {}; for (const c of assure.checks) (by[c.area] ||= { pass: 0, skipped: 0, fail: 0 })[c.status]++; const rows = Object.entries(by).sort((a, b) => (b[1].pass + b[1].skipped + b[1].fail) - (a[1].pass + a[1].skipped + a[1].fail)); const mx = Math.max(...rows.map(([, v]) => v.pass + v.skipped + v.fail)); return chart(`${assure.summary.total} assurance checks by area`, bars(rows.map(([k, v]) => [k, v.pass + v.skipped + v.fail, mx, v.fail ? 'bad' : v.skipped ? 'warn' : 'ok'])), 'Green: all passed. Amber: includes a skipped check. Skipped checks are never counted as passed.'); },
  fuzz: () => chart('Fuzzing outcome', stack([[100 * fuzz.returned / fuzz.cases, 'ok'], [100 * fuzz.limitErrors / fuzz.cases, 'warn'], [100 * fuzz.unexpected / fuzz.cases, 'bad']], `${fuzz.returned} scanned, ${fuzz.limitErrors} refused at documented limits, ${fuzz.unexpected} unexpected`) + `<p class="legend"><span><b style="background:var(--ok)"></b>${fuzz.returned} scanned</span><span><b style="background:var(--warn)"></b>${fuzz.limitErrors} refused at a documented limit</span><span><b style="background:var(--bad)"></b>${fuzz.unexpected} unexpected</span></p>`, `${fuzz.cases} deterministic hostile inputs (seed ${fuzz.seed}); slowest ${fuzz.maxMs} ms.`),
  demo: () => { const by = {}; for (const f of demo.findings) by[f.ruleId] = (by[f.ruleId] || 0) + 1; const rows = Object.entries(by).sort((a, b) => b[1] - a[1]); return chart(`Bundled broken signup page: ${demo.summary.total} candidates (${demo.summary.detected} detected, ${demo.summary.requiresReview} for review)`, bars(rows.map(([k, v]) => [k, v, rows[0][1], RULES[k].severity === 'serious' ? 'bad' : 'warn'])), 'From examples/reports/demo/assessment.json, produced by a real run.'); },
};
const CMPS = {
  gate: `<div class="cmp"><div class="b"><h4>Without a gate</h4><p>A refactor ships an icon-only button. Reviewers see identical pixels. A screen reader user hears "button" and nothing else, weeks later.</p></div><div class="g"><h4>With <code>--fail-on serious</code></h4><p>The pull request fails with the rule, line and selector. The fix is one attribute, in the same PR.</p></div></div>`,
  tools: `<div class="cmp"><div class="b"><h4>Scanner alone</h4><p>"0 issues" is read as "accessible". Keyboard traps, confusing errors and unreadable focus never come up.</p></div><div class="g"><h4>Scanner + human plan</h4><p>The report shows what a tool saw <em>and</em> what a named person tested, with gaps listed. Fewer surprises after launch.</p></div></div>`,
};
const ctx = {
  directive(name, arg) {
    if (name === 'rules') return `<div class="table-wrap"><table><thead><tr><th scope="col">Rule</th><th scope="col">Severity</th><th scope="col">Candidate WCAG</th><th scope="col">What it flags</th><th scope="col">Fix</th></tr></thead><tbody>${Object.entries(RULES).map(([id, r]) => `<tr><td><code>${id}</code></td><td>${r.severity}</td><td>${r.wcag.join(', ') || '-'}</td><td>${esc(r.title)}</td><td>${esc(r.fix)}</td></tr>`).join('')}</tbody></table></div>`;
    if (name === 'evidence') return `<div class="proof"><div><h3>${env.pass} tests passed</h3><p>${env.fail} failed, ${env.skipped} skipped. Node ${esc(env.node)}, ${esc(env.platform)}.</p></div><div><h3>${(env.precision * 100).toFixed(0)}% precision, ${(env.recall * 100).toFixed(0)}% recall</h3><p>On ${env.corpusCases} hand-labelled cases. Self-authored; regression evidence only.</p></div><div><h3>${nRules} rules, 0 dependencies</h3><p>Offline. Nothing fetched. Nothing submitted.</p></div></div>`;
    if (name === 'svg') return `<figure class="dia">${DIAGRAMS[arg]?.() ?? ''}</figure>`;
    if (name === 'chart') return CHARTS[arg]?.() ?? '';
    if (name === 'cmp') return CMPS[arg] ?? '';
    if (name === 'flow') { const f = FLOWS[arg]; if (!f) return ''; return `<ol class="flow${f.row ? ' row' : ''}" style="--n:${f.steps.length}">${f.steps.map(([t, d, c]) => `<li class="${c || ''}"><b>${inline(t)}</b>${d ? `<span>${inline(d)}</span>` : ''}</li>`).join('')}</ol>`; }
    throw new Error(`Unknown directive ${name}:${arg}`);
  },
};

// ---------- page shell ----------
const KEY = 'accesssutra-theme';
const themeInit = `try{var t=localStorage.getItem('${KEY}');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}`;
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231d5fd1'/%3E%3Ctext x='16' y='22' font-size='16' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'%3EAS%3C/text%3E%3C/svg%3E";
const LD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'AccessSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux (Node.js 22+)', softwareVersion: VERSION, license: 'https://www.apache.org/licenses/LICENSE-2.0', author: { '@type': 'Person', name: 'Vatsal Shah', url: 'https://github.com/shahvatsalofficial' }, url: SITE, codeRepository: GH, downloadUrl: NPM, description: 'Local-first, evidence-based accessibility testing CLI: offline static HTML scan (18 rules), human manual-test plans, sealed JSON/Markdown/HTML reports and assurance audit. Not a WCAG certification or legal advice.', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }).replace(/</g, '\\u003c');
const head = ({ title, desc, canon, ld = false }) => `<!DOCTYPE html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#1d5fd1"><meta name="author" content="Vatsal Shah"><link rel="canonical" href="${canon}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:site_name" content="AccessSutra AI"><meta property="og:url" content="${canon}"><meta name="twitter:card" content="summary"><link rel="icon" href="${FAVICON}">${ld ? `<script type="application/ld+json">${LD}</script>` : ''}<script>${themeInit}</script><link rel="stylesheet" href="assets/site.css"></head>`;
const NAVLINKS = [['05-user-guide', 'Guide'], ['13-real-world-scenarios', 'Scenarios'], ['07-rules-and-evidence', 'Rules'], ['03-architecture', 'Architecture'], ['08-test-report', 'Proof']];
const topbar = (home, cur) => `<header class="topbar"><div class="topbar-in"><button class="icon-btn menu-btn" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="sidebar">${ic('menu')}</button><a class="brand" href="${home ? '#top' : 'index.html'}"><span class="logo" aria-hidden="true">AS</span><span class="brand-name">Access<b>Sutra</b> AI</span><span class="ver">v${VERSION}</span></a>
<nav class="topnav" aria-label="Primary">${NAVLINKS.map(([s, t]) => `<a href="${s}.html"${cur === s ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
<div class="search" role="search">${ic('search', 18)}<label class="sr" for="q">Search the documentation</label><input id="q" type="search" placeholder="Search docs" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="results"><kbd aria-hidden="true">/</kbd><ul id="results" role="listbox" hidden></ul></div>
<a class="icon-btn gh" href="${GH}" rel="noopener" aria-label="AccessSutra AI on GitHub">${ic('code')}</a>
<button class="icon-btn theme-btn" type="button" aria-pressed="false" aria-label="Switch to dark theme"><svg class="ic i-sun" width="20" height="20" aria-hidden="true"><use href="#i-sun"/></svg><svg class="ic i-moon" width="20" height="20" aria-hidden="true"><use href="#i-moon"/></svg></button></div></header>`;
const footer = () => `<footer class="site-foot"><div class="foot-in"><div class="foot-brand"><a class="brand" href="index.html"><span class="logo" aria-hidden="true">AS</span><span class="brand-name">Access<b>Sutra</b> AI</span></a><p>Local-first accessibility task testing. Scans what a tool can see, plans what only people can test, and says which is which.</p><p class="fine">Created by Vatsal Shah. Apache-2.0.</p></div>
<div><p class="foot-title">Start</p><ul><li><a href="01-executive-summary.html">Overview</a></li><li><a href="05-user-guide.html">User guide</a></li><li><a href="13-real-world-scenarios.html">Scenarios</a></li></ul></div>
<div><p class="foot-title">Reference</p><ul><li><a href="07-rules-and-evidence.html">Rules</a></li><li><a href="04-technical-reference.html">CLI reference</a></li><li><a href="03-architecture.html">Architecture</a></li></ul></div>
<div><p class="foot-title">Trust</p><ul><li><a href="06-security-and-privacy.html">Security</a></li><li><a href="08-test-report.html">Test report</a></li><li><a href="10-legal-and-governance.html">Legal</a></li><li><a href="samples/audit/assurance-report.html">Sample audit</a></li></ul></div>
<div><p class="foot-title">Project</p><ul><li><a href="${GH}" rel="noopener">GitHub</a></li><li><a href="${NPM}" rel="noopener">npm</a></li><li><a href="${GH}/blob/main/CHANGELOG.md" rel="noopener">Changelog</a></li></ul></div></div>
<p class="legal">AccessSutra AI ${VERSION}, rules ${RULES_VERSION}. Not a WCAG certification, VPAT or legal advice. A clean scan means only that the listed static checks found nothing. WCAG, axe-core, Playwright and other names belong to their owners; no endorsement is implied.</p></footer>`;
const tail = (idx) => `<script>window.__DOCS_INDEX__=${JSON.stringify(idx).replace(/</g, '\\u003c')}</script><script src="assets/site.js" defer></script></body></html>`;

// ---------- build ----------
async function main() {
  const pages = [];
  for (const slug of ORDER) {
    const md = fill(await fs.readFile(path.join(mdDir, slug + '.md'), 'utf8'));
    pages.push({ slug, title: (md.match(/^#\s+(.+)$/m) || [, slug])[1], md, summary: (md.match(/^>\s+(.+)$/m) || [, ''])[1].replace(/[*`]/g, '') });
  }
  const unknown = (await fs.readdir(mdDir)).filter((f) => f.endsWith('.md') && !ORDER.includes(f.slice(0, -3)));
  if (unknown.length) throw new Error(`Markdown files missing from GROUPS: ${unknown.join(', ')}`);
  const plain = (md) => md.replace(/```[\s\S]*?```/g, ' ').replace(/\{\{[^}]*\}\}/g, ' ').replace(/[`*#>|_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
  const index = pages.map((p) => ({ t: p.title, u: `${p.slug}.html`, x: plain(p.md).slice(0, 2500) }));
  const side = (cur) => `<aside class="sidebar" id="sidebar" aria-label="Documentation"><a class="nav-home" href="index.html">Home</a>${GROUPS.map(([g, slugs]) => `<div class="nav-group"><p class="nav-title">${g}</p><ol>${slugs.map((s) => { const p = pages.find((x) => x.slug === s); return `<li><a href="${s}.html"${s === cur ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`; }).join('')}</ol></div>`).join('')}</aside><div class="scrim" hidden></div>`;

  // keep the recorded-proof copies the site links to, wipe everything else
  await fs.rm(out, { recursive: true, force: true }); await fs.mkdir(assetDir, { recursive: true });
  const proof = path.join(root, 'docs/proof');
  await fs.mkdir(path.join(out, 'samples'), { recursive: true }); await fs.mkdir(path.join(out, 'test-results'), { recursive: true });
  for (const f of await fs.readdir(proof)) { const src = path.join(proof, f); if ((await fs.stat(src)).isDirectory()) { if (f === 'assurance-sample') await fs.cp(src, path.join(out, 'samples/audit'), { recursive: true }); } else await fs.copyFile(src, path.join(out, f.startsWith('cli-') ? 'samples' : 'test-results', f)); }
  await fs.cp(path.join(root, 'examples/reports/demo'), path.join(out, 'samples/demo-report'), { recursive: true });
  await fs.writeFile(path.join(assetDir, 'site.css'), (await fs.readFile(path.join(root, 'scripts/site/site.css'), 'utf8')) + (await fs.readFile(path.join(root, 'scripts/site/extra.css'), 'utf8')) + '\n.dia-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}.dia-scroll svg.dia{min-width:600px}.table-wrap td:first-child code{white-space:nowrap;overflow-wrap:normal}\n');
  await fs.copyFile(path.join(root, 'scripts/site/site.js'), path.join(assetDir, 'site.js'));

  for (let n = 0; n < pages.length; n++) {
    const p = pages[n]; const { html, toc } = mdToHtml(p.md, ctx);
    const prev = pages[n - 1], next = pages[n + 1];
    const tocUl = toc.length ? `<ul>${toc.map((t) => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul>` : '';
    const body = html.replace(/^<h1>/, `<p class="eyebrow">${esc(GROUPS.find((g) => g[1].includes(p.slug))[0])}</p><h1>`);
    const page = `${head({ title: `${p.title} · AccessSutra AI`, desc: p.summary || `${p.title}: AccessSutra AI documentation`, canon: `${SITE}${p.slug}.html` })}<body><a class="skip" href="#content">Skip to content</a>${sprite}${topbar(false, p.slug)}<div class="layout">${side(p.slug)}<main class="content" id="content" tabindex="-1"><article class="prose">${body}<details class="toc-m"><summary>On this page</summary>${tocUl}</details><p class="edit"><a href="${GH}/blob/main/documents/md/${p.slug}.md" rel="noopener">Edit this page on GitHub</a></p><nav class="pager" aria-label="Pagination">${prev ? `<a class="prev" href="${prev.slug}.html"><span>Previous</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}${next ? `<a class="next" href="${next.slug}.html"><span>Next</span><b>${esc(next.title)}</b></a>` : '<span></span>'}</nav></article></main><nav class="toc" aria-label="On this page"><h2>On this page</h2>${tocUl}</nav></div>${footer()}${tail(index)}`;
    await fs.writeFile(path.join(out, p.slug + '.html'), page);
  }

  // ----- home -----
  const top = demo.findings.slice(0, 4);
  const mock = `<div class="mock" role="img" aria-label="Example evidence report summary for the bundled broken signup page"><div class="mock-bar"><i></i><i></i><i></i><span>assessment.html</span></div><div class="mock-in"><div class="mock-head"><b>Accessibility evidence</b><span class="pill warn">UNVERIFIED</span></div><div class="mock-cards"><div><b>${demo.summary.total}</b><span>candidates</span></div><div><b>${demo.summary.bySeverity.serious}</b><span>serious</span></div><div><b>${demo.summary.requiresReview}</b><span>need a human</span></div></div><ul class="mock-list">${top.map((f) => `<li><span class="pill ${f.severity === 'serious' ? 'bad' : 'warn'}">${f.severity}</span> <code>${esc(f.ruleId)}</code> ${esc(f.title)}<span class="loc">${esc(f.source.file)}:${f.source.line}</span></li>`).join('')}</ul></div></div>`;
  const feat = [['code', 'Static scan, 18 rules', 'Names, labels, alt text, language, titles, ARIA references, focus and zoom blockers. Every finding has file, line, selector and a fix.'], ['user', 'Human test plans', 'Ten structured checks for keyboard, focus, screen reader, zoom, contrast and cognition. Only a named reviewer can mark one done.'], ['eye', 'Real browser, optional', 'Playwright and axe-core on file and loopback pages. Tab sampling and rule results join the same report.'], ['file', 'Reports people read', 'Sealed JSON, Markdown and HTML with summary cards, finding cards, and a plain list of what was never tested.'], ['shield', 'Safe by design', 'Offline. No form submission. No external origins. Values and placeholders never copied into output.'], ['check', 'Proof of itself', 'One command writes a sealed assurance report: checks, accuracy on a labelled corpus, fuzzing, with limits stated.']];
  const scn = [['1', 'Two days before launch', 'A scan clears the markup; a human finds the keyboard trap.', 'k-bad'], ['2', 'The icon button that slipped through', 'CI blocks the pull request with one line to fix.', 'k-warn'], ['3', 'Placeholder is not a label', 'Where axe-core and AccessSutra disagree, and how to decide.', 'k-info'], ['5', 'Are you WCAG compliant?', 'Answer procurement with an evidence pack, not a slogan.', 'k-ok']];
  const faq = [['Does it make my site WCAG compliant?', 'No. It finds some candidates and organises the human testing that proves the rest.'], ['Does it need an API key or internet?', 'No. The scan is fully offline and uses only Node.js built-ins.'], ['Can it browse or submit forms on my live site?', 'No. The optional browser adapter only opens file: and loopback URLs and never submits forms.'], ['Is the 100% benchmark real?', 'It is real and small: 56 cases labelled by the author. It guards against regressions; it is not a claim about other sites.'], ['Can an AI agent mark a check as passed?', 'No. A named reviewer, environment and note are required, and the report says so.'], ['Can I use it commercially?', 'Yes, under Apache-2.0.']];
  const home = `${head({ title: 'AccessSutra AI · Test the journey, prove what works', desc: 'Local-first accessibility testing CLI: offline static HTML scan with 18 rules, human keyboard and screen reader test plans, optional Playwright + axe-core, sealed JSON, Markdown and HTML reports. Not a WCAG certification.', canon: SITE, ld: true })}<body class="home-page" id="top"><a class="skip" href="#main">Skip to content</a>${sprite}${topbar(true, '')}
<main id="main"><section class="hero"><div class="wrap hero-grid"><div><p class="badge"><span class="dot"></span>v${VERSION} · Apache-2.0 · zero dependencies</p><h1>Test the journey. <span class="grad">Prove what works.</span></h1><p class="lead">AccessSutra AI scans your HTML for accessibility candidates, plans the keyboard and screen reader tests only people can do, and writes a sealed report that says exactly what was and was not tested. Offline. Honest. Never a false "compliant".</p>
<div class="cta"><a class="btn primary" href="05-user-guide.html">Get started ${ic('arrow', 18)}</a><a class="btn" href="13-real-world-scenarios.html">See real scenarios</a></div>
<div class="install"><span class="prompt" aria-hidden="true">$</span><code>npx accesssutra-ai demo</code><button class="copy-inline" type="button" aria-label="Copy install command">${ic('copy', 16)}<span>Copy</span></button></div>
<ul class="facts"><li>Node 22+</li><li>No API key</li><li>No network</li><li>HTML · MD · JSON</li></ul></div><div class="hero-art">${mock}</div></div></section>
<section class="statband" aria-label="Key facts"><div class="wrap"><ul><li><b>${nRules}</b><span>rules</span></li><li><b>${env.pass}</b><span>tests passing</span></li><li><b>${env.assuranceChecks}</b><span>assurance checks</span></li><li><b>${env.fuzzInputs}</b><span>hostile inputs fuzzed</span></li><li><b>0</b><span>runtime dependencies</span></li></ul></div></section>
<section class="sec"><div class="wrap"><p class="kicker">What it does</p><h2>A scanner is the start, not the finish</h2><p class="sub">Automated tools see only part of accessibility. AccessSutra keeps the tool-checkable part and the human-only part in one honest report.</p><div class="feat-grid">${feat.map(([i, t, d]) => `<div class="feat"><div class="feat-ic">${ic(i, 22)}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">How it works</p><h2>From a file to evidence you can send</h2><p class="sub">Every stage is deterministic. The report states what was never tested.</p><figure class="dia" style="margin:0">${DIAGRAMS.pipeline()}</figure>
<ol class="steps"><li><span class="n">1</span><h3>Scan</h3><p>Point it at a page.</p><pre class="mini-code"><code>accesssutra scan --input page.html --out scan.json</code></pre></li><li><span class="n">2</span><h3>Test</h3><p>People run the manual plan and record observations.</p><pre class="mini-code"><code>accesssutra manual --task task.json --out manual.json</code></pre></li><li><span class="n">3</span><h3>Report</h3><p>One sealed report, three formats.</p><pre class="mini-code"><code>accesssutra report --scan scan.json --manual manual.json --out report</code></pre></li></ol></div></section>
<section class="sec"><div class="wrap"><p class="kicker">Evidence ladder</p><h2>Never a stronger claim than the evidence</h2><p class="sub">An empty findings list is level zero, not "accessible".</p><figure class="dia" style="margin:0">${DIAGRAMS.ladder()}</figure></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">Real-world scenarios</p><h2>Situations you will recognise</h2><p class="sub">Each scenario is a step-by-step flowchart with real commands and output.</p><div class="scn-grid">${scn.map(([n, t, d, k]) => `<a class="scard ${k}" href="13-real-world-scenarios.html#scenario-${n}-${headingId(t)}"><span class="snum">${n}</span><h3>${t}</h3><p>${d}</p><span class="more">Read the scenario ${ic('arrow', 16)}</span></a>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><p class="kicker">Proof, with limits</p><h2>Measured, not promised</h2><p class="sub">Every number is regenerated from a real run. The limits sit next to the numbers.</p>${ctx.directive('evidence')}${CHARTS.checks()}<p class="cta" style="margin-top:1.2rem"><a class="btn" href="08-test-report.html">Method and raw results ${ic('arrow', 18)}</a><a class="btn ghost" href="samples/audit/assurance-report.html">Open the sample audit report</a></p></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">Who uses it</p><h2>Built for the people who ship and test</h2><div class="who"><div><b>Developers</b><span>A fast CI gate on built pages.</span></div><div><b>QA and testers</b><span>Repeatable manual plans with evidence.</span></div><div><b>Accessibility leads</b><span>Honest reports that show the gaps.</span></div><div><b>AI-assisted teams</b><span>21 roles and 26 skills for coding assistants.</span></div></div></div></section>
<section class="sec"><div class="wrap"><p class="kicker">Documentation</p><h2>Everything, in order</h2><div class="dgrid">${GROUPS.map(([g, slugs]) => `<div class="dgroup"><h3>${g}</h3><p>${slugs.length} pages</p><ul>${slugs.map((s) => { const p = pages.find((x) => x.slug === s); return `<li><a href="${s}.html">${esc(p.title)}</a></li>`; }).join('')}</ul></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap narrow"><p class="kicker center">FAQ</p><h2 class="center">Quick answers</h2>${faq.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>
<section class="cta-band"><div class="wrap"><h2>See what the scanner can and cannot see</h2><p>Free, offline and open source.</p><div class="install on-dark"><span class="prompt" aria-hidden="true">$</span><code>npx accesssutra-ai demo</code><button class="copy-inline" type="button" aria-label="Copy install command">${ic('copy', 16)}<span>Copy</span></button></div><div class="cta center"><a class="btn light" href="${GH}" rel="noopener">View on GitHub</a><a class="btn outline" href="05-user-guide.html">Read the guide</a></div></div></section></main>${footer()}${tail(index)}`;
  await fs.writeFile(path.join(out, 'index.html'), home);
  await fs.writeFile(path.join(out, '404.html'), `${head({ title: 'Page not found · AccessSutra AI', desc: 'Page not found', canon: `${SITE}404.html` }).replace('href="assets/site.css"', 'href="/accesssutra-ai/assets/site.css"')}<body>${sprite}<main class="wrap narrow center" style="padding:5rem 0"><h1>Page not found</h1><p class="lead" style="margin-inline:auto">This page does not exist.</p><p class="cta center"><a class="btn primary" href="/accesssutra-ai/">Back to the home page</a></p></main></body></html>`);

  // SEO + LLM discovery files, markdown with placeholders filled
  await fs.writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...pages.map((p) => p.slug + '.html'), 'samples/audit/assurance-report.html', 'samples/demo-report/assessment.html'].map((u) => `<url><loc>${SITE}${u}</loc></url>`).join('')}</urlset>\n`);
  await fs.writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
  await fs.copyFile(path.join(root, 'llms.txt'), path.join(out, 'llms.txt'));
  await fs.writeFile(path.join(out, '.nojekyll'), '');
  await fs.mkdir(path.join(root, 'documents/md-rendered'), { recursive: true });
  for (const p of pages) await fs.writeFile(path.join(root, 'documents/md-rendered', p.slug + '.md'), p.md.split('\n').filter((l) => !/^\{\{[a-z]+(:\w+)?\}\}$/.test(l)).join('\n'));
  console.log(`Built site: ${pages.length} pages + home + 404 in documents/html`);
}
await main();
