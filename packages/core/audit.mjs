import { createHash } from 'node:crypto';
import { readFile, appendFile } from 'node:fs/promises';
const digest = s => createHash('sha256').update(s).digest('hex');
export function hashEvent(event) { const {hash,...body}=event; return digest(JSON.stringify(body)); }
export function verifyLedger(text) {
  let previous='GENESIS', count=0;
  for (const line of text.split('\n').filter(Boolean)) {
    let e; try {e=JSON.parse(line);}catch{ return {valid:false,count,reason:'Malformed JSONL'}; }
    if (e.previous!==previous || e.hash!==hashEvent(e)) return {valid:false,count,reason:'Broken chain at event '+(count+1)};
    previous=e.hash; count++;
  }
  return {valid:true,count,head:previous,limitation:'Hash chain is not signed, immutable or tamper-proof against a privileged rewrite.'};
}
export async function appendAudit(file,type,details={}) {
  let old=''; try {old=await readFile(file,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
  const status=verifyLedger(old); if(!status.valid)throw new Error('Audit ledger verification failed');
  const e={seq:status.count+1,type,details,previous:status.head,timestamp:new Date().toISOString()};e.hash=hashEvent(e);
  await appendFile(file,JSON.stringify(e)+'\n',{mode:0o600});return e;
}
