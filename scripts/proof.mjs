#!/usr/bin/env node
// Regenerates docs/proof/: raw TAP log, environment, benchmark, fuzz, CLI transcripts, a sample assurance report, SHA256SUMS.
// Everything is machine output from this host. browser-*.json are kept as recorded (they need Playwright; see docs/proof/README.md).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runAssurance, assuranceMarkdown, assuranceHtml, runBenchmark, runFuzz } from '../packages/core/assure.mjs';
import { RULES } from '../packages/core/checks.mjs';
import { VERSION } from '../packages/core/version.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'proof');
fs.mkdirSync(OUT, { recursive: true });
for (const e of fs.readdirSync(OUT)) { if (!e.startsWith('browser-')) fs.rmSync(path.join(OUT, e), { recursive: true, force: true }); }
const cli = path.join(ROOT, 'packages/cli/accesssutra.mjs');
const sha = (b) => createHash('sha256').update(b).digest('hex');

const testFiles = fs.readdirSync(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => path.join('tests', f));
const t = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...testFiles], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
fs.writeFileSync(path.join(OUT, 'test-run.tap'), t.stdout);
const num = (k) => Number(new RegExp(`^# ${k} (\\d+)`, 'm').exec(t.stdout)?.[1] ?? NaN);
const tests = num('tests'), pass = num('pass'), fail = num('fail'), skipped = num('skipped');

const bench = runBenchmark(); const fuzz = runFuzz({ mutations: 2000 });
fs.writeFileSync(path.join(OUT, 'benchmark.json'), JSON.stringify(bench, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'fuzz-results.json'), JSON.stringify(fuzz, null, 2) + '\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'accesssutra-proof-'));
const clean = (s) => s.replaceAll(tmp, '<tmp>').replaceAll(ROOT, '.');
const sh = (name, args) => {
  const r = spawnSync(process.execPath, [cli, ...args], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ACCESS_SUTRA_TOKEN: '' } });
  fs.writeFileSync(path.join(OUT, `cli-${name}.txt`), `$ accesssutra ${clean(args.join(' '))}\n${clean(r.stdout)}${r.stderr ? '\n[stderr]\n' + clean(r.stderr) : ''}\n[exit ${r.status}]\n`);
  return r;
};
sh('version', ['version']); sh('doctor', ['doctor']); sh('rules', ['rules']);
sh('scan-broken', ['scan', '--input', 'fixtures/signup-broken.html', '--out', path.join(tmp, 'scan.json')]);
sh('scan-fail-on-serious', ['scan', '--input', 'fixtures/signup-broken.html', '--out', path.join(tmp, 'scan2.json'), '--fail-on', 'serious']);
sh('scan-good', ['scan', '--input', 'fixtures/signup-good.html', '--out', path.join(tmp, 'scan3.json'), '--fail-on', 'minor']);
sh('manual', ['manual', '--task', 'fixtures/signup-task.json', '--out', path.join(tmp, 'manual.json')]);
sh('report', ['report', '--scan', path.join(tmp, 'scan.json'), '--manual', path.join(tmp, 'manual.json'), '--out', path.join(tmp, 'report')]);
sh('verify-report', ['verify', '--report', path.join(tmp, 'report', 'assessment.json')]);
sh('install-dry-run', ['install-ide', '--target', path.join(tmp, 'proj'), '--host', 'cursor', '--dry-run']);
sh('refusal-missing-input', ['scan', '--input']);
sh('refusal-unknown-host', ['install-ide', '--target', path.join(tmp, 'p2'), '--host', '../x']);
sh('refusal-external-browser', ['browser', '--url', 'https://example.com', '--out', path.join(tmp, 'b.json')]);
sh('refusal-short-token', ['serve', '--dir', 'examples/reports/demo']);
fs.rmSync(tmp, { recursive: true, force: true });

