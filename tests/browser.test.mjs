import test from 'node:test';import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';import {resolve} from 'node:path';
import {browserAudit} from '../packages/browser/runner.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const has=async()=>{try{const pw=await import('playwright');await import('@axe-core/playwright');const b=await pw.chromium.launch({headless:true});await b.close();return true;}catch{return false;}};
const available=await has();
test('browser adapter rejects external URL before importing anything',async()=>assert.rejects(browserAudit('https://example.com'),/external origins are blocked/));
test('browser adapter rejects bad tab counts',async()=>assert.rejects(browserAudit('file:///x.html',{tabs:0}),/Tab count/));
test('real Chromium + axe-core run on the broken fixture agrees with the static scanner',{skip:!available&&'playwright, @axe-core/playwright and Chromium not installed (optional)'},async()=>{
  const r=await browserAudit(pathToFileURL(resolve(root,'fixtures/signup-broken.html')).href,{tabs:6});
  assert.equal(r.status,'browser-observed');assert.equal(r.focus.length,6);
  const ids=r.axe.violations.map(v=>v.ruleId);assert.ok(ids.includes('image-alt'));assert.ok(ids.includes('button-name'));
});
test('real Chromium + axe-core run on the good fixture finds no axe violations',{skip:!available&&'optional browser dependencies not installed'},async()=>{
  const r=await browserAudit(pathToFileURL(resolve(root,'fixtures/signup-good.html')).href,{tabs:4});
  assert.deepEqual(r.axe.violations,[]);
});
