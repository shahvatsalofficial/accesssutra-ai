import { createHash } from 'node:crypto';
import { DISCLAIMER } from './checks.mjs';
const TEMPLATE = [
  ['keyboard-navigation','Keyboard-only journey','Use Tab and Shift+Tab to reach all essential controls; note focus order and unexpected changes.',['2.1.1','2.4.3']],
  ['keyboard-trap','No keyboard trap','Move into and out of dialogs, menus and widgets using only keyboard; document any trapped focus.',['2.1.2']],
  ['focus-visibility','Focus visibility','At each step, visually locate focus and check it is not fully hidden by sticky UI.',['2.4.7','2.4.11']],
  ['keyboard-activation','Control activation','Activate controls using Enter/Space where appropriate; do not submit real data.',['2.1.1']],
  ['form-labels','Field names and instructions','Verify labels and instructions are understood and announced by selected assistive technology.',['3.3.2','4.1.2']],
  ['form-errors','Error identification and recovery','Use synthetic values on a safe test instance; confirm error identification, correction suggestions and focus.',['3.3.1','3.3.3']],
  ['screen-reader','Screen reader journey','With a named AT/browser/OS combination, verify landmarks, names, state and errors; record observations.',['1.3.1','4.1.2','4.1.3']],
  ['zoom-reflow','Zoom and reflow','Check 200% zoom, narrow viewport and text resizing without losing essential functionality.',['1.4.4','1.4.10']],
  ['contrast','Visual contrast','Measure text and essential UI contrast using an approved tool; include sampled colors and conditions.',['1.4.3','1.4.11']],
  ['cognitive','Comprehension and completion','Ask a participant or qualified reviewer to assess clarity, predictable navigation, timing and task completion.',['3.2.3','3.3.2']]
];
export function createManualPlan(task) {
  if (!task || typeof task !== 'object' || typeof task.name !== 'string' || !task.name.trim()) throw new Error('Task needs nonempty name');
  if (!Array.isArray(task.steps) || !task.steps.length || task.steps.length > 30 || task.steps.some(s=>typeof s !== 'string' || !s.trim() || s.length>300)) throw new Error('Task needs 1-30 short steps');
  const taskId = 'TASK-'+createHash('sha256').update(task.name+'|'+task.steps.join('|')).digest('hex').slice(0,10);
  return {schemaVersion:'1.0.0',product:'AccessSutra AI',task:{id:taskId,name:task.name,steps:task.steps,environment:task.environment??'Specify browser/OS/AT before review',dataPolicy:'Use synthetic test data only; never submit production forms.'},
    checks:TEMPLATE.map(([id,title,instructions,wcagCandidateRefs])=>({id, title,instructions,wcagCandidateRefs,status:'not-run',reviewer:null,environment:null,observation:null})),
    completion:{status:'not-tested',passed:0,failed:0,notRun:TEMPLATE.length},disclaimer:DISCLAIMER};
}
export function applyObservations(plan, observations) {
  if (!plan?.checks || !Array.isArray(observations)) throw new Error('Invalid manual plan or observations');
  const allowed=new Set(['passed','failed','blocked','not-run','inconclusive']);
  const used=new Set();
  const result=structuredClone(plan);
  for (const o of observations) {
    if (!o || typeof o.id!=='string' || !allowed.has(o.status) || used.has(o.id)) throw new Error('Invalid or duplicate observation');
    used.add(o.id); const check=result.checks.find(c=>c.id===o.id); if (!check) throw new Error('Unknown manual check '+o.id);
    if (o.status!=='not-run' && (!o.reviewer || !o.environment || !o.observation)) throw new Error('Human reviewer, environment and observation required for tested check');
    for(const s of [o.reviewer,o.environment,o.observation]) {
      if(s!==undefined && (typeof s!=='string' || s.length>500)) throw new Error('Invalid observation field');
      if(typeof s==='string' && (/-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(s) || /(?:bearer\s+[A-Za-z0-9._-]{16,}|(?:api[_-]?key|password|secret)\s*[:=]\s*\S{8,})/i.test(s))) throw new Error('Sensitive credential-like content in observation; redact before storing');
    }
    Object.assign(check,{status:o.status,reviewer:o.reviewer??null,environment:o.environment??null,observation:o.observation??null});
  }
  const counts={passed:result.checks.filter(c=>c.status==='passed').length,failed:result.checks.filter(c=>['failed','blocked'].includes(c.status)).length,notRun:result.checks.filter(c=>c.status==='not-run').length,inconclusive:result.checks.filter(c=>c.status==='inconclusive').length};
  result.completion={status:counts.notRun?'partial-human-observation':'human-observations-recorded',...counts,attestation:'Reviewer-provided observations; not independently validated by the software.'};
  return result;
}
