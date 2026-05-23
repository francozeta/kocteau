import { execFileSync } from "node:child_process";

const base = process.env.CHANGELOG_BASE ?? "origin/main";
const range = process.env.CHANGELOG_RANGE ?? `${base}..HEAD`;
const limit = process.env.CHANGELOG_LIMIT ?? "30";

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function readCommits(revision, extraArgs = []) {
  const format = "%h%x09%cs%x09%s";

  try {
    return git(["log", "--pretty=format:" + format, ...extraArgs, revision]);
  } catch {
    return "";
  }
}

let rawCommits = readCommits(range);

if (!rawCommits) {
  rawCommits = readCommits(base, [`--max-count=${limit}`]);
}

if (!rawCommits) {
  rawCommits = readCommits("HEAD", [`--max-count=${limit}`]);
}

const commits = rawCommits
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [hash, date, subject] = line.split("\t");
    return { hash, date, subject };
  });

const publicNotes = commits.filter(({ subject }) =>
  /^(feat|fix|docs|perf|style|refactor)\b(?:\([^)]+\))?:/i.test(subject),
);

const notes = publicNotes.length > 0 ? publicNotes : commits;

console.log("## Draft from git commits");
console.log("");
console.log(
  "Use this as raw material only. Edit the language before publishing it in `apps/web/content/help/changelog.mdx`.",
);
console.log("");

for (const { hash, date, subject } of notes) {
  const cleanSubject = subject.replace(
    /^(feat|fix|docs|perf|style|refactor|chore)\b(?:\([^)]+\))?:\s*/i,
    "",
  );
  console.log(`- ${date} · ${cleanSubject} (${hash})`);
}
