#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const contractPath = 'docs/project-contract.md';
const usage = 'Usage: node scripts/mds.mjs context [--source <clone>] [--check | --remote | --doc docs/<guide>.md]';

export function normalizeRepository(value) {
  if (typeof value !== 'string' || value.length > 200) {
    throw new Error('MDS repository must be a GitHub HTTPS or git SSH URL without credentials.');
  }
  const match = /^(?:https:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([a-z\d][a-z\d-]{0,38})\/([a-z\d_.-]+)\/?$/i.exec(value);
  const repository = match?.[2].replace(/\.git$/i, '');
  if (!match || !repository || repository === '.' || repository === '..') {
    throw new Error('MDS repository must be a GitHub HTTPS or git SSH URL without credentials.');
  }
  return `https://github.com/${match[1].toLowerCase()}/${repository.toLowerCase()}.git`;
}

function gitEnvironment(environment) {
  const clean = { ...environment, GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1' };
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY',
    'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE', 'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_COUNT']) {
    delete clean[name];
  }
  return clean;
}

function git(sourcePath, args, failure, environment) {
  const result = spawnSync('git', ['--no-replace-objects', '-C', sourcePath, ...args], {
    encoding: 'utf8', env: gitEnvironment(environment), timeout: 5000, maxBuffer: 256 * 1024,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) throw new Error(failure);
  return result.stdout;
}

export function loadContext({ projectRoot = resolve(dirname(scriptPath), '..'), source,
  environment = process.env } = {}) {
  projectRoot = resolve(projectRoot);
  let manifest;
  try {
    const manifestPath = join(projectRoot, 'mds.json');
    if (statSync(manifestPath).size > 64 * 1024) throw new Error('oversized');
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error(`Cannot read a valid mds.json in ${projectRoot}. Adopt MDS explicitly before continuing.`);
  }
  if (manifest?.schemaVersion !== 1) throw new Error('mds.json requires schemaVersion: 1.');
  const repository = normalizeRepository(manifest.source?.repository);
  const revision = manifest.source?.revision;
  if (typeof revision !== 'string' || !/^[a-f\d]{40}$/i.test(revision)) {
    throw new Error('mds.json source.revision must be a full 40-character Git commit SHA.');
  }
  const sourcePath = resolve(source || environment.MDS_HOME || join(projectRoot, '..', 'mds'));
  if (!existsSync(sourcePath) || !statSync(sourcePath).isDirectory() || !existsSync(join(sourcePath, '.git'))) {
    throw new Error(`MDS checkout unavailable: ${sourcePath}. Set --source or MDS_HOME; clone/fetch is never automatic.`);
  }
  const run = (args, failure) => git(sourcePath, args, failure, environment);
  const checkoutRoot = run(['rev-parse', '--show-toplevel'], 'MDS source must be a Git working checkout.').trim();
  if (realpathSync(checkoutRoot) !== realpathSync(sourcePath)) {
    throw new Error('MDS source must point to the root of its Git working checkout.');
  }
  const origin = run(['config', '--local', '--get', 'remote.origin.url'], 'MDS checkout requires an origin remote.').trim();
  if (normalizeRepository(origin) !== repository) throw new Error('MDS origin does not match mds.json source.repository.');
  const type = run(['cat-file', '-t', revision], `Pinned MDS revision ${revision} is unavailable locally. Fetch explicitly and retry.`).trim();
  if (type !== 'commit') throw new Error('mds.json source.revision must identify a Git commit.');
  const contract = run(['show', '--no-ext-diff', '--no-textconv', `${revision}:${contractPath}`],
    `Pinned MDS revision ${revision} has no readable ${contractPath}.`).trimEnd();
  if (!contract.trim()) throw new Error(`Pinned MDS ${contractPath} is empty.`);
  return { projectRoot, sourcePath, repository, revision: revision.toLowerCase(), contract };
}

export function readPinnedDocument(context, documentPath, { environment = process.env } = {}) {
  // Accept one canonical documentation path, never a filesystem path or Git expression.
  if (typeof documentPath !== 'string' || documentPath.length > 240 || documentPath !== documentPath.trim()
    || !/^docs\/(?:[a-z\d][a-z\d_-]*\/)*[a-z\d][a-z\d._-]*\.md$/i.test(documentPath)) {
    throw new Error('--doc requires a canonical docs/<guide>.md path without traversal.');
  }
  const run = (args, failure) => git(context.sourcePath, args, failure, environment);
  const failure = `Pinned MDS revision ${context.revision} has no regular Markdown document ${documentPath}.`;
  const entry = run(['ls-tree', '-z', context.revision, '--', documentPath], failure).split('\t');
  if (!/^(100644|100755) blob [a-f\d]{40}$/.test(entry[0]) || entry[1] !== documentPath + '\0') {
    throw new Error(failure);
  }
  const content = run(['show', '--no-ext-diff', '--no-textconv', `${context.revision}:${documentPath}`], failure).trimEnd();
  if (!content.trim()) throw new Error(`Pinned MDS ${documentPath} is empty.`);
  return content;
}

export function checkRemote(context, { environment = process.env, timeout = 5000 } = {}) {
  // Keep the user's global credentials/config while excluding the parent's local
  // Git config by querying the validated HTTPS URL outside its checkout.
  const env = gitEnvironment(environment);
  const result = spawnSync('git', ['ls-remote', '--refs',
    context.repository, 'refs/heads/main'], {
    cwd: tmpdir(), env, encoding: 'utf8', timeout, maxBuffer: 64 * 1024, windowsHide: true,
  });
  const match = !result.error && result.status === 0
    && /^([a-f\d]{40})\trefs\/heads\/main\s*$/i.exec(result.stdout);
  if (!match) return { status: 'unavailable' };
  const revision = match[1].toLowerCase();
  return { status: revision === context.revision ? 'current' : 'different', revision };
}

export function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
    return 0;
  }
  try {
    if (args[0] !== 'context') throw new Error(usage);
    let source;
    let documentPath;
    let check = false;
    let remote = false;
    for (let index = 1; index < args.length; index++) {
      const argument = args[index];
      if (argument === '--source' && !source && args[index + 1] && !args[index + 1].startsWith('--')) {
        source = args[++index];
      } else if (argument === '--doc' && !documentPath && args[index + 1] && !args[index + 1].startsWith('--')) {
        documentPath = args[++index];
      } else if (argument === '--check' && !check) check = true;
      else if (argument === '--remote' && !remote) remote = true;
      else throw new Error(usage);
    }
    if (check && remote) throw new Error('--check does not access the network; use --remote separately.');
    if (documentPath && (check || remote)) throw new Error('--doc reads one pinned document locally; use --check or --remote separately.');
    const context = loadContext({ source });
    const content = documentPath ? readPinnedDocument(context, documentPath) : context.contract;
    if (check) {
      console.log(`MDS parent valid: ${context.repository}@${context.revision} (${context.sourcePath}).`);
      return 0;
    }
    const documentLabel = documentPath ? `MDS document: ${documentPath}` : `MDS contract: ${contractPath}`;
    console.log(`MDS project: ${context.projectRoot}\nMDS source: ${context.sourcePath}\nMDS repository: ${context.repository}\nMDS revision: ${context.revision}\n${documentLabel} (pinned Git content)\n`);
    if (remote) {
      const result = checkRemote(context);
      if (result.status === 'unavailable') {
        console.warn(`Warning: MDS remote check unavailable; pinned revision ${context.revision} remains effective.`);
      } else {
        console.log(`MDS remote main: ${result.revision} (${result.status === 'current' ? 'matches pin' : 'differs from pin; review an explicit update'}).\n`);
      }
    }
    console.log(content);
    return 0;
  } catch (error) {
    console.error('MDS error: ' + String(error.message).slice(0, 1000));
    return 2;
  }
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(scriptPath)) {
  process.exitCode = main();
}
