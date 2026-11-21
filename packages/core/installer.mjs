import { cp, mkdir, lstat } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute } from 'node:path';
const HOSTS = new Set(['claude', 'cursor', 'codex', 'gemini', 'copilot', 'windsurf', 'cline', 'roo', 'continue']);
export function supportedHosts() { return [...HOSTS]; }
const inside = (parent, child) => { const r = relative(resolve(parent), resolve(child)); return r === '' || (!r.startsWith('..') && !isAbsolute(r)); };

/** Copies portable instruction files into <target>/accesssutra. Never writes outside the target; refuses the source repo. */
export async function installIde({ repoRoot, target, host, force = false, dryRun = false }) {
  if (!HOSTS.has(host)) throw new Error('Unsupported host ' + host);
  const base = resolve(target); const output = join(base, 'accesssutra');
  if (inside(repoRoot, base)) throw new Error('Choose an external project target, not the AccessSutra source repository');
  let exists = false;
  try { const stat = await lstat(output); if (stat.isSymbolicLink()) throw new Error('Destination symlink refused'); exists = true; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (exists && !force) throw new Error('Destination exists; use --force only after reviewing contents');
  const folders = ['skills', 'agents', 'rules', 'workflows', 'schemas'];
  const files = ['AGENTS.md', 'CLAUDE.md', 'AccessSutra_AI_Claude_Master_Prompt.md'];
  const result = { host, destination: output, dryRun, wouldCopy: [...folders, ...files, `adapters/ide/${host}`], note: 'Project-local instructions only; host-native agent execution not verified by this copier.' };
  if (dryRun) return result;
  await mkdir(output, { recursive: true });
  for (const folder of folders) await cp(join(repoRoot, folder), join(output, folder), { recursive: true, force });
  for (const file of files) await cp(join(repoRoot, file), join(output, file), { force });
  await cp(join(repoRoot, 'adapters', 'ide', host), join(output, 'host'), { recursive: true, force });
  return result;
}
