#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const types = 'feat|fix|docs|refactor|perf|test|chore|build|ci|revert';
const branchPattern = new RegExp(`^(${types})/[a-z0-9]+(?:-[a-z0-9]+)*$`);
const subjectPattern = new RegExp(`^(${types})(?:\\(([a-z0-9]+(?:[./-][a-z0-9]+)*)\\))?!?: ([^\\r\\n]+)$`);
const agentPrefix = /^(?:codex|claude|copilot|chatgpt|ai|agent|bot)(?:\/|$)/i;
const agentScope = /^(?:codex|claude|copilot|chatgpt|ai|agent|bot)$/i;
const usage = 'Usage: node scripts/check-git.mjs --branch <type/slug> [--title <PR title>] [--base <sha> --head <sha>] [--repo <path>]';

function parseArgs(args) {
  const options = {};
  const names = new Set(['--branch', '--title', '--base', '--head', '--repo']);
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (!names.has(flag) || Object.hasOwn(options, flag.slice(2))) {
      throw new Error(`Unknown or duplicate option: ${flag}`);
    }
    const value = args[++i];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[flag.slice(2)] = value;
  }
  if (!options.branch) throw new Error('--branch is required');
  if (Object.hasOwn(options, 'base') !== Object.hasOwn(options, 'head')) {
    throw new Error('--base and --head must be supplied together');
  }
  for (const name of ['base', 'head']) {
    if (Object.hasOwn(options, name) && !/^[a-f0-9]{7,64}$/i.test(options[name])) {
      throw new Error(`--${name} must be a commit SHA (at least 7 hexadecimal characters)`);
    }
  }
  return options;
}

function git(repo, args, input) {
  const result = spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8', input, maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Git ${args[0]} failed: ${result.error?.message || result.stderr.trim()}`);
  }
  return result.stdout;
}

function validSubject(subject) {
  const match = subject.match(subjectPattern);
  return Boolean(match && !agentScope.test(match[2] || '') && match[3].trim());
}

function isAgentCoauthor(value) {
  const identity = value.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  const name = (identity?.[1] || value).trim();
  const email = (identity?.[2] || '').toLowerCase();
  // Exact tool names and known automated identities avoid confusing a human
  // such as Claude Shannon with an assistant.
  return /^(?:codex(?: cli)?|claude(?: code)?|(?:github )?copilot|chatgpt|ai[ -]assistant)(?:\s*\[bot\])?$/i.test(name)
    || /^(?:codex|chatgpt)(?:[+.-][^@]+)?@openai\.com$/.test(email)
    || /^noreply@anthropic\.com$/.test(email)
    || /^(?:\d+\+)?(?:copilot|copilot-swe-agent|github-copilot|codex|chatgpt)(?:\[bot\])?@users\.noreply\.github\.com$/.test(email);
}

function check(options) {
  const errors = [];
  if (agentPrefix.test(options.branch) || !branchPattern.test(options.branch)) {
    errors.push('Branch must use <type>/<lower-kebab-slug> with an allowed type and no agent prefix.');
  }
  if (Object.hasOwn(options, 'title') && !validSubject(options.title)) {
    errors.push('PR title must use type(optional-scope): non-empty summary (optional !), without an agent prefix or scope.');
  }
  let commits = [];
  if (options.base) {
    const repo = resolve(options.repo || '.');
    const base = git(repo, ['rev-parse', '--verify', '--end-of-options', `${options.base}^{commit}`]).trim();
    const head = git(repo, ['rev-parse', '--verify', '--end-of-options', `${options.head}^{commit}`]).trim();
    commits = git(repo, ['rev-list', '--reverse', `${base}..${head}`, '--']).trim().split('\n').filter(Boolean);
    for (const sha of commits) {
      const message = git(repo, ['show', '-s', '--format=%B', sha, '--']);
      const subject = message.split(/\r?\n/, 1)[0];
      if (!validSubject(subject)) errors.push(`${sha.slice(0, 7)}: commit subject must use Conventional Commits without an agent prefix or scope.`);
      const trailers = git(repo, ['interpret-trailers', '--parse'], message);
      for (const trailer of trailers.split(/\r?\n/)) {
        const coauthor = trailer.match(/^Co-authored-by:\s*(.*)$/i);
        if (coauthor && isAgentCoauthor(coauthor[1])) {
          errors.push(`${sha.slice(0, 7)}: remove the automated Co-authored-by trailer; preserve human authorship.`);
        }
      }
    }
  }
  for (const error of errors) console.error(`error    ${error}`);
  if (errors.length) return 1;
  console.log(`Git conventions passed (branch${Object.hasOwn(options, 'title') ? ', PR title' : ''}${options.base ? `, ${commits.length} commit(s)` : ''}).`);
  return 0;
}

if (process.argv.length === 3 && process.argv[2] === '--help') {
  console.log(usage);
} else {
  try {
    process.exitCode = check(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    console.error(usage);
    process.exitCode = 2;
  }
}
