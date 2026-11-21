/** Optional browser observation adapter. Requires explicit, separately installed playwright and @axe-core/playwright. */
import { DISCLAIMER } from '../core/checks.mjs';
export function permittedUrl(value) {
  let u; try {u=new URL(value);}catch{return false;}
  if (u.username || u.password) return false;
  if (u.protocol==='file:') return true;
  return ['http:','https:'].includes(u.protocol) && ['127.0.0.1','localhost','[::1]'].includes(u.hostname);
}
export async function browserAudit(url,{tabs=15,axe=true}={}) {
  if(!permittedUrl(url))throw new Error('Browser adapter only accepts file: or loopback URLs; external origins are blocked');
  if(!Number.isInteger(tabs)||tabs<1||tabs>60)throw new Error('Tab count must be 1-60');
  let playwright;try{playwright=await import('playwright');}catch{throw new Error('Optional dependency playwright not installed; install explicitly after reviewing package and license');}
  const browser=await playwright.chromium.launch({headless:true});
  try {
    const context=await browser.newContext({acceptDownloads:false,serviceWorkers:'block'});
    await context.route('**/*',route=>permittedUrl(route.request().url())?route.continue():route.abort('blockedbyclient'));
    const page=await context.newPage();
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
    const focus=[];
    for(let i=0;i<tabs;i++){
      await page.keyboard.press('Tab');
      const sample=await page.evaluate(()=>{
        const el=document.activeElement;
        if(!el||el===document.body)return {tag:'BODY',selector:'body',focused:false};
        const parts=[];let cur=el;
        while(cur&&cur.nodeType===1&&parts.length<8){const tag=cur.tagName.toLowerCase();let nth=1;for(let p=cur.previousElementSibling;p;p=p.previousElementSibling)if(p.tagName===cur.tagName)nth++;parts.unshift(tag+':nth-of-type('+nth+')');cur=cur.parentElement;}
        return {tag:el.tagName,selector:parts.join(' > '),focused:true};
      });
      focus.push({step:i+1,...sample});
    }
    let axeResult={status:'not-run'};
    if(axe){
      let AxeBuilder;try{AxeBuilder=(await import('@axe-core/playwright')).default;}catch{throw new Error('Optional @axe-core/playwright dependency missing');}
      const results=await new AxeBuilder({page}).analyze();
      axeResult={status:'executed',engine:'axe-core via @axe-core/playwright',violations:results.violations.map(v=>({ruleId:v.id,impact:v.impact,help:v.help,affectedNodes:v.nodes.length,targets:v.nodes.map(n=>n.target).slice(0,5)})),incompleteCount:results.incomplete.length,passedRuleCount:results.passes.length};
    }
    return {status:'browser-observed',urlScope:new URL(url).protocol==='file:'?'local-file':'loopback',browser:'Chromium via Playwright',version:browser.version(),focus,axe:axeResult,
      notes:['Tab sampling alone does not prove correct focus order or absence of traps','No form submission, screenshots or input values collected','Screen reader and real task completion require human review'],disclaimer:DISCLAIMER};
  }finally{await browser.close();}
}
