import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createReportServer} from '../packages/server/server.mjs';
const token='test-token-1234567890-1234567890';
test('server requires strong token',()=>assert.throws(()=>createReportServer({dir:'.',token:'short'}),/24/));
test('server requires report directory',()=>assert.throws(()=>createReportServer({token}),/directory/));
test('read-only localhost server rejects unauthenticated and mutating requests',async()=>{
 const d=await mkdtemp(join(tmpdir(),'as-server-'));await writeFile(join(d,'assessment.json'),JSON.stringify({ok:true}));
 const {server,listen}=createReportServer({dir:d,token,port:0,rateLimit:5});const a=await listen();const base=`http://127.0.0.1:${a.port}`;
 try{
  const unauth=await fetch(base+'/reports');assert.equal(unauth.status,401);assert.equal(unauth.headers.get('access-control-allow-origin'),null);
  const auth={authorization:`Bearer ${token}`};
  const ok=await fetch(base+'/reports',{headers:auth});assert.equal(ok.status,200);assert.equal((await ok.json()).ok,true);
  const health=await fetch(base+'/health',{headers:auth});assert.equal(health.status,200);
  const post=await fetch(base+'/reports',{method:'POST',headers:auth});assert.equal(post.status,405);
  const notfound=await fetch(base+'/other',{headers:auth});assert.equal(notfound.status,404);
 }finally{await new Promise((ok,fail)=>server.close(e=>e?fail(e):ok()));await rm(d,{recursive:true,force:true});}
});
test('server rate limit is enforced',async()=>{
 const d=await mkdtemp(join(tmpdir(),'as-server-'));const {server,listen}=createReportServer({dir:d,token,port:0,rateLimit:1});const a=await listen();const url=`http://127.0.0.1:${a.port}/health`;
 try{assert.equal((await fetch(url,{headers:{authorization:`Bearer ${token}`}})).status,200);assert.equal((await fetch(url,{headers:{authorization:`Bearer ${token}`}})).status,429);}finally{await new Promise(ok=>server.close(ok));await rm(d,{recursive:true,force:true});}
});
