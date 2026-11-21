import { createHash } from 'node:crypto';
import { readFile, lstat } from 'node:fs/promises';
import { basename } from 'node:path';
import { parseHtml, hasMeaningfulName, selectorOf, hasAttr, isHiddenTree, nodeById, labelsFor, textOf, MAX_HTML_BYTES } from './html.mjs';
import { VERSION } from './version.mjs';

export const DISCLAIMER = 'AccessSutra reports limited checks and human testing tasks; they do not establish WCAG conformance, certification, legal compliance, or usability for every person.';
export const RULES_VERSION = '2.0.0';
export const RULES = Object.freeze({
  'AS-DOC-001': { wcag: ['2.4.2'], severity: 'moderate', title: 'Page title is missing', fix: 'Add a concise, descriptive <title> in <head>.' },
  'AS-DOC-002': { wcag: ['3.1.1'], severity: 'moderate', title: 'Document language is missing', fix: 'Set an appropriate nonempty lang attribute on <html>.' },
  'AS-DOC-003': { wcag: ['3.1.1'], severity: 'moderate', title: 'Document language code looks malformed', fix: 'Use a valid BCP 47 language tag such as "en" or "pt-BR".' },
  'AS-FORM-001': { wcag: ['3.3.2', '4.1.2'], severity: 'serious', title: 'Form control lacks a detectable accessible name', fix: 'Use an associated visible <label>, or an appropriate accessible name where necessary.' },
  'AS-FORM-002': { wcag: ['3.3.1', '3.3.3'], severity: 'moderate', title: 'Invalid form control lacks a detectable error association', fix: 'Associate clear error text using aria-describedby or aria-errormessage and verify the message is announced.' },
  'AS-FORM-003': { wcag: ['1.3.1', '3.3.2'], severity: 'moderate', title: 'Label "for" does not point to an existing element', fix: 'Point label for= at the id of the control it describes, or wrap the control in the label.' },
  'AS-IMG-001': { wcag: ['1.1.1'], severity: 'serious', title: 'Image is missing alt attribute', fix: 'Provide an appropriate alt text, or alt="" for genuinely decorative imagery.' },
  'AS-BTN-001': { wcag: ['4.1.2'], severity: 'serious', title: 'Button lacks a detectable accessible name', fix: 'Add visible button text or an appropriate accessible name.' },
  'AS-LINK-001': { wcag: ['2.4.4', '4.1.2'], severity: 'serious', title: 'Link lacks a detectable accessible name', fix: 'Give the link descriptive text or an appropriate accessible name.' },
  'AS-FRAME-001': { wcag: ['2.4.1', '4.1.2'], severity: 'moderate', title: 'Frame lacks a title', fix: 'Give each iframe a short, descriptive title attribute.' },
  'AS-ID-001': { wcag: [], severity: 'moderate', title: 'Duplicate id may break references', fix: 'Give each element a unique id and retest labels and ARIA relationships.' },
  'AS-ARIA-001': { wcag: ['4.1.2'], severity: 'moderate', title: 'ARIA reference does not resolve to an element', fix: 'Point ARIA ID references to existing elements and verify accessible name/description.' },
  'AS-ARIA-002': { wcag: ['4.1.2', '2.4.3'], severity: 'serious', title: 'Focusable element is inside aria-hidden or hidden content', fix: 'Remove focusable controls from hidden subtrees, or stop hiding them; verify with a keyboard.' },
  'AS-FOCUS-001': { wcag: ['2.4.3'], severity: 'moderate', title: 'Positive tabindex may disrupt focus order', fix: 'Prefer DOM order and tabindex="0" where needed; verify real keyboard navigation.' },
  'AS-KEY-001': { wcag: ['2.1.1'], severity: 'moderate', title: 'Clickable nonsemantic element needs keyboard review', fix: 'Use a native button or link; manually verify keyboard activation and focus.' },
  'AS-VIEW-001': { wcag: ['1.4.4'], severity: 'serious', title: 'Viewport meta may block zoom', fix: 'Remove user-scalable=no and any maximum-scale below 2; verify text resize and pinch zoom.' },
  'AS-MEDIA-001': { wcag: ['1.4.2', '2.2.2'], severity: 'moderate', title: 'Autoplaying media without controls needs review', fix: 'Avoid autoplay, or provide visible controls to pause, stop or mute; verify with people.' },
  'AS-REFRESH-001': { wcag: ['2.2.1', '3.2.5'], severity: 'moderate', title: 'Meta refresh may remove user control of timing', fix: 'Remove timed refresh/redirect or give users a way to turn off, adjust or extend it.' }
});

