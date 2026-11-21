import { createHash } from 'node:crypto';
import { DISCLAIMER } from './checks.mjs';
import { VERSION } from './version.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');
/** Canonical JSON with sorted keys, so the seal does not depend on property order. */
export function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v) ?? 'null';
}
export const sealOf = (obj) => { const { seal, ...body } = obj; return sha(canonical(body)); };
export function verifySeal(obj) {
  if (!obj || typeof obj !== 'object' || !obj.seal) return { valid: false, reason: 'No seal present' };
  const actual = sealOf(obj);
  return actual === obj.seal.sha256 ? { valid: true, sha256: actual, note: 'Seal detects edits; it is not a digital signature.' } : { valid: false, reason: 'Content does not match sealed digest' };
}

export function composeReport(scan, manual = null, browser = null) {
  if (!scan?.findings || !scan?.scope?.sha256) throw new Error('Valid scan required');
  const report = { schemaVersion: '1.0.0', product: 'AccessSutra AI', toolVersion: VERSION, source: scan.scope, summary: scan.summary, findings: scan.findings,
    manual: manual ?? { status: 'not-run', message: 'No manual review evidence attached' },
    browser: browser ?? { status: 'not-run', message: 'No Playwright/axe browser run attached' },
    requiredHumanChecks: scan.untested, limitations: scan.limitations, disclaimer: DISCLAIMER };
  report.seal = { algorithm: 'sha256-canonical-json', sha256: sealOf(report), note: 'Detects edits; not a digital signature.' };
  return report;
}

