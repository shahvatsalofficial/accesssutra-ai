import os from 'node:os';
import { mkdtemp, writeFile, rm, readFile, symlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { scanHtml, scanHtmlFile, RULES, RULES_VERSION, DISCLAIMER } from './checks.mjs';
import { CASES } from './corpus.mjs';
import { createManualPlan, applyObservations } from './manual.mjs';
import { composeReport, toMarkdown, toHtml, sealOf, verifySeal, esc, CSS } from './report.mjs';
import { appendAudit, verifyLedger } from './audit.mjs';
import { installIde } from './installer.mjs';
import { permittedUrl } from '../browser/runner.mjs';
import { createReportServer } from '../server/server.mjs';
import { VERSION } from './version.mjs';

export const ASSURANCE_SCHEMA = 'accesssutra.assurance/1';

/** Gold-corpus benchmark: per-rule precision/recall plus exact-match rate over hand-labelled cases. */
export function runBenchmark() {
  const per = Object.fromEntries(Object.keys(RULES).map((r) => [r, { tp: 0, fp: 0, fn: 0 }]));
  const misses = []; let exact = 0;
  for (const [name, html, expected] of CASES) {
    const got = scanHtml(html).findings.map((f) => f.ruleId).sort();
    const want = [...expected].sort();
    const left = [...want];
    for (const r of got) { const i = left.indexOf(r); if (i >= 0) { left.splice(i, 1); per[r].tp++; } else per[r].fp++; }
    for (const r of left) per[r].fn++;
    if (JSON.stringify(got) === JSON.stringify(want)) exact++; else misses.push({ case: name, expected: want, got });
  }
  const rate = (a, b) => (a + b === 0 ? null : Number((a / (a + b)).toFixed(4)));
  const rules = Object.entries(per).map(([ruleId, c]) => ({ ruleId, ...c, precision: rate(c.tp, c.fp), recall: rate(c.tp, c.fn) }));
  const T = rules.reduce((s, r) => ({ tp: s.tp + r.tp, fp: s.fp + r.fp, fn: s.fn + r.fn }), { tp: 0, fp: 0, fn: 0 });
  return { corpus: 'packages/core/corpus.mjs', labelling: 'self-authored by the maintainer; not an independent benchmark', cases: CASES.length, exactMatch: exact, exactMatchRate: Number((exact / CASES.length).toFixed(4)), ...T, precision: rate(T.tp, T.fp), recall: rate(T.tp, T.fn), rules, misses };
}

const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const OK_ERR = /limit|nesting/i;

/** Deterministic fuzzing: scanHtml must either return a valid result or throw one of the documented limit errors. */
export function runFuzz({ seed = 20261122, mutations = 600 } = {}) {
  const rnd = mulberry32(seed); const pick = (a) => a[Math.floor(rnd() * a.length)];
  const frag = ['<', '>', '"', "'", '=', '/', '<input', '<img ', '<a href=', '</div>', '<!--', '-->', '<script>', '</script>', '<textarea>', '<title>', 'aria-labelledby="', ' id="x"', '\u0000', '\ud800', '<![CDATA[', '<?x ', '&amp;', 'tabindex=-9', '<label for=', '\n', '<svg>', '<button', '<meta http-equiv=refresh content=', '<iframe'];
  const stats = { seed, cases: 0, returned: 0, limitErrors: 0, unexpected: 0, maxMs: 0, notes: [] };
  const run = (label, html) => {
    stats.cases++; const t0 = performance.now();
    try { const r = scanHtml(html); if (!r || !Array.isArray(r.findings) || r.scope.sha256.length !== 64) throw new Error('invalid result shape'); toHtml(composeReport(r)); toMarkdown(composeReport(r)); stats.returned++; }
    catch (e) { if (OK_ERR.test(e.message)) stats.limitErrors++; else { stats.unexpected++; if (stats.notes.length < 5) stats.notes.push(`${label}: ${String(e.message).slice(0, 100)}`); } }
    stats.maxMs = Math.max(stats.maxMs, Math.round(performance.now() - t0));
  };
  const seedDoc = CASES.map((c) => c[1]);
  for (let i = 0; i < mutations; i++) {
    let s = pick(seedDoc);
    for (let k = 0, n = 1 + Math.floor(rnd() * 6); k < n; k++) { const at = Math.floor(rnd() * (s.length + 1)); s = rnd() < 0.5 ? s.slice(0, at) + pick(frag) + s.slice(at) : s.slice(0, at) + s.slice(at + Math.floor(rnd() * 12)); }
    run('mutation#' + i, s);
  }
  for (let i = 0; i < 200; i++) { let s = ''; for (let k = 0, n = 1 + Math.floor(rnd() * 60); k < n; k++) s += pick(frag) + (rnd() < 0.3 ? 'x' : ''); run('random#' + i, s); }
  const big = 2 * 1024 * 1024;
  run('only-lt', '<'.repeat(big - 10)); run('lt-a', '<a '.repeat(big / 6)); run('unterminated-quote', '<a title="' + 'x'.repeat(big - 100));
  run('many-attrs', '<div ' + 'a=1 '.repeat(200000) + '>'); run('deep-127', '<div>'.repeat(127)); run('deep-200', '<div>'.repeat(200));
  run('many-nodes', '<i>'.repeat(10) + '<b></b>'.repeat(40000)); run('many-comments', '<!--x-->'.repeat(200000));
  run('unclosed-script', '<script>' + '<input>'.repeat(1000)); run('binary', Buffer.from(Array.from({ length: 20000 }, (_, i) => (i * 97) % 256)).toString('latin1'));
  run('empty', ''); run('whitespace', ' \n\t '.repeat(1000)); run('proto-attr', '<input __proto__="x" constructor="y" toString="z">');
  return stats;
}

const rec = (id, area, title, status, evidence) => ({ id, area, title, status, evidence });
const guard = async (fn) => { try { return await fn(); } catch (e) { return [false, 'threw: ' + String(e.message).slice(0, 160)]; } };

export async function runChecks({ root }) {
  const checks = []; const add = (...a) => checks.push(rec(...a));
  const run = async (id, area, title, fn) => { const r = await guard(fn); add(id, area, title, r[0] === 'skip' ? 'skipped' : r[0] ? 'pass' : 'fail', r[1]); };
  const broken = await readFile(join(root, 'fixtures/signup-broken.html'), 'utf8');
  const good = await readFile(join(root, 'fixtures/signup-good.html'), 'utf8');
  const task = JSON.parse(await readFile(join(root, 'fixtures/signup-task.json'), 'utf8'));
  const dir = await mkdtemp(join(tmpdir(), 'accesssutra-assure-'));
  try {
    await run('AS-A01', 'determinism', 'Same input yields byte-identical scan JSON', async () => { const a = JSON.stringify(scanHtml(broken, { source: 'x.html' })), b = JSON.stringify(scanHtml(broken, { source: 'x.html' })); return [a === b, `${a.length} bytes compared`]; });
    await run('AS-A02', 'honesty', 'Clean fixture reports no findings yet still lists untested areas', async () => { const r = scanHtml(good); return [r.findings.length === 0 && r.untested.length >= 8 && /not establish/.test(r.disclaimer), `findings=${r.findings.length}, untested=${r.untested.length}`]; });
    await run('AS-A03', 'honesty', 'Disclaimer present in scan, manual plan, report, Markdown and HTML', async () => { const s = scanHtml(broken), m = createManualPlan(task), r = composeReport(s, m); return [[s.disclaimer, m.disclaimer, r.disclaimer].every((d) => d === DISCLAIMER) && toMarkdown(r).includes('Not a certification') && toHtml(r).includes('Scope limitation'), 'all five outputs']; });
    await run('AS-A04', 'privacy', 'Form field values are never copied into output', async () => { const s = JSON.stringify(scanHtml('<html lang="en"><title>x</title><input value="SECRET_PRIVATE_123" placeholder="PLACEHOLDER_456"></html>')); return [!s.includes('SECRET_PRIVATE_123') && !s.includes('PLACEHOLDER_456'), 'value and placeholder absent']; });
    await run('AS-A05', 'injection', 'HTML report escapes hostile file name and Markdown report neutralises links', async () => {
      const s = scanHtml('<html><button></button></html>', { source: '"><img src=x onerror=alert(1)>[x](javascript:alert(1)).html' }); const r = composeReport(s);
      const h = toHtml(r), m = toMarkdown(r); return [!/<img src=x/.test(h) && !h.includes('onerror=alert(1)><') && !/\[x\]\(javascript/.test(m) && !m.includes('<img'), 'payload inert in both formats']; });
    await run('AS-A06', 'integrity', 'Report seal verifies and detects a one-character edit', async () => { const r = composeReport(scanHtml(broken)); const ok = verifySeal(r).valid; const t = structuredClone(r); t.summary.total += 1; return [ok && !verifySeal(t).valid && sealOf(r) === r.seal.sha256, 'seal valid; tampered copy rejected']; });
    await run('AS-A07', 'integrity', 'Audit ledger detects edits, reordering and truncation of the middle', async () => {
      const f = join(dir, 'a.jsonl'); for (const t of ['scan', 'report', 'verify']) await appendAudit(f, t, { n: 1 });
      const lines = (await readFile(f, 'utf8')).trim().split('\n'); const okChain = verifyLedger(lines.join('\n') + '\n').valid;
      const edited = verifyLedger(lines.join('\n').replace('report', 'erase') + '\n').valid; const swapped = verifyLedger([lines[1], lines[0], lines[2]].join('\n') + '\n').valid; const gap = verifyLedger([lines[0], lines[2]].join('\n') + '\n').valid;
      return [okChain && !edited && !swapped && !gap, 'valid chain accepted; edit, swap, gap rejected']; });
    await run('AS-A08', 'limits', 'Oversize and over-nested HTML refused with a clear error', async () => { let a = 0; for (const h of ['a'.repeat(2 * 1024 * 1024 + 1), '<div>'.repeat(200)]) { try { scanHtml(h); } catch (e) { if (/limit|nesting/i.test(e.message)) a++; } } return [a === 2, '2/2 refused']; });
    await run('AS-A09', 'filesystem', 'Symlink input refused', async () => { const t = join(dir, 'real.html'); await writeFile(t, good); try { await symlink(t, join(dir, 'link.html')); } catch (e) { if (e.code === 'EPERM' || e.code === 'EACCES') return ['skip', 'host cannot create symlinks without privilege']; throw e; } try { await scanHtmlFile(join(dir, 'link.html')); return [false, 'symlink was scanned']; } catch (e) { return [/non-symlink/.test(e.message), 'refused']; } });
    await run('AS-A10', 'manual-evidence', 'Observations need reviewer, environment and note; credentials are rejected; duplicates and unknown ids refused', async () => {
      const bad = [[{ id: 'keyboard-trap', status: 'passed' }], [{ id: 'keyboard-trap', status: 'passed', reviewer: 'a', environment: 'b', observation: 'Bearer abcdefghijklmnopqrstuvwxyz' }], [{ id: 'keyboard-trap', status: 'not-run' }, { id: 'keyboard-trap', status: 'not-run' }], [{ id: 'nope', status: 'not-run' }], [{ id: 'keyboard-trap', status: 'passed', reviewer: 'a', environment: 'b', observation: 'x'.repeat(501) }]];
      let n = 0; for (const o of bad) { try { applyObservations(createManualPlan(task), o); } catch { n++; } } return [n === bad.length, `${n}/${bad.length} rejected`]; });
    await run('AS-A11', 'manual-evidence', 'A fresh manual plan is "not-tested"; software never marks a check passed by itself', async () => { const p = createManualPlan(task); return [p.completion.status === 'not-tested' && p.checks.every((c) => c.status === 'not-run'), `${p.checks.length} checks all not-run`]; });
    await run('AS-A12', 'scope', 'Browser adapter URL allowlist blocks external, credentialed and non-http schemes', async () => { const bad = ['https://example.com', 'http://192.168.1.1', 'https://u:p@localhost', 'javascript:alert(1)', 'data:text/html,x', 'ftp://localhost/a', 'x', 'http://localhost.evil.com', 'http://127.0.0.1.evil.com']; const good2 = ['http://127.0.0.1:3000', 'http://localhost:8080', 'file:///tmp/x.html']; return [bad.every((u) => !permittedUrl(u)) && good2.every(permittedUrl), `${bad.length} blocked, ${good2.length} allowed`]; });
    await run('AS-A13', 'server', 'Report server: auth, read-only, no CORS, bad Host rejected, rate limit, path confined', async () => {
      const token = 'assure-token-0123456789-0123456789'; await writeFile(join(dir, 'assessment.json'), JSON.stringify({ ok: true }));
      const { server, listen } = createReportServer({ dir, token, rateLimit: 8 }); const a = await listen(); const base = `http://127.0.0.1:${a.port}`; const auth = { authorization: `Bearer ${token}` };
      try {
        const r = [(await fetch(base + '/reports')).status, (await fetch(base + '/reports', { headers: { authorization: 'Bearer wrong-token-0123456789-0123456789' } })).status, (await fetch(base + '/reports', { headers: auth })).status, (await fetch(base + '/reports', { method: 'POST', headers: auth })).status, (await fetch(base + '/..%2f..%2fetc/passwd', { headers: auth })).status];
        const cors = (await fetch(base + '/reports', { headers: auth })).headers.get('access-control-allow-origin');
        const http = await import('node:http'); const hostStatus = await new Promise((ok) => { const q = http.request({ host: '127.0.0.1', port: a.port, path: '/health', headers: { ...auth, host: 'evil.example' } }, (x) => { x.resume(); ok(x.statusCode); }); q.end(); });
        let limited = false; for (let i = 0; i < 12; i++) if ((await fetch(base + '/health', { headers: auth })).status === 429) limited = true;
        return [r[0] === 401 && r[1] === 401 && r[2] === 200 && r[3] === 405 && r[4] === 404 && cors === null && hostStatus === 403 && limited, `statuses ${r.join('/')}, host=${hostStatus}, rateLimited=${limited}`];
      } finally { await new Promise((ok) => server.close(ok)); } });
    await run('AS-A14', 'server', 'Server refuses to start with a short token', async () => { try { createReportServer({ dir, token: 'short' }); return [false, 'started']; } catch (e) { return [/24/.test(e.message), 'refused']; } });
    await run('AS-A15', 'installer', 'IDE copier refuses the source repo, unknown hosts, path-like hosts, overwrite without --force; dry-run writes nothing', async () => {
      const t = join(dir, 'proj'); await mkdir(t); let n = 0;
      for (const o of [{ target: root, host: 'claude' }, { target: t, host: 'fake' }, { target: t, host: '../x' }]) { try { await installIde({ repoRoot: root, ...o }); } catch { n++; } }
      const dry = await installIde({ repoRoot: root, target: t, host: 'claude', dryRun: true }); let wrote = true; try { await readFile(join(t, 'accesssutra', 'AGENTS.md')); } catch { wrote = false; }
      await installIde({ repoRoot: root, target: t, host: 'cursor' }); let again = false; try { await installIde({ repoRoot: root, target: t, host: 'cursor' }); } catch { again = true; }
      return [n === 3 && !wrote && dry.dryRun && again, '3 refusals, dry-run wrote nothing, overwrite refused']; });
    await run('AS-A16', 'rules', 'Every rule has WCAG refs array, severity, title and remediation', async () => [Object.values(RULES).every((r) => Array.isArray(r.wcag) && r.severity && r.title && r.fix), `${Object.keys(RULES).length} rules, version ${RULES_VERSION}`]);
  } finally { await rm(dir, { recursive: true, force: true }); }
  return checks;
}

export async function runAssurance({ root, mutations = 600 } = {}) {
  root = resolve(root);
  const checks = await runChecks({ root }); const benchmark = runBenchmark(); const fuzz = runFuzz({ mutations });
  const add = (id, area, title, ok, evidence) => checks.push(rec(id, area, title, ok ? 'pass' : 'fail', evidence));
  add('AS-B01', 'accuracy', 'Gold corpus: no false positives on clean pages', benchmark.rules.every((r) => r.fp === 0), `fp=${benchmark.fp} of ${benchmark.cases} cases`);
  add('AS-B02', 'accuracy', 'Gold corpus: every labelled defect found', benchmark.fn === 0, `fn=${benchmark.fn}`);
  add('AS-B03', 'accuracy', 'Gold corpus: exact-match rate 100%', benchmark.exactMatch === benchmark.cases, `${benchmark.exactMatch}/${benchmark.cases}`);
  add('AS-F01', 'robustness', 'Fuzzing: no unexpected exception or invalid output', fuzz.unexpected === 0, `${fuzz.cases} inputs, ${fuzz.returned} scanned, ${fuzz.limitErrors} documented-limit refusals, ${fuzz.unexpected} unexpected`);
  add('AS-F02', 'robustness', 'Fuzzing: slowest input under 5 s', fuzz.maxMs < 5000, `max ${fuzz.maxMs} ms`);
  const count = (s) => checks.filter((c) => c.status === s).length;
  const failed = count('fail');
  const report = { schema: ASSURANCE_SCHEMA, product: 'AccessSutra AI', toolVersion: VERSION, rulesVersion: RULES_VERSION, generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: `${process.platform}/${process.arch}`, os: `${os.type()} ${os.release()}` },
    nature: 'Automated self-assurance run by the tool on its own code. It is NOT a third-party audit, WCAG conformance assessment, or legal opinion.',
    verdict: failed ? 'ASSURANCE_CHECKS_FAILED' : 'ASSURANCE_CHECKS_PASSED_HUMAN_REVIEW_STILL_REQUIRED',
    summary: { total: checks.length, passed: count('pass'), failed, skipped: count('skipped') }, checks, benchmark, fuzz,
    limitations: ['Self-authored gold corpus: results show consistency with the maintainer\'s labels, not real-world accuracy.', 'Static heuristics only: no rendering, CSS, JavaScript, focus, contrast, zoom, screen reader or task testing.', 'Optional Playwright/axe adapter is exercised only for its URL guard here; browser execution is reported separately when run.', 'The seal detects edits; it is not a digital signature or timestamp proof.', 'A passing run does not mean any page is accessible.'] };
  report.seal = { algorithm: 'sha256-canonical-json', sha256: sealOf(report), note: 'Detects edits; not a digital signature.' };
  return report;
}

const pct = (x) => (x === null ? 'n/a' : (x * 100).toFixed(1) + '%');
export function assuranceMarkdown(a) {
  const s = a.summary, b = a.benchmark;
  const o = [`# AccessSutra AI — Assurance Report`, '', `**Verdict:** \`${a.verdict}\``, '', `> ${a.nature}`, '', `Tool ${a.toolVersion} · rules ${a.rulesVersion} · ${a.generatedAt} · Node ${a.environment.node} · ${a.environment.platform}`, '',
    `## Summary`, '', `- Checks: **${s.total}** — ${s.passed} passed, ${s.failed} failed, ${s.skipped} skipped`, `- Gold corpus: ${b.cases} cases, exact match ${b.exactMatch}/${b.cases}, precision ${pct(b.precision)}, recall ${pct(b.recall)} (${b.labelling})`, `- Fuzzing: ${a.fuzz.cases} hostile inputs (seed ${a.fuzz.seed}), ${a.fuzz.unexpected} unexpected exceptions, slowest ${a.fuzz.maxMs} ms`, '',
    '## Checks', '', '| ID | Area | Check | Result | Evidence |', '|---|---|---|---|---|', ...a.checks.map((c) => `| ${c.id} | ${c.area} | ${c.title} | **${c.status}** | ${String(c.evidence).replace(/\|/g, '\\|')} |`), '',
    '## Per-rule accuracy on the gold corpus', '', '| Rule | TP | FP | FN | Precision | Recall |', '|---|---|---|---|---|---|', ...b.rules.map((r) => `| ${r.ruleId} | ${r.tp} | ${r.fp} | ${r.fn} | ${pct(r.precision)} | ${pct(r.recall)} |`), ''];
  if (b.misses.length) o.push('### Mismatches', '', ...b.misses.map((m) => `- ${m.case}: expected ${m.expected.join(', ') || 'none'}, got ${m.got.join(', ') || 'none'}`), '');
  o.push('## Limitations', '', ...a.limitations.map((l) => `- ${l}`), '', '## Integrity', '', `Seal SHA-256 (canonical JSON): \`${a.seal.sha256}\`. Verify with \`accesssutra verify --report assurance-report.json\`. ${a.seal.note}`, '');
  return o.join('\n');
}
export function assuranceHtml(a) {
  const s = a.summary, b = a.benchmark; const bad = a.verdict === 'ASSURANCE_CHECKS_FAILED';
  const rows = a.checks.map((c) => `<tr><td>${esc(c.id)}</td><td>${esc(c.area)}</td><td>${esc(c.title)}</td><td class="${c.status === 'pass' ? 'pass' : c.status === 'fail' ? 'serious' : 'moderate'}"><strong>${esc(c.status)}</strong></td><td>${esc(c.evidence)}</td></tr>`).join('');
  const rrows = b.rules.map((r) => `<tr><td><code>${esc(r.ruleId)}</code></td><td>${r.tp}</td><td>${r.fp}</td><td>${r.fn}</td><td>${pct(r.precision)}</td><td>${pct(r.recall)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>AccessSutra AI — Assurance report</title><style>${CSS}</style></head><body><main><header class="hero"><h1>AccessSutra AI — Assurance Report</h1><p><span class="badge ${bad ? 'serious' : 'pass'}">${esc(a.verdict)}</span></p><p>Tool ${esc(a.toolVersion)} · rules ${esc(a.rulesVersion)} · ${esc(a.generatedAt)} · Node ${esc(a.environment.node)} · ${esc(a.environment.platform)}</p></header><p class="notice" role="note"><strong>What this is:</strong> ${esc(a.nature)}</p><section class="stats" aria-label="Summary"><div class="stat"><b>${s.passed}/${s.total}</b><span>checks passed</span></div><div class="stat"><b>${s.failed}</b><span>failed</span></div><div class="stat"><b>${s.skipped}</b><span>skipped</span></div><div class="stat"><b>${pct(b.precision)}</b><span>precision (gold corpus)</span></div><div class="stat"><b>${pct(b.recall)}</b><span>recall (gold corpus)</span></div><div class="stat"><b>${a.fuzz.cases}</b><span>fuzz inputs, ${a.fuzz.unexpected} unexpected</span></div></section><h2>Checks</h2><div class="scroll"><table><thead><tr><th scope="col">ID</th><th scope="col">Area</th><th scope="col">Check</th><th scope="col">Result</th><th scope="col">Evidence</th></tr></thead><tbody>${rows}</tbody></table></div><h2>Per-rule accuracy</h2><p>${b.cases} hand-labelled cases; exact match ${b.exactMatch}/${b.cases}. ${esc(b.labelling)}.</p><div class="scroll"><table><thead><tr><th scope="col">Rule</th><th scope="col">TP</th><th scope="col">FP</th><th scope="col">FN</th><th scope="col">Precision</th><th scope="col">Recall</th></tr></thead><tbody>${rrows}</tbody></table></div><h2>Limitations</h2><ul>${a.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><footer>Seal SHA-256 (canonical JSON): <code>${esc(a.seal.sha256)}</code>. ${esc(a.seal.note)}</footer></main></body></html>`;
}