const hex = (x) => createHash('sha256').update(x).digest('hex');
const FOCUSABLE_TAGS = new Set(['button', 'select', 'textarea']);
const LANG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const isFocusable = (n) => {
  const a = n.attrs;
  if (a.tabindex !== undefined && /^-?\d+$/.test(a.tabindex.trim())) return Number(a.tabindex) >= 0;
  if (n.tag === 'a') return hasAttr(n, 'href');
  if (n.tag === 'input') return (a.type || '').toLowerCase() !== 'hidden' && !hasAttr(n, 'disabled');
  return FOCUSABLE_TAGS.has(n.tag) && !hasAttr(n, 'disabled');
};

export function scanHtml(html, { source = 'input.html', engine = 'limited-static-html' } = {}) {
  const { nodes } = parseHtml(html);
  const findings = [], seen = new Set();
  const emit = (ruleId, node, { kind = 'detected', detail = '' } = {}) => {
    const rule = RULES[ruleId]; const selector = node ? selectorOf(node) : 'document';
    const id = `AS-${hex([source, ruleId, selector].join('|')).slice(0, 16)}`;
    if (seen.has(id)) return; seen.add(id);
    findings.push({ id, ruleId, title: rule.title, severity: rule.severity, kind,
      priorityBasis: 'Rule severity heuristic only; actual task impact requires human review',
      confidence: kind === 'detected' ? 'limited-static-evidence' : 'requires-human-verification',
      wcagCandidateRefs: rule.wcag, source: { file: basename(source), line: node?.line ?? 1, selector },
      detail, remediation: rule.fix,
      reproduce: `Inspect ${basename(source)} line ${node?.line ?? 1}, ${selector}; confirm in a rendered browser and with affected users.` });
  };
  const htmlNode = nodes.find((n) => n.tag === 'html');
  const lang = (htmlNode?.attrs.lang || '').trim();
  if (!lang) emit('AS-DOC-002', htmlNode);
  else if (!LANG.test(lang)) emit('AS-DOC-003', htmlNode);
  if (!nodes.some((n) => n.tag === 'title' && n.text.trim())) emit('AS-DOC-001', null);
  const ids = new Map();
  for (const n of nodes) { if (n.attrs.id) { if (ids.has(n.attrs.id)) emit('AS-ID-001', n); else ids.set(n.attrs.id, n); } }
  for (const n of nodes) {
    const a = n.attrs, hidden = isHiddenTree(n), focusable = isFocusable(n);
    if (hidden && focusable) emit('AS-ARIA-002', n);
    if (!hidden) {
      if (['input', 'select', 'textarea'].includes(n.tag) && !['hidden', 'submit', 'button', 'reset', 'image'].includes((a.type || '').toLowerCase())) {
        if (!hasMeaningfulName(n, nodes)) emit('AS-FORM-001', n);
        if ((a['aria-invalid'] || '').toLowerCase() === 'true' && !((a['aria-describedby'] || a['aria-errormessage'] || '').trim())) emit('AS-FORM-002', n, { kind: 'review', detail: 'aria-invalid is true; no programmatic error reference detected in source.' });
      }
      if (n.tag === 'input' && (a.type || '').toLowerCase() === 'image' && !hasMeaningfulName(n, nodes)) emit('AS-BTN-001', n);
      if (n.tag === 'img' && !hasAttr(n, 'alt') && !['presentation', 'none'].includes((a.role || '').toLowerCase())) emit('AS-IMG-001', n);
      if (n.tag === 'button' && !hasMeaningfulName(n, nodes)) emit('AS-BTN-001', n);
      if (n.tag === 'a' && hasAttr(n, 'href') && !hasMeaningfulName(n, nodes)) emit('AS-LINK-001', n);
      if ((n.tag === 'iframe' || n.tag === 'frame') && !hasMeaningfulName(n, nodes)) emit('AS-FRAME-001', n);
      if (a.tabindex && /^\d+$/.test(a.tabindex.trim()) && Number(a.tabindex) > 0) emit('AS-FOCUS-001', n, { kind: 'review' });
      if (['div', 'span'].includes(n.tag) && hasAttr(n, 'onclick') && !['button', 'link'].includes((a.role || '').toLowerCase())) emit('AS-KEY-001', n, { kind: 'review' });
      if (n.tag === 'label' && a.for && !nodeById(nodes, a.for)) emit('AS-FORM-003', n);
      if (['video', 'audio'].includes(n.tag) && hasAttr(n, 'autoplay') && !hasAttr(n, 'controls')) emit('AS-MEDIA-001', n, { kind: 'review' });
    }
    if (n.tag === 'meta' && (a.name || '').toLowerCase() === 'viewport') {
      const c = (a.content || '').toLowerCase().replace(/\s+/g, '');
      const max = /maximum-scale=([0-9.]+)/.exec(c);
      if (/user-scalable=(no|0)/.test(c) || (max && Number(max[1]) < 2)) emit('AS-VIEW-001', n);
    }
    if (n.tag === 'meta' && (a['http-equiv'] || '').toLowerCase() === 'refresh') {
      const sec = /^\s*(\d+(?:\.\d+)?)/.exec(a.content || '');
      if (sec && Number(sec[1]) > 0) emit('AS-REFRESH-001', n, { kind: 'review' });
    }
    for (const refAttr of ['aria-labelledby', 'aria-describedby', 'aria-errormessage']) {
      if (!a[refAttr]) continue;
      for (const id of a[refAttr].trim().split(/\s+/).filter(Boolean)) {
        if (!ids.has(id)) emit('AS-ARIA-001', n, { detail: `Unresolved reference in ${refAttr}; raw identifier omitted for privacy.` });
      }
    }
  }
  const rank = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  findings.sort((x, y) => (rank[x.severity] ?? 9) - (rank[y.severity] ?? 9) || x.source.line - y.source.line || x.ruleId.localeCompare(y.ruleId) || x.id.localeCompare(y.id));
  const bySeverity = Object.fromEntries(['critical', 'serious', 'moderate', 'minor'].map((s) => [s, findings.filter((f) => f.severity === s).length]));
  return { schemaVersion: '1.0.0', product: 'AccessSutra AI', toolVersion: VERSION, rulesVersion: RULES_VERSION, engine,
    scope: { source: basename(source), bytes: Buffer.byteLength(html, 'utf8'), sha256: hex(html), domElements: nodes.length },
    summary: { detected: findings.filter((f) => f.kind === 'detected').length, requiresReview: findings.filter((f) => f.kind === 'review').length, total: findings.length, bySeverity },
    findings,
    untested: ['JavaScript-rendered states', 'Actual keyboard focus and traps', 'Visible focus and focus obscuration', 'Screen reader output', 'Contrast and zoom/reflow', 'Cognitive and language usability', 'Mobile/TV remote interactions', 'Real error handling after submission'],
    limitations: ['Heuristic tokenizer, not full HTML5 DOM parsing or axe-core', 'A reported finding is a candidate requiring browser/human verification', 'No pass score or WCAG conformance claim'], disclaimer: DISCLAIMER };
}

export async function scanHtmlFile(file) {
  const stat = await lstat(file); if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Input must be a regular non-symlink file');
  if (stat.size > MAX_HTML_BYTES) throw new Error('Input exceeds 2 MiB');
  const html = await readFile(file, 'utf8'); return scanHtml(html, { source: basename(file) });
}
export { labelsFor, textOf };
