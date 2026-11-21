import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,stat} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {main} from '../packages/cli/accesssutra.mjs';
import {installIde,supportedHosts} from '../packages/core/installer.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
test('all nine host adapter names present',()=>assert.equal(supportedHosts().length,9));
test('CLI scan/manual/report create usable outputs',async()=>{
 const d=await mkdtemp(join(tmpdir(),'as-cli-'));
 try{
  const scan=join(d,'scan.json'),manual=join(d,'manual.json'),report=join(d,'report');
  assert.equal(await main(['scan','--input',join(root,'fixtures/signup-broken.html'),'--out',scan]),0);
  assert.equal(await main(['manual','--task',join(root,'fixtures/signup-task.json'),'--out',manual]),0);
  assert.equal(await main(['report','--scan',scan,'--manual',manual,'--out',report]),0);
  const r=JSON.parse(await readFile(join(report,'assessment.json'),'utf8'));
  assert.ok(r.findings.length>=4);assert.equal(r.manual.completion.status,'not-tested');await stat(join(report,'assessment.html'));
 }finally{await rm(d,{recursive:true,force:true});}
});
test('CLI refuses unknown command',async()=>await assert.rejects(main(['bad']),/Unknown command/));
test('CLI refuses missing input',async()=>await assert.rejects(main(['scan','--input']),/Required/));
test('installer copies only into project-local target',async()=>{
 const d=await mkdtemp(join(tmpdir(),'as-installer-'));
 try{const result=await installIde({repoRoot:root,target:d,host:'claude'});assert.ok(result.destination.endsWith('accesssutra'));await stat(join(result.destination,'skills'));await stat(join(result.destination,'host','CLAUDE.md'));await assert.rejects(installIde({repoRoot:root,target:d,host:'claude'}),/exists/);}finally{await rm(d,{recursive:true,force:true});}
});
test('installer rejects unsupported host',async()=>await assert.rejects(installIde({repoRoot:root,target:'/tmp/none',host:'fake'}),/Unsupported/));
test('installer refuses installing inside source repository',async()=>await assert.rejects(installIde({repoRoot:root,target:root,host:'claude'}),/external/));
