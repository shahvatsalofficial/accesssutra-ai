// Theme-aware inline SVG diagrams. Colours come from CSS variables in site.css, so one SVG serves light and dark.
let uid = 0;
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (w, h, label, body) => {
  const id = `ah${++uid}`;
  return `<div class="dia-scroll"><svg class="dia" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(label)}"><defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path class="ah" d="M0,0 L9,4.5 L0,9 z"/></marker></defs>${body.replaceAll('#AH', `url(#${id})`)}</svg></div>`;
};
const box = (x, y, w, h, t1, t2 = '', cls = '') => `<rect class="bx ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/><text class="t1" x="${x + w / 2}" y="${y + (t2 ? h / 2 - 3 : h / 2 + 5)}" text-anchor="middle">${e(t1)}</text>${t2 ? `<text class="t2" x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle">${e(t2)}</text>` : ''}`;
const arrow = (d, dash = false) => `<path class="ln${dash ? ' dash' : ''}" d="${d}" marker-end="#AH"/>`;
const txt = (x, y, s, cls = 't2', anchor = 'middle') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${e(s)}</text>`;
const diamond = (cx, cy, w, h, t, cls = '') => `<polygon class="bx ${cls}" points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}"/>${txt(cx, cy + 4, t, 't1')}`;

export const DIAGRAMS = {
  pipeline: () => svg(780, 200, 'Scan pipeline: a local HTML file is tokenised, 18 rules produce candidate findings, optional manual observations and a browser run are attached, and a sealed report is written as JSON, Markdown and HTML. Nothing leaves the machine.',
    box(10, 60, 120, 70, 'HTML file', 'local, max 2 MiB') + box(165, 60, 120, 70, 'Tokenize', 'nodes, lines, hidden') + box(320, 60, 120, 70, '18 rules', 'candidate findings', 'br') + box(475, 60, 120, 70, 'Compose', '+ manual + browser', 'br') +
    box(650, 10, 120, 40, 'JSON', '', 'ok') + box(650, 62, 120, 40, 'Markdown', '', 'ok') + box(650, 114, 120, 40, 'HTML', '', 'ok') + box(650, 162, 120, 32, 'SHA-256 seal', '', 'ok') +
    arrow('M130 95 H165') + arrow('M285 95 H320') + arrow('M440 95 H475') + arrow('M595 95 C620 95 620 30 650 30') + arrow('M595 95 C620 95 620 82 650 82') + arrow('M595 95 C620 95 620 134 650 134') + arrow('M595 95 C615 95 615 178 650 178') +
    txt(380, 24, 'offline, read-only, no network', 't2') + txt(380, 182, 'every report lists what was NOT tested', 't2')),

  ladder: () => svg(780, 270, 'Evidence ladder from weakest to strongest: not tested, static scan candidate, browser run with axe-core, and a named human reviewer observation. The tool never promotes weaker evidence to a stronger claim.',
    box(10, 200, 180, 60, '0 · Not tested', '"unverified"', 'warn') + box(210, 150, 180, 60, '1 · Static scan', '"candidate at line N"') + box(410, 100, 180, 60, '2 · Browser + axe-core', '"axe reported rule X"', 'br') + box(610, 50, 160, 60, '3 · Human reviewer', 'name + environment + note', 'ok') +
    arrow('M100 200 V185 H210') + arrow('M300 150 V135 H410') + arrow('M500 100 V80 H610') +
    txt(390, 28, 'stronger evidence', 't1') + txt(390, 46, 'an empty list is level 0, never "accessible"', 't2')),

  trust: () => svg(780, 240, 'Trust boundaries: untrusted HTML and reviewer notes enter the offline AccessSutra process, which blocks networks, form submission and external origins, and writes only report files you choose.',
    `<rect class="bx zone" x="8" y="20" width="220" height="200" rx="16"/>${txt(118, 44, 'UNTRUSTED INPUT', 't1')}${txt(118, 82, 'HTML under test')}${txt(118, 106, 'reviewer notes')}${txt(118, 130, 'file names')}${txt(118, 158, 'hostile page? still just text', 't2')}` +
    `<rect class="bx br" x="280" y="20" width="240" height="200" rx="16"/>${txt(400, 44, 'ACCESSSUTRA PROCESS', 'tb')}${txt(400, 82, '2 MiB, 30k nodes, depth 128')}${txt(400, 106, 'no network, no form submit')}${txt(400, 130, 'file: and loopback only')}${txt(400, 154, 'escape on every output', 't2')}${txt(400, 190, 'values and placeholders never copied', 't2')}` +
    `<rect class="bx ok" x="572" y="20" width="200" height="200" rx="16"/>${txt(672, 44, 'OUTPUT (YOU CHOOSE)', 'tg')}${txt(672, 82, 'assessment.html')}${txt(672, 106, 'assessment.md')}${txt(672, 130, 'assessment.json')}${txt(672, 158, 'SHA-256 seal', 't2')}` +
    arrow('M228 120 H280') + arrow('M520 120 H572')),

  ci: () => svg(780, 250, 'CI gate: a pull request runs scan with a fail-on level. If a finding at or above the level exists, exit code 3 blocks the merge and the report is attached; otherwise exit 0 lets it through. A pass still means only that no static candidates were found.',
    box(10, 95, 120, 60, 'Pull request', 'opened or updated') + box(170, 95, 150, 60, 'CI job', 'scan --fail-on serious', 'br') + diamond(410, 125, 140, 90, 'Serious found?') +
    box(550, 20, 130, 56, 'Exit 0', 'merge allowed', 'ok') + box(550, 172, 130, 56, 'Exit 3', 'merge blocked', 'bad') + box(695, 172, 80, 56, 'Fix', 'push again') + box(695, 20, 80, 56, 'Human', 'tests still due', 'warn') +
    arrow('M130 125 H170') + arrow('M320 125 H340') + arrow('M410 80 V48 H550') + arrow('M410 170 V200 H550') + arrow('M680 48 H695') + arrow('M680 200 H695') + arrow('M735 172 C735 130 250 130 245 155', true) +
    txt(440, 62, 'no', 't2', 'start') + txt(440, 192, 'yes', 't2', 'start') + txt(390, 246, 'assessment.html attached as a CI artifact', 't2')),

  lifecycle: () => svg(780, 260, 'Manual check lifecycle: every check starts as not-run. Only a named reviewer with environment and note can set passed, failed, blocked or inconclusive. The software never sets passed by itself.',
    box(10, 100, 130, 60, 'not-run', 'every check starts here', 'warn') + box(190, 100, 150, 60, 'Reviewer tests', 'real keyboard, AT, zoom', 'br') + diamond(430, 130, 120, 80, 'Evidence?') +
    box(560, 14, 200, 48, 'passed / failed', 'blocked / inconclusive', 'ok') + box(560, 190, 200, 48, 'rejected', 'missing reviewer, env or note', 'bad') +
    arrow('M140 130 H190') + arrow('M340 130 H370') + arrow('M430 90 V38 H560') + arrow('M430 170 V214 H560') + txt(450, 60, 'yes', 't2', 'start') + txt(450, 198, 'no', 't2', 'start') +
    txt(390, 250, 'credential-like text and notes over 500 characters are refused too', 't2')),

  seal: () => svg(780, 220, 'Seal verification: the report is serialised as canonical JSON with sorted keys, hashed with SHA-256, and the hash is stored in the seal. verify recomputes the hash; any edit changes it. The seal is not a digital signature.',
    box(10, 80, 130, 60, 'Report', 'without seal') + box(180, 80, 150, 60, 'Canonical JSON', 'keys sorted', 'br') + box(370, 80, 120, 60, 'SHA-256', '64 hex chars', 'br') + box(530, 20, 150, 50, 'seal.sha256', 'stored in report', 'ok') + diamond(605, 160, 120, 70, 'Same?') + box(700, 130, 74, 60, 'valid', '', 'ok') +
    arrow('M140 110 H180') + arrow('M330 110 H370') + arrow('M490 110 C510 110 510 45 530 45') + arrow('M490 110 H520 C560 110 575 140 580 150') + arrow('M665 160 H700') + txt(680, 150, 'yes', 't2') + txt(605, 210, 'one edited character = different hash = exit 2', 't2')),

  arch: () => svg(780, 348, 'Architecture: the CLI calls core modules for the tokenizer, rules, manual plans, reports, assurance and the audit ledger, plus an optional browser adapter, a loopback report server and an IDE installer.',
    box(280, 10, 220, 50, 'CLI', 'packages/cli', 'br') +
    box(10, 120, 140, 56, 'html.mjs', 'tokenizer, hidden state') + box(165, 120, 140, 56, 'checks.mjs', '18 rules, findings') + box(320, 120, 140, 56, 'manual.mjs', '10 human checks') + box(475, 120, 140, 56, 'report.mjs', 'JSON · MD · HTML · seal') + box(630, 120, 140, 56, 'assure.mjs', 'audit, corpus, fuzz') +
    box(10, 250, 170, 56, 'browser/runner', 'Playwright + axe (optional)', 'warn') + box(200, 250, 170, 56, 'server', 'loopback, read-only', 'ok') + box(390, 250, 170, 56, 'installer', '9 IDE packs, dry-run', 'ok') + box(580, 250, 190, 56, 'audit ledger', 'hash-chained JSONL', 'ok') +
    arrow('M390 60 V90 H80 V120') + arrow('M390 60 V90 H235 V120') + arrow('M390 60 V120') + arrow('M390 60 V90 H545 V120') + arrow('M390 60 V90 H700 V120') +
    arrow('M545 176 V210 H285 V250', true) + txt(390, 338, 'zero runtime dependencies: Node.js built-ins only', 't2')),

  anatomy: () => svg(780, 330, 'Anatomy of an evidence report: header with source hash, summary cards, finding cards, manual review table, browser status, not-covered list, limitations and seal.',
    `<rect class="bx" x="170" y="10" width="440" height="310" rx="16"/>` +
    box(190, 24, 400, 40, '1  Header', 'source file, SHA-256, tool version', 'br') + box(190, 72, 400, 40, '2  Summary cards', 'total, serious, moderate, need human review') + box(190, 120, 400, 50, '3  Finding cards', 'rule, severity, line, selector, WCAG candidate, fix', 'bad') +
    box(190, 178, 400, 40, '4  Manual review table', 'check, status, reviewer, observation', 'ok') + box(190, 226, 400, 40, '5  Not covered + limitations', 'focus, screen reader, contrast, zoom ...', 'warn') + box(190, 274, 400, 38, '6  Seal', 'SHA-256 of canonical JSON') +
    txt(150, 148, 'start here', 't2', 'end') + txt(150, 204, 'trust here', 't2', 'end') + txt(150, 252, 'read the limits', 't2', 'end') + txt(630, 298, 'edit-evident', 't2', 'start')),

  agents: () => svg(780, 300, 'Agent routing: AccessSutra Prime scopes the task and routes to specialists for keyboard, forms, semantics, screen reader scripts, contrast, reflow and cognitive review. The Independent Access Assurance Auditor challenges any release claim.',
    box(290, 10, 200, 56, 'AccessSutra Prime', 'scope, route, reconcile', 'br') +
    box(10, 120, 140, 52, 'KeyFlow', 'keyboard') + box(165, 120, 140, 52, 'FormSignal', 'labels, errors') + box(320, 120, 140, 52, 'SemantiCore', 'HTML + ARIA') + box(475, 120, 140, 52, 'ScreenReader', 'AT test scripts') + box(630, 120, 140, 52, 'ReflowLab', 'zoom, reflow') +
    box(290, 232, 200, 56, 'Independent Auditor', 'challenges unsupported claims', 'ok') +
    arrow('M390 66 V92 H80 V120') + arrow('M390 66 V92 H235 V120') + arrow('M390 66 V120') + arrow('M390 66 V92 H545 V120') + arrow('M390 66 V92 H700 V120') +
    arrow('M80 172 V202 H390 V232') + arrow('M235 172 V202') + arrow('M390 172 V232') + arrow('M545 172 V202') + arrow('M700 172 V202 H390') +
    txt(20, 270, '21 roles in total; definitions are instructions, not running services', 't2', 'start')),
};

