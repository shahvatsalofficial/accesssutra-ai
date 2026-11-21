#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanHtmlFile, RULES } from '../core/checks.mjs';
import { createManualPlan, applyObservations } from '../core/manual.mjs';
import { composeReport, toMarkdown, toHtml, verifySeal } from '../core/report.mjs';
import { appendAudit, verifyLedger } from '../core/audit.mjs';
import { runAssurance, assuranceMarkdown, assuranceHtml } from '../core/assure.mjs';
import { installIde, supportedHosts } from '../core/installer.mjs';
import { VERSION } from '../core/version.mjs';
import { browserAudit } from '../browser/runner.mjs';
import { createReportServer } from '../server/server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (args, key, fallback) => { const i = args.indexOf(key); return i >= 0 ? args[i + 1] : fallback; };
const required = (args, key) => { const v = arg(args, key); if (!v || v.startsWith('--')) throw new Error(`Required ${key}`); return v; };
async function json(path) { try { return JSON.parse(await readFile(path, 'utf8')); } catch (e) { throw new Error(`Cannot read JSON ${path}: ${e.code ?? e.message}`); } }
async function save(path, content) { await mkdir(dirname(resolve(path)), { recursive: true }); await writeFile(path, typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n'); }
const RANK = { minor: 0, moderate: 1, serious: 2, critical: 3 };

export const help = `AccessSutra AI ${VERSION} — evidence-based accessibility tasks (not certification)
  version | doctor | rules
  scan --input <local.html> --out <scan.json> [--fail-on minor|moderate|serious|critical]
  manual --task <task.json> --out <manual.json> [--observations <reviewer.json>]
  report --scan <scan.json> [--manual <manual.json>] [--browser <browser.json>] --out <directory>   (JSON + Markdown + HTML)
  browser --url <file-or-loopback-url> --out <browser.json> [--tabs 15] [--no-axe]
  audit --out <directory> [--quiet] [--mutations 600]      assurance report (JSON + Markdown + HTML), exit 2 on failure
  verify --report <report.json>                             check the SHA-256 seal of a report or assurance report
  audit append --file <audit.jsonl> --type <event> | audit verify --file <audit.jsonl>
  install-ide --target <other-project> --host <${supportedHosts().join('|')}> [--force] [--dry-run]
  serve --dir <report-directory> [--port 8787]   (ACCESS_SUTRA_TOKEN env, >=24 chars)
  demo [--out <directory>]
No cloud key, external URL scanning, production form submission or global installation.`;

export async function main(args = process.argv.slice(2)) {
  const [cmd, ...rest] = args;
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { console.log(help); return 0; }
  if (cmd === 'version' || cmd === '--version' || cmd === '-v') { console.log(VERSION); return 0; }
  if (cmd === 'doctor') { console.log(JSON.stringify({ version: VERSION, node: process.version, platform: process.platform, core: 'offline/no runtime dependencies', browserAdapter: 'optional; not assumed installed', server: 'loopback read-only', disclaimer: 'Not WCAG certification' }, null, 2)); return 0; }
  if (cmd === 'rules') { for (const [id, r] of Object.entries(RULES)) console.log(`${id}  ${r.severity.padEnd(8)} WCAG ${r.wcag.join(',') || '-'}  ${r.title}`); return 0; }
  if (cmd === 'scan') {
    const report = await scanHtmlFile(required(rest, '--input')); await save(required(rest, '--out'), report);
    console.log(`Limited scan: ${report.summary.total} findings (${report.summary.requiresReview} human-review); no conformance claim`);
    const gate = arg(rest, '--fail-on');
    if (gate !== undefined) { if (!(gate in RANK)) throw new Error('--fail-on needs minor, moderate, serious or critical'); if (report.findings.some((f) => RANK[f.severity] >= RANK[gate])) { console.error(`Gate failed: finding(s) at ${gate} or above`); return 3; } }
    return 0;
  }
  if (cmd === 'manual') { let plan = createManualPlan(await json(required(rest, '--task'))); if (rest.includes('--observations')) plan = applyObservations(plan, await json(required(rest, '--observations'))); await save(required(rest, '--out'), plan); console.log(`Manual plan: ${plan.checks.length} checks; ${plan.completion.status}`); return 0; }
  if (cmd === 'report') {
    const report = composeReport(await json(required(rest, '--scan')), rest.includes('--manual') ? await json(required(rest, '--manual')) : null, rest.includes('--browser') ? await json(required(rest, '--browser')) : null);
    const out = required(rest, '--out'); await save(join(out, 'assessment.json'), report); await save(join(out, 'assessment.md'), toMarkdown(report)); await save(join(out, 'assessment.html'), toHtml(report));
    console.log(`Wrote JSON, Markdown and HTML to ${out}`); return 0;
  }
  if (cmd === 'browser') { const run = await browserAudit(required(rest, '--url'), { tabs: Number(arg(rest, '--tabs', '15')), axe: !rest.includes('--no-axe') }); await save(required(rest, '--out'), run); console.log(`Browser observation: ${run.focus.length} Tab samples`); return 0; }
  if (cmd === 'audit' && rest[0] === 'append') { const e = await appendAudit(required(rest, '--file'), required(rest, '--type'), { actor: 'local-cli' }); console.log(`Audit event ${e.seq} recorded`); return 0; }
  if (cmd === 'audit' && rest[0] === 'verify') { const s = verifyLedger(await readFile(required(rest, '--file'), 'utf8')); console.log(JSON.stringify(s)); return s.valid ? 0 : 2; }
  if (cmd === 'audit') {
    const out = required(rest, '--out'); const mutations = Number(arg(rest, '--mutations', '600'));
    if (!Number.isInteger(mutations) || mutations < 0 || mutations > 20000) throw new Error('--mutations must be 0-20000');
    const a = await runAssurance({ root: ROOT, mutations });
    await save(join(out, 'assurance-report.json'), a); await save(join(out, 'assurance-report.md'), assuranceMarkdown(a)); await save(join(out, 'assurance-report.html'), assuranceHtml(a));
    if (!rest.includes('--quiet')) console.log(`${a.verdict}: ${a.summary.passed}/${a.summary.total} passed, ${a.summary.failed} failed, ${a.summary.skipped} skipped; reports in ${out}`);
    return a.summary.failed ? 2 : 0;
  }
  if (cmd === 'verify') { const s = verifySeal(await json(required(rest, '--report'))); console.log(JSON.stringify(s)); return s.valid ? 0 : 2; }
  if (cmd === 'install-ide') { const result = await installIde({ repoRoot: ROOT, target: required(rest, '--target'), host: required(rest, '--host'), force: rest.includes('--force'), dryRun: rest.includes('--dry-run') }); console.log(JSON.stringify(result, null, 2)); return 0; }
  if (cmd === 'serve') {
    const port = Number(arg(rest, '--port', '8787')); if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
    const { listen } = createReportServer({ dir: required(rest, '--dir'), token: process.env.ACCESS_SUTRA_TOKEN, port });
    const a = await listen(); console.log(`AccessSutra read-only report server: http://127.0.0.1:${a.port} (Bearer auth)`); return await new Promise(() => {});
  }
  if (cmd === 'demo') {
    const out = resolve(arg(rest, '--out', 'accesssutra-demo')); const scan = await scanHtmlFile(join(ROOT, 'fixtures', 'signup-broken.html')); const manual = createManualPlan(await json(join(ROOT, 'fixtures', 'signup-task.json'))); const report = composeReport(scan, manual);
    await save(join(out, 'scan.json'), scan); await save(join(out, 'manual-plan.json'), manual); await save(join(out, 'assessment.json'), report); await save(join(out, 'assessment.md'), toMarkdown(report)); await save(join(out, 'assessment.html'), toHtml(report));
    console.log(`Demo: ${scan.summary.total} limited findings; manual ${manual.completion.status}; reports in ${out}`); return 0;
  }
  throw new Error('Unknown command ' + cmd + '\n' + help);
}
const isEntry = () => { try { return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } };
if (isEntry()) { // realpath: npm bin shims are symlinks on Linux/macOS
  main().then((code) => { process.exitCode = code; }).catch((e) => { console.error('AccessSutra:', e.message); process.exitCode = 1; });
}