const a = await runAssurance({ root: ROOT, mutations: 2000 });
const sample = path.join(OUT, 'assurance-sample'); fs.mkdirSync(sample, { recursive: true });
fs.writeFileSync(path.join(sample, 'assurance-report.json'), JSON.stringify(a, null, 2) + '\n');
fs.writeFileSync(path.join(sample, 'assurance-report.md'), assuranceMarkdown(a));
fs.writeFileSync(path.join(sample, 'assurance-report.html'), assuranceHtml(a));

const cross = [];
for (const [name, file] of [['signup-broken', 'browser-signup-broken.json'], ['signup-good', 'browser-signup-good.json']]) {
  const p = path.join(OUT, file); if (!fs.existsSync(p)) continue;
  const b = JSON.parse(fs.readFileSync(p, 'utf8'));
  cross.push({ fixture: name, axeViolations: b.axe.violations.map((v) => ({ ruleId: v.ruleId, impact: v.impact, nodes: v.affectedNodes })), axePassedRules: b.axe.passedRuleCount, browser: b.browser, browserVersion: b.version, tabSamples: b.focus.length });
}
fs.writeFileSync(path.join(OUT, 'axe-crosscheck.json'), JSON.stringify(cross, null, 2) + '\n');

const env = { version: VERSION, node: process.version, platform: `${process.platform}/${process.arch}`, os: `${os.type()} ${os.release()}`, recordedAt: new Date().toISOString(), tests, pass, fail, skipped, assuranceChecks: a.summary.total, assurancePassed: a.summary.passed, assuranceFailed: a.summary.failed, assuranceSkipped: a.summary.skipped, verdict: a.verdict, corpusCases: bench.cases, precision: bench.precision, recall: bench.recall, fuzzInputs: fuzz.cases, fuzzUnexpected: fuzz.unexpected, fuzzMaxMs: fuzz.maxMs, rules: Object.keys(RULES).length };
fs.writeFileSync(path.join(OUT, 'environment.json'), JSON.stringify(env, null, 2) + '\n');

const sums = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name !== 'SHA256SUMS.txt') sums.push(`${sha(fs.readFileSync(p))}  ${path.relative(OUT, p).split(path.sep).join('/')}`); } };
const readme = `# Proof artifacts

Machine-generated by \`npm run proof\` on ${env.recordedAt} (Node ${env.node}, ${env.platform}). Not hand-edited.

| File | What it is |
|---|---|
| test-run.tap | Raw TAP log: ${tests} tests, ${pass} passed, ${fail} failed, ${skipped} skipped |
| benchmark.json | ${bench.cases}-case gold corpus: precision ${bench.precision}, recall ${bench.recall} (self-authored labels) |
| fuzz-results.json | ${fuzz.cases} hostile inputs, ${fuzz.unexpected} unexpected exceptions, slowest ${fuzz.maxMs} ms |
| assurance-sample/ | Sealed assurance report in JSON, Markdown and HTML |
| browser-*.json | Real Playwright + axe-core runs on the two fixtures (recorded once with Playwright 1.49.1, @axe-core/playwright 4.10.0, Chromium 131) |
| axe-crosscheck.json | Summary of those axe-core runs |
| cli-*.txt | Real stdout/stderr/exit codes, including refusals |
| environment.json | Versions and counts |
| SHA256SUMS.txt | Digests of every file (detects change; not a signature) |

Verify: \`sha256sum -c SHA256SUMS.txt\` here, and \`accesssutra verify --report assurance-sample/assurance-report.json\`.

These results show the code behaved as listed on this host. They do not show that any page is accessible, WCAG conformance, legal compliance, or behavior on other hosts.
`;
fs.writeFileSync(path.join(OUT, 'README.md'), readme);
walk(OUT);
fs.writeFileSync(path.join(OUT, 'SHA256SUMS.txt'), sums.sort((x, y) => x.split('  ')[1].localeCompare(y.split('  ')[1])).join('\n') + '\n');
console.log(JSON.stringify(env, null, 2));
if (fail || a.summary.failed || fuzz.unexpected) process.exitCode = 2;