/** Vertical/row flowchart as semantic HTML: reads well on phones, no horizontal scroll. */
export const FLOWS = {
  launch: { row: false, steps: [
    ['A team is two days from launching a sign-up form', 'Design is signed off. Nobody has tried it without a mouse.'],
    ['`accesssutra scan --input signup.html --out scan.json`', 'Five candidates in under a second, each with line and selector.', 'bad'],
    ['Three serious findings: unlabeled email, unnamed icon button, image without alt', 'Rules `AS-FORM-001`, `AS-BTN-001`, `AS-IMG-001`. Two more need a person: `AS-FORM-002`, `AS-KEY-001`.', 'warn'],
    ['Developers fix the markup and re-scan: zero findings', 'This is the moment people stop. The report says "accessibility remains unverified".'],
    ['A tester runs the 10-item manual plan with a keyboard and a screen reader', 'They record: focus gets stuck in the date picker. Status `failed`, with name, browser and note.', 'bad'],
    ['The trap is fixed before launch', 'No scanner could have found it. The report carries both the scan and the human evidence.', 'ok']] },
  gate: { row: false, steps: [
    ['A refactor swaps a text button for an icon-only button', 'Looks identical to sighted users. Tests pass.'],
    ['CI runs `accesssutra scan --input dist/index.html --out scan.json --fail-on serious`', 'The scanner reads the built page, no browser needed.'],
    ['`AS-BTN-001` fires and the job exits 3', 'The pull request is blocked and `assessment.html` is attached.', 'bad'],
    ['The author adds `aria-label="Close"` and pushes', 'CI exits 0.', 'ok']] },
  placeholder: { row: false, steps: [
    ['A search box has only `placeholder="Search"`', 'It looks labelled. axe-core accepts it.'],
    ['AccessSutra flags `AS-FORM-001`', 'A placeholder disappears when typing and is weakly supported as a name.', 'warn'],
    ['The team compares both tools and decides with a human check', 'Screen reader test: the field is announced as "edit, blank". They add a visible label.', 'ok']] },
  zoom: { row: false, steps: [
    ['The marketing page ships with `user-scalable=no`', 'Looks tidy on phones.'],
    ['`AS-VIEW-001` is reported as serious', 'Low-vision users cannot pinch zoom. WCAG 1.4.4 is the candidate reference.', 'bad'],
    ['One attribute is removed, the manual `zoom-reflow` check is run at 200%', 'The reviewer records the result in the plan.', 'ok']] },
  procurement: { row: false, steps: [
    ['A customer asks: "Are you WCAG 2.2 compliant?"', 'The honest answer is not a yes or a no.'],
    ['You send `assessment.html` plus the sealed assurance report', 'It shows what was scanned, what was tested by people, in which environment, and what was never tested.'],
    ['The customer runs `accesssutra verify` on the JSON', 'The seal proves the file was not edited after generation. It does not prove who wrote it.', 'warn'],
    ['The conversation moves to a real audit', 'Your evidence pack makes that audit cheaper and faster.', 'ok']] },
  assistant: { row: false, steps: [
    ['Developer asks an AI coding assistant: "check our checkout for accessibility"', 'The AccessSutra pack was installed with `install-ide --host claude`.'],
    ['The assistant runs the real scanner and lists candidates', 'It cannot invent evidence: findings carry line, selector and the source hash.'],
    ['It writes a keyboard and screen reader test script for a human', 'Prime routes to KeyFlow and ScreenReader Field Guide. It never marks a check passed.', 'warn'],
    ['The Independent Auditor role challenges the draft claim "now accessible"', 'The claim is replaced with the scoped evidence.', 'ok']] },
  tamper: { row: false, steps: [
    ['Someone changes `serious: 3` to `serious: 0` in `assessment.json`', 'The HTML report is regenerated from it and looks clean.'],
    ['`accesssutra verify --report assessment.json`', 'The recomputed SHA-256 no longer matches `seal.sha256`.', 'bad'],
    ['Exit code 2: "Content does not match sealed digest"', 'The edit is exposed. The tool is honest that a seal is not a signature.', 'ok']] },
  quickstart: { row: true, steps: [
    ['Run', '`npx accesssutra-ai demo`'], ['Open', '`assessment.html`'], ['Fix', 'follow each remediation'], ['Test', 'run the human plan']] },
};
