/** Limited, dependency-free HTML tokenizer for offline hints. NOT a browser DOM or an HTML5 conformance parser. */
export const MAX_HTML_BYTES = 2 * 1024 * 1024;
export const MAX_NODES = 30000;
export const MAX_DEPTH = 128;
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const SKIP_CONTENT = new Set(['script', 'style']); // content ignored entirely
const TEXT_CONTENT = new Set(['title', 'textarea']); // content kept as text, never parsed as markup
// Start tag X implicitly closes an open element listed for X (HTML optional end tags, same-kind only).
const AUTOCLOSE = { li: ['li'], p: ['p'], option: ['option'], optgroup: ['optgroup', 'option'], tr: ['tr'], td: ['td', 'th'], th: ['td', 'th'], dt: ['dt', 'dd'], dd: ['dt', 'dd'] };
const WS = /\s/;
const NAME = /[A-Za-z][^\s/>]*/y;

/** Reads one tag starting at html[start]==='<'. Returns null when the tag is never terminated. */
function readTag(html, start) {
  const n = html.length;
  let i = start + 1, closing = false;
  if (html[i] === '/') { closing = true; i++; }
  NAME.lastIndex = i;
  const m = NAME.exec(html);
  if (!m) return { end: start + 1, tag: null, closing, attrs: null, selfClose: false }; // "<" not starting a tag is text (avoids O(n^2) scans)
  const tag = m[0].toLowerCase();
  i += m[0].length;
  const attrs = Object.create(null);
  let selfClose = false;
  while (i < n) {
    while (i < n && WS.test(html[i])) i++;
    if (i >= n) return null;
    const ch = html[i];
    if (ch === '>') return { end: i + 1, tag, closing, attrs, selfClose };
    if (ch === '/') { if (html[i + 1] === '>') selfClose = true; i++; continue; }
    const b = i;
    i++; // a leading "=" or quote is treated as part of the name, as browsers do
    while (i < n && !WS.test(html[i]) && html[i] !== '/' && html[i] !== '>' && html[i] !== '=') i++;
    const key = html.slice(b, i).toLowerCase();
    while (i < n && WS.test(html[i])) i++;
    let value = '';
    if (html[i] === '=') {
      i++;
      while (i < n && WS.test(html[i])) i++;
      const q = html[i];
      if (q === '"' || q === "'") {
        const close = html.indexOf(q, i + 1);
        if (close < 0) return null;
        value = html.slice(i + 1, close); i = close + 1;
      } else {
        const vb = i;
        while (i < n && !WS.test(html[i]) && html[i] !== '>') i++;
        value = html.slice(vb, i);
      }
    }
    if (!Object.hasOwn(attrs, key)) attrs[key] = value;
  }
  return null;
}

const newlines = (s) => { let c = 0; for (let k = s.indexOf('\n'); k >= 0; k = s.indexOf('\n', k + 1)) c++; return c; };

export function parseHtml(html) {
  if (typeof html !== 'string') throw new Error('HTML input must be a string');
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) throw new Error('HTML exceeds 2 MiB limit');
  const root = { tag: '#document', attrs: Object.create(null), children: [], text: '', parent: null, start: 0, line: 1, nth: 1 };
  const stack = [root], nodes = [], counters = new Map([[root, new Map()]]);
  let i = 0, line = 1;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4); const next = end < 0 ? html.length : end + 3;
      line += newlines(html.slice(i, next)); i = next; continue;
    }
    if (html[i] !== '<') {
      const next = html.indexOf('<', i); const end = next < 0 ? html.length : next;
      const chunk = html.slice(i, end);
      stack.at(-1).text += chunk; line += newlines(chunk); i = end; continue;
    }
    const startLine = line;
    if (/^<[!?]/.test(html.slice(i, i + 2))) { // doctype, CDATA, processing instruction
      const close = html.indexOf('>', i); const next = close < 0 ? html.length : close + 1;
      line += newlines(html.slice(i, next)); i = next; continue;
    }
    const t = readTag(html, i);
    if (t === null) { stack.at(-1).text += html.slice(i); break; } // unterminated tag: treat rest as text
    const next = t.end < 0 ? html.length : t.end;
    const raw = html.slice(i, next);
    if (!t.tag) { stack.at(-1).text += '<'; i += 1; continue; } // stray "<"
    line += newlines(raw);
    const start = i; i = next;
    if (t.closing) {
      for (let k = stack.length - 1; k > 0; k--) { if (stack[k].tag === t.tag) { stack.length = k; break; } }
      continue;
    }
    const ac = AUTOCLOSE[t.tag];
    if (ac && stack.length > 1 && ac.includes(stack.at(-1).tag)) stack.pop();
    const parent = stack.at(-1);
    const seen = counters.get(parent) ?? counters.set(parent, new Map()).get(parent);
    const nth = (seen.get(t.tag) ?? 0) + 1; seen.set(t.tag, nth);
    const node = { tag: t.tag, attrs: t.attrs, children: [], text: '', parent, start, line: startLine, nth };
    parent.children.push(node); nodes.push(node);
    if (nodes.length > MAX_NODES) throw new Error('HTML element limit exceeded');
    if (VOID.has(t.tag) || t.selfClose) continue;
    if (SKIP_CONTENT.has(t.tag) || TEXT_CONTENT.has(t.tag)) {
      const re = new RegExp('</\\s*' + t.tag + '\\s*>', 'ig'); re.lastIndex = i;
      const close = re.exec(html);
      const contentEnd = close ? close.index : html.length;
      const consumedEnd = close ? close.index + close[0].length : html.length;
      if (TEXT_CONTENT.has(t.tag)) node.text = html.slice(i, contentEnd);
      line += newlines(html.slice(i, consumedEnd)); i = consumedEnd;
      continue;
    }
    if (stack.length >= MAX_DEPTH) throw new Error('HTML nesting limit exceeded');
    stack.push(node);
  }
  return { root, nodes };
}