const mdSafe = (s) => String(s ?? '').replace(/[\\&<>`*_[\]()|#~\r\n]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '`': '&#96;', '\r': ' ', '\n': ' ' }[ch] ?? '\\' + ch));
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const manualStatus = (r) => r.manual.completion?.status ?? r.manual.status ?? 'not-run';

export function toMarkdown(report) {
  const sev = report.summary.bySeverity ?? {};
  const out = ['# AccessSutra AI — Scoped Accessibility Evidence', '',
    `Source: ${mdSafe(report.source.source)} · SHA-256: \`${report.source.sha256}\` · Tool ${report.toolVersion ?? ''}`, '',
    `Limited findings: **${report.summary.total}** (${report.summary.detected} detected, ${report.summary.requiresReview} requiring review). Serious: ${sev.serious ?? 0}, moderate: ${sev.moderate ?? 0}, minor: ${sev.minor ?? 0}, critical: ${sev.critical ?? 0}.`, '',
    `**Not a certification:** ${DISCLAIMER}`, '', '## Findings', ''];
  if (!report.findings.length) out.push('No findings from this limited scanner. This does not mean the page is accessible.', '');
  for (const f of report.findings) out.push(`### ${f.id} — ${mdSafe(f.title)}`, `- Rule: ${f.ruleId}; kind: ${f.kind}; severity: ${f.severity}; candidate WCAG references: ${f.wcagCandidateRefs.join(', ') || 'none'}`, `- Source: ${mdSafe(f.source.file)}:${f.source.line} — \`${f.source.selector}\``, `- Reproduce: ${mdSafe(f.reproduce)}`, `- Recommendation: ${mdSafe(f.remediation)}`, '');
  out.push('## Manual review', `Status: ${manualStatus(report)}`, '');
  for (const c of report.manual.checks ?? []) out.push(`- ${mdSafe(c.title)}: **${c.status}**${c.observation ? ` — ${mdSafe(c.observation)} (reviewer: ${mdSafe(c.reviewer)})` : ''}`);
  out.push('', '## Browser checks', `Status: ${mdSafe(report.browser.status)}`, '', '## Checks not covered', ...report.requiredHumanChecks.map((s) => `- ${s}`), '', '## Limitations', ...report.limitations.map((s) => `- ${s}`), '',
    '## Integrity', `Seal (SHA-256 of canonical JSON): \`${report.seal?.sha256 ?? 'none'}\`. Detects edits; not a digital signature.`);
  return out.join('\n') + '\n';
}

export const CSS = `:root{--bg:#f6f8fb;--card:#fff;--ink:#14202b;--mute:#4b5b68;--line:#d3dce4;--brand:#1f4fb2;--brand2:#e8eefb;--bad:#b3261e;--warn:#8a5300;--ok:#0f6b4f;--code:#eef2f6}
@media(prefers-color-scheme:dark){:root{--bg:#0e141b;--card:#151d27;--ink:#e8eef4;--mute:#a8b8c6;--line:#2a3846;--brand:#8db4ff;--brand2:#1a2a45;--bad:#ff8f87;--warn:#f0b254;--ok:#4cd6a3;--code:#1b2733}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1000px;margin:auto;padding:1.5rem 1rem 4rem}a{color:var(--brand)}a:focus-visible,summary:focus-visible{outline:3px solid var(--brand);outline-offset:2px}
h1{font-size:1.9rem;line-height:1.2;margin:.2rem 0}h2{margin-top:2.2rem;padding-bottom:.3rem;border-bottom:1px solid var(--line)}
.hero{background:linear-gradient(135deg,var(--brand2),var(--card));border:1px solid var(--line);border-radius:16px;padding:1.5rem}
.notice{border-left:4px solid var(--warn);padding:.7rem 1rem;background:var(--card);border-radius:0 8px 8px 0;margin:1rem 0}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin:1rem 0}.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:.8rem 1rem}.stat b{display:block;font-size:1.7rem;line-height:1.1}.stat span{color:var(--mute);font-size:.88rem}
.badge{display:inline-block;border:1px solid currentColor;border-radius:99px;padding:0 .6rem;font-size:.8rem;font-weight:600}.serious,.critical{color:var(--bad)}.moderate{color:var(--warn)}.minor,.pass,.ok{color:var(--ok)}
.finding{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem 1.2rem;margin:.8rem 0}.finding h3{margin:.1rem 0 .4rem;font-size:1.05rem}.finding dl{display:grid;grid-template-columns:9rem 1fr;gap:.2rem .8rem;margin:.4rem 0}.finding dt{color:var(--mute)}.finding dd{margin:0;overflow-wrap:anywhere}
code{background:var(--code);padding:.05rem .35rem;border-radius:5px;font:.9em ui-monospace,Consolas,monospace;overflow-wrap:anywhere}
table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border:1px solid var(--line);text-align:left;padding:.5rem .7rem;vertical-align:top}th{background:var(--brand2)}.scroll{overflow-x:auto}
footer{color:var(--mute);font-size:.85rem;margin-top:3rem}@media print{body{background:#fff;color:#000}.finding{break-inside:avoid}}`;

export function toHtml(report) {
  const sev = report.summary.bySeverity ?? {};
  const findings = report.findings.map((f) => `<article class="finding" id="${esc(f.id)}"><h3>${esc(f.title)} <span class="badge ${esc(f.severity)}">${esc(f.severity)}</span> <span class="badge">${esc(f.kind)}</span></h3><dl><dt>Finding</dt><dd><code>${esc(f.id)}</code> · rule <code>${esc(f.ruleId)}</code></dd><dt>Location</dt><dd>${esc(f.source.file)}:${esc(f.source.line)} — <code>${esc(f.source.selector)}</code></dd><dt>Candidate WCAG</dt><dd>${esc(f.wcagCandidateRefs.join(', ') || 'none')}</dd><dt>Confidence</dt><dd>${esc(f.confidence)}</dd><dt>Reproduce</dt><dd>${esc(f.reproduce)}</dd><dt>Recommended action</dt><dd>${esc(f.remediation)}</dd></dl></article>`).join('');
  const checks = (report.manual.checks ?? []).map((c) => `<tr><td>${esc(c.title)}</td><td>${esc(c.status)}</td><td>${esc(c.reviewer ?? '')}</td><td>${esc(c.observation ?? '')}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>AccessSutra AI — Evidence report</title><style>${CSS}</style></head><body><main><header class="hero"><h1>AccessSutra AI — Accessibility Evidence</h1><p>Source <code>${esc(report.source.source)}</code> · SHA-256 <code>${esc(report.source.sha256)}</code> · tool ${esc(report.toolVersion ?? '')}</p></header><p class="notice" role="note"><strong>Scope limitation:</strong> ${esc(DISCLAIMER)}</p><section aria-label="Summary" class="stats"><div class="stat"><b>${esc(report.summary.total)}</b><span>limited findings</span></div><div class="stat"><b>${esc(sev.serious ?? 0)}</b><span>serious</span></div><div class="stat"><b>${esc(sev.moderate ?? 0)}</b><span>moderate</span></div><div class="stat"><b>${esc(report.summary.requiresReview)}</b><span>need human review</span></div><div class="stat"><b>${esc(manualStatus(report))}</b><span>manual review status</span></div></section><h2>Findings</h2>${findings || '<p>No findings from this limited scan; accessibility remains unverified.</p>'}<h2>Human review</h2><p>Status: ${esc(manualStatus(report))}</p>${checks ? `<div class="scroll"><table><thead><tr><th scope="col">Check</th><th scope="col">Status</th><th scope="col">Reviewer</th><th scope="col">Observation</th></tr></thead><tbody>${checks}</tbody></table></div>` : ''}<h2>Browser testing</h2><p>${esc(report.browser.status)}</p><h2>Not covered</h2><ul>${report.requiredHumanChecks.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><h2>Limitations</h2><ul>${report.limitations.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><footer>Seal (SHA-256 of canonical JSON): <code>${esc(report.seal?.sha256 ?? 'none')}</code>. Detects edits; not a digital signature.</footer></main></body></html>`;
}
