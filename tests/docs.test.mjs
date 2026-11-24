import test from 'node:test';import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {resolve,join} from 'node:path';
const dir=resolve(fileURLToPath(new URL('../documents/html',import.meta.url)));
const pages=readdirSync(dir).filter(f=>/^\d\d-.*\.html$/.test(f));
test('docs site has 13 pages, home, 404, assets and SEO files',()=>{assert.equal(pages.length,13);for(const f of ['index.html','404.html','assets/site.css','assets/site.js','sitemap.xml','robots.txt','llms.txt'])readFileSync(join(dir,f));});
test('no unfilled placeholders or directives leak into pages',()=>{for(const f of [...pages,'index.html']){const h=readFileSync(join(dir,f),'utf8');assert.ok(!/\{\{[^}]*\}\}/.test(h),f);assert.match(h,/data-theme="light"/);assert.match(h,/name="viewport"/);}});
test('every internal link resolves to a built file',()=>{const names=new Set(readdirSync(dir));for(const f of [...pages,'index.html']){for(const m of readFileSync(join(dir,f),'utf8').matchAll(/href="([\w-]+\.html)(?:#[^"]*)?"/g))assert.ok(names.has(m[1]),`${f} -> ${m[1]}`);}});