export const isHiddenSelf = (n) => hasAttr(n, 'hidden') || (n.attrs['aria-hidden'] || '').trim().toLowerCase() === 'true';
export function ancestors(node) { const r = []; for (let p = node.parent; p; p = p.parent) r.push(p); return r; }
export const isHiddenTree = (n) => isHiddenSelf(n) || ancestors(n).some(isHiddenSelf);

/** Rendered-text approximation used for naming: descendant text, img alt, and aria-label on svg/img/role=img. Hidden subtrees excluded. */
export function textOf(node, top = true) {
  if (!top && isHiddenSelf(node)) return '';
  const parts = [node.text];
  for (const c of node.children) {
    if (isHiddenSelf(c)) continue;
    if (c.tag === 'img') { if ((c.attrs.alt || '').trim()) parts.push(c.attrs.alt); continue; }
    const label = (c.attrs['aria-label'] || '').trim();
    if (label && (c.tag === 'svg' || (c.attrs.role || '').toLowerCase() === 'img')) { parts.push(label); continue; }
    parts.push(textOf(c, false));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function selectorOf(node) {
  const parts = []; let cur = node;
  while (cur && cur.tag !== '#document') { parts.unshift(`${cur.tag}:nth-of-type(${cur.nth})`); cur = cur.parent; }
  return parts.join(' > ');
}
export function hasAttr(node, name) { return Object.hasOwn(node.attrs, name); }

const indexCache = new WeakMap();
function indexOf(nodes) {
  let ix = indexCache.get(nodes);
  if (!ix) {
    ix = { byId: new Map(), labelsFor: new Map() };
    for (const n of nodes) {
      if (n.attrs.id && !ix.byId.has(n.attrs.id)) ix.byId.set(n.attrs.id, n);
      if (n.tag === 'label' && n.attrs.for) { const l = ix.labelsFor.get(n.attrs.for) ?? []; l.push(n); ix.labelsFor.set(n.attrs.for, l); }
    }
    indexCache.set(nodes, ix);
  }
  return ix;
}
export const nodeById = (nodes, id) => indexOf(nodes).byId.get(id);
export const labelsFor = (nodes, id) => indexOf(nodes).labelsFor.get(id) ?? [];

const FIELDS = new Set(['input', 'select', 'textarea']);
/** True when the element has a name the limited tokenizer can detect. Presence is not quality: wording needs human review. */
export function hasMeaningfulName(node, nodes) {
  const a = node.attrs;
  if ((a['aria-label'] || '').trim()) return true;
  if ((a['aria-labelledby'] || '').trim()) {
    const ix = indexOf(nodes);
    if (a['aria-labelledby'].trim().split(/\s+/).some((id) => { const t = ix.byId.get(id); return t && textOf(t); })) return true;
  }
  if (node.tag === 'img') return hasAttr(node, 'alt');
  const type = (a.type || '').toLowerCase();
  if (node.tag === 'input' && ['button', 'submit', 'reset'].includes(type) && (a.value || '').trim()) return true;
  if (node.tag === 'input' && type === 'image') return Boolean((a.alt || '').trim()) || Boolean((a.title || '').trim());
  if (FIELDS.has(node.tag)) {
    if (a.id && labelsFor(nodes, a.id).some((l) => textOf(l))) return true;
    if (ancestors(node).some((n) => n.tag === 'label' && textOf(n))) return true;
    return Boolean((a.title || '').trim()); // placeholder is deliberately not a name
  }
  if (textOf(node)) return true;
  return Boolean((a.title || '').trim());
}
