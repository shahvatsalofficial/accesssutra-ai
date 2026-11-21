import test from 'node:test';import assert from 'node:assert/strict';
import {scanHtml} from '../packages/core/checks.mjs';
import {parseHtml} from '../packages/core/html.mjs';
import {runBenchmark,runFuzz,runAssurance} from '../packages/core/assure.mjs';
import {verifySeal,composeReport} from '../packages/core/report.mjs';
import {main} from '../packages/cli/accesssutra.mjs';
import {fileURLToPath} from 'node:url';import {resolve,join} from 'node:path';import {mkdtemp,rm,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const P=b=>`<html lang="en"><title>t</title>${b}</html>`;
const rules=h=>scanHtml(h).findings.map(f=>f.ruleId);
test('select options do not name a select',()=>assert.deepEqual(rules(P('<select><option>A</option></select>')),['AS-FORM-001']));
test('image alt inside button counts as a name',()=>assert.deepEqual(rules(P('<button><img src=a alt="Go"></button>')),[]));
test('300 unclosed <li> do not hit the nesting limit',()=>assert.deepEqual(rules(P('<ul>'+'<li>x'.repeat(300)+'</ul>')),[]));
test('unclosed <script> swallows the rest like a browser',()=>assert.deepEqual(rules(P('<script>var a="<img>"')),[]));
test('title text is captured',()=>assert.equal(rules('<html lang="en"><title>Hi</title></html>').length,0));
test('stray quote in unquoted attribute does not swallow the page',()=>{const {nodes}=parseHtml('<div class=a"b>x</div><img src=a>');assert.ok(nodes.some(n=>n.tag==='img'));});
test('selector nth-of-type is stable and fast on 20000 siblings',()=>{const t=performance.now();const r=scanHtml(P('<img src=a>'.repeat(20000)));assert.equal(r.findings.length,20000);assert.ok(performance.now()-t<5000);});
test('duplicate ARIA refs do not create duplicate finding ids',()=>{const f=scanHtml(P('<button aria-labelledby="x y">a</button>')).findings;assert.equal(new Set(f.map(x=>x.id)).size,f.length);});
test('gold corpus has zero false positives and negatives',()=>{const b=runBenchmark();assert.deepEqual(b.misses,[]);assert.equal(b.precision,1);assert.equal(b.recall,1);});
test('fuzzing finds no unexpected exception',()=>{const f=runFuzz({mutations:150});assert.equal(f.unexpected,0,JSON.stringify(f.notes));});
test('report seal verifies and rejects tampering',()=>{const r=composeReport(scanHtml(P('<img src=a>')));assert.ok(verifySeal(r).valid);r.findings[0].severity='minor';assert.equal(verifySeal(r).valid,false);});
test('assurance run passes end to end and CLI verify accepts its seal',async()=>{
 const a=await runAssurance({root,mutations:50});assert.equal(a.summary.failed,0,JSON.stringify(a.checks.filter(c=>c.status==='fail')));
 const d=await mkdtemp(join(tmpdir(),'as-aud-'));try{assert.equal(await main(['audit','--out',d,'--mutations','20','--quiet']),0);const f=join(d,'assurance-report.json');assert.equal(await main(['verify','--report',f]),0);
  assert.match(await readFile(join(d,'assurance-report.html'),'utf8'),/Assurance Report/);assert.match(await readFile(join(d,'assurance-report.md'),'utf8'),/Verdict/);}finally{await rm(d,{recursive:true,force:true});}
});
test('CLI --fail-on gates on severity',async()=>{const d=await mkdtemp(join(tmpdir(),'as-gate-'));try{assert.equal(await main(['scan','--input',join(root,'fixtures/signup-broken.html'),'--out',join(d,'s.json'),'--fail-on','serious']),3);assert.equal(await main(['scan','--input',join(root,'fixtures/signup-good.html'),'--out',join(d,'g.json'),'--fail-on','minor']),0);}finally{await rm(d,{recursive:true,force:true});}});
test('CLI version and rules',async()=>{assert.equal(await main(['version']),0);assert.equal(await main(['rules']),0);});
