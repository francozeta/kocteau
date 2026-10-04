import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
export const catalogPath = path.join(repositoryRoot, "docs/meta.json");
const output = fileURLToPath(new URL("../.generated/docs/", import.meta.url));
const repositoryUrl = "https://github.com/francozeta/kocteau/blob/main/";

function textContent(node) {
  return node.value ?? node.children?.map(textContent).join("") ?? "";
}

function headingSlug(value) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, "").replace(/\s/g, "-");
}

function visit(node, callback) {
  callback(node);
  node.children?.forEach((child) => visit(child, callback));
}

async function writeChanged(filename, value) {
  try {
    if (await readFile(filename, "utf8") === value) return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(filename, value);
}

export async function buildDocs() {
  const records = JSON.parse(await readFile(catalogPath, "utf8"));
  const slugs = new Set();
  const sources = new Map();
  for (const record of records) {
    if (!/^[a-z][a-z0-9-]*$/.test(record.slug) || slugs.has(record.slug)) {
      throw new Error(`Invalid or duplicate documentation route: ${record.slug}`);
    }
    for (const key of ["title", "description", "group", "source"]) {
      if (!record[key]?.trim()) throw new Error(`Missing ${key}: ${record.slug}`);
    }
    const filename = path.resolve(repositoryRoot, record.source);
    if (path.isAbsolute(record.source) || record.source.includes("\\") ||
        !filename.startsWith(repositoryRoot) || !record.source.endsWith(".md") ||
        /(^|\/)(\.plan|\.codex-private|\.env[^/]*|node_modules)(\/|$)/.test(record.source) ||
        sources.has(filename)) {
      throw new Error(`Invalid or duplicate public source: ${record.source}`);
    }
    slugs.add(record.slug);
    sources.set(filename, record);
  }

  const catalog = [];
  const markdown = {};
  const compiledPages = new Map();
  const pendingLinks = [];
  await mkdir(path.join(output, "content"), { recursive: true });
  for (const record of records) {
    const filename = path.resolve(repositoryRoot, record.source);
    const source = (await readFile(filename, "utf8")).replaceAll("\r\n", "\n");
    const headings = [];
    const ids = new Map();
    let titleId;
    function prepareDocument() {
      return (tree) => {
        visit(tree, (node) => {
          if (node.type === "heading") {
            const title = textContent(node);
            const base = headingSlug(title);
            const count = ids.get(base) ?? 0;
            ids.set(base, count + 1);
            const id = count ? `${base}-${count}` : base;
            node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
            if (node.depth === 1) titleId = id;
            else headings.push({ id, title, depth: node.depth });
          }
          if ((node.type === "link" || node.type === "definition" || node.type === "image") &&
              node.url && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(node.url)) {
            const [relative, hash] = node.url.split("#");
            const target = relative ? path.resolve(path.dirname(filename), decodeURIComponent(relative)) : filename;
            if (!target.startsWith(repositoryRoot)) throw new Error(`Link escapes repository: ${record.source}: ${node.url}`);
            pendingLinks.push({ source: record.source, target, hash });
            if (relative) {
              const registered = sources.get(target);
              const targetPath = path.relative(repositoryRoot, target).split(path.sep).map(encodeURIComponent).join("/");
              node.url = target === path.join(repositoryRoot, "docs/README.md")
                ? "/docs"
                : registered ? `/docs/${registered.slug}` : `${repositoryUrl}${targetPath}`;
              if (hash) node.url += `#${hash}`;
            }
          }
        });
        tree.children = tree.children.filter((node) => node.type !== "heading" || node.depth !== 1);
      };
    }
    const compiled = await compile({ value: source, path: filename }, {
      format: "md",
      remarkPlugins: [remarkGfm, prepareDocument],
    });
    compiledPages.set(record.slug, String(compiled));
    markdown[record.slug] = source;
    catalog.push({ ...record, href: `/docs/${record.slug}`, titleId, headings });
  }

  for (const link of pendingLinks) {
    try { await access(link.target); }
    catch { throw new Error(`Broken documentation link in ${link.source}: ${path.relative(repositoryRoot, link.target)}`); }
    if (link.hash && sources.has(link.target)) {
      const target = catalog.find((record) => record.source === sources.get(link.target).source);
      const hash = decodeURIComponent(link.hash);
      if (target.titleId !== hash && !target.headings.some((heading) => heading.id === hash)) {
        throw new Error(`Missing heading in ${target.source}: #${hash} (from ${link.source})`);
      }
    }
  }
  for (const [slug, content] of compiledPages) {
    await writeChanged(path.join(output, "content", `${slug}.js`), content);
  }
  await writeChanged(path.join(output, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  await writeChanged(path.join(output, "markdown.json"), JSON.stringify(markdown, null, 2) + "\n");
  const loaders = records.map((record) => `  "${record.slug}": () => import("./content/${record.slug}.js"),`).join("\n");
  await writeChanged(path.join(output, "loaders.ts"),
    `import type { ComponentType } from "react";\nimport type { MDXComponents } from "mdx/types";\n\nexport const documentLoaders: Record<string, () => Promise<{ default: ComponentType<{ components: MDXComponents }> }>> = {\n${loaders}\n};\n`);
  return { records, linkCount: pendingLinks.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { records, linkCount } = await buildDocs();
  console.log(`Documentation: ${records.length} pages, ${linkCount} repository links checked.`);
}
