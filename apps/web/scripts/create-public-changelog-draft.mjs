import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const entriesPath = path.join(repoRoot, "apps/web/content/changelog/entries.ts");
const changelogDir = path.join(repoRoot, "apps/web/content/changelog");

const source = await fs.readFile(changelogPath, "utf8");
const release = parseLatestRelease(source);

if (!release) {
  console.log("No release entry found in CHANGELOG.md.");
  process.exit(0);
}

const slug = `kocteau-${release.version.replace(/^v/i, "").replace(/\./g, "-")}`;
const componentName = toComponentName(slug);
const entryPath = path.join(changelogDir, `${slug}.mdx`);

try {
  await fs.access(entryPath);
  console.log(`Public changelog draft already exists for ${release.version}.`);
  process.exit(0);
} catch {
  // Create the new draft below.
}

await fs.writeFile(entryPath, buildMdxDraft(release), "utf8");
await updateEntriesFile({
  componentName,
  date: release.date,
  slug,
  summary: summarizeRelease(release),
  title: titleForRelease(release),
  version: release.version.replace(/^v/i, ""),
});

console.log(`Created public changelog draft for ${release.version}.`);

function parseLatestRelease(markdown) {
  const lines = markdown.split(/\r?\n/);
  let release = null;
  let currentSection = null;

  for (const line of lines) {
    const releaseMatch = line.match(/^##\s+(.*)$/);

    if (releaseMatch) {
      if (release) {
        break;
      }

      release = parseReleaseHeading(releaseMatch[1]);
      continue;
    }

    if (!release) {
      continue;
    }

    const sectionMatch = line.match(/^###\s+(.*)$/);

    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1].trim(),
        items: [],
      };
      release.sections.push(currentSection);
      continue;
    }

    const itemMatch = line.match(/^[*-]\s+(.+)$/);

    if (itemMatch) {
      if (!currentSection) {
        currentSection = {
          title: "Changes",
          items: [],
        };
        release.sections.push(currentSection);
      }

      currentSection.items.push(cleanMarkdown(itemMatch[1]));
    }
  }

  if (!release) {
    return null;
  }

  release.sections = release.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);

  return release;
}

function parseReleaseHeading(heading) {
  const linked = heading.match(/^\[([^\]]+)\]\(([^)]+)\).*?\((\d{4}-\d{2}-\d{2})\)/);
  const plain = heading.match(/^(.+?)\s+\((\d{4}-\d{2}-\d{2})\)/);

  if (linked) {
    return {
      version: linked[1],
      href: linked[2],
      date: linked[3],
      sections: [],
    };
  }

  return {
    version: plain?.[1]?.trim() ?? "unreleased",
    date: plain?.[2] ?? new Date().toISOString().slice(0, 10),
    sections: [],
  };
}

function buildMdxDraft(release) {
  const highlights = release.sections
    .filter((section) => !["Documentation", "Tests", "Build System", "Continuous Integration"].includes(section.title))
    .flatMap((section) => section.items)
    .slice(0, 5);
  const technicalSource = release.sections
    .map((section) => [`${section.title}:`, ...section.items.map((item) => `- ${item}`)].join("\n"))
    .join("\n\n");

  return `${hiddenAgentPrompt(release, technicalSource)}
## What changed

${toBullets(highlights)}

## Why it matters

This release should describe what changed for Kocteau listeners and writers, not the internal engineering work behind it. Keep the final note calm, specific, and editorial before merging.
`;
}

function hiddenAgentPrompt(release, technicalSource) {
  return `{/*
Editorial prompt:
Please rewrite this generated public changelog draft for Kocteau ${release.version}.
Audience: listeners, writers, early users.
Tone: premium, editorial, minimal, human, music-native.
Avoid: raw commit language, SaaS phrasing, hype, implementation details, fake claims.
Keep: concrete user-facing changes, why they matter, concise sections.

Technical release source:
${technicalSource}
*/}`;
}

function toBullets(items) {
  if (items.length === 0) {
    return "- Kocteau received a release focused on product polish and reliability.";
  }

  return items.map((item) => `- ${sentenceCase(stripCommitLinks(item))}`).join("\n");
}

function titleForRelease(release) {
  const items = release.sections.flatMap((section) => section.items).join(" ").toLowerCase();

  if (items.includes("mobile") || items.includes("header") || items.includes("bottom")) {
    return "A steadier mobile session";
  }

  if (items.includes("review")) {
    return "A cleaner review loop";
  }

  if (items.includes("onboarding") || items.includes("auth")) {
    return "A calmer first session";
  }

  return `Kocteau ${release.version.replace(/^v/i, "")}`;
}

function summarizeRelease(release) {
  const items = release.sections.flatMap((section) => section.items).join(" ").toLowerCase();

  if (items.includes("mobile")) {
    return "A public draft from the latest release, focused on mobile polish and the reading experience.";
  }

  if (items.includes("review")) {
    return "A public draft from the latest release, focused on reviews and discovery.";
  }

  return "A public draft from the latest Kocteau release.";
}

async function updateEntriesFile(entry) {
  let entries = await fs.readFile(entriesPath, "utf8");
  const importLine = `import ${entry.componentName} from "./${entry.slug}.mdx";`;
  const entryBlock = `  {
    slug: "${entry.slug}",
    title: "${escapeString(entry.title)}",
    date: "${entry.date}",
    version: "${entry.version}",
    summary:
      "${escapeString(entry.summary)}",
    Content: ${entry.componentName},
  },
  // public-changelog-entry`;

  if (!entries.includes(importLine)) {
    entries = entries.replace(
      /(import .+? from "\.\/.+?\.mdx";\r?\n)/,
      `$1${importLine}\n`,
    );
  }

  entries = entries.replace("  // public-changelog-entry", entryBlock);
  await fs.writeFile(entriesPath, entries, "utf8");
}

function cleanMarkdown(value) {
  return value
    .replace(/^\*\*web:\*\*\s*/i, "")
    .replace(/\s+\(\[[0-9a-f]{7,}\]\([^)]+\)\)/gi, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function stripCommitLinks(value) {
  return value.replace(/\s+\([0-9a-f]{7,}\)$/i, "");
}

function sentenceCase(value) {
  const clean = value.trim().replace(/[.。]+$/, "");
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}.`;
}

function toComponentName(slug) {
  return `${slug
    .split(/[-_]/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}Changelog`;
}

function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
