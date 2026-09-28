import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve("_site");
const site = JSON.parse(readFileSync("src/_data/site.json", "utf8"));
const papers = JSON.parse(readFileSync("src/_data/publications.json", "utf8"));
const errors = [];
const check = (ok, message) => {
  if (!ok) errors.push(message);
};
const pages = site.navigation.map((item) => join(root, item.url, "index.html"));
pages.push(join(root, "404.html"));
const visit = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? visit(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
for (const path of visit(join(root, "blog")))
  if (path.endsWith(".html") && !pages.includes(path)) pages.push(path);

for (const file of pages) {
  check(existsSync(file), `Missing page: ${file}`);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  check(
    (html.match(/<h1\b/g) || []).length === 1,
    `${file}: expected one main heading`,
  );
  check(
    html.includes("<title>") && html.includes('name="description"'),
    `${file}: missing search metadata`,
  );
  check(
    !html.includes("Unpublished draft") && !html.includes("Draft preview"),
    `${file}: draft content leaked`,
  );
  check(
    !html.includes("{{") && !html.includes("{%"),
    `${file}: unrendered template`,
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  check(new Set(ids).size === ids.length, `${file}: duplicate element IDs`);
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!raw.startsWith("/") || raw.startsWith("//")) continue;
    const pathname = new URL(raw.replaceAll("&amp;", "&"), site.url).pathname;
    const target = join(
      root,
      decodeURIComponent(pathname),
      pathname.endsWith("/") ? "index.html" : "",
    );
    check(existsSync(target), `${file}: missing internal link or asset ${raw}`);
  }
}
const publicationHTML = readFileSync(
  join(root, "publications/index.html"),
  "utf8",
);
check(
  (publicationHTML.match(/data-publication\s/g) || []).length === papers.length,
  "Publication count does not match the data",
);
check(
  new Set(papers.map((paper) => paper.id)).size === papers.length,
  "Publication IDs must be unique",
);
for (const paper of papers) {
  check(paper.authors.includes(site.name), `${paper.id}: author is missing`);
  check(
    ["Conference", "Preprint"].includes(paper.kind),
    `${paper.id}: unknown publication type`,
  );
  for (const key of ["paper", "pdf", "code"])
    if (paper[key])
      check(
        paper[key].startsWith("https://"),
        `${paper.id}: ${key} must be an HTTPS URL`,
      );
}
for (const name of readdirSync("src/posts").filter((file) =>
  file.endsWith(".md"),
)) {
  const source = readFileSync(join("src/posts", name), "utf8");
  const date = source.match(/^date:\s*(.+)$/m)?.[1];
  if (
    /^draft:\s*true\s*$/m.test(source) ||
    (date && new Date(date) > new Date())
  ) {
    const slug = name.replace(/\.md$/, "");
    check(
      !existsSync(join(root, "blog", slug)),
      `Unpublished post emitted: ${slug}`,
    );
    for (const file of [
      "feed.xml",
      "sitemap.xml",
      "blog/index.html",
      "index.html",
    ]) {
      check(
        !readFileSync(join(root, file), "utf8").includes(`/blog/${slug}/`),
        `Unpublished post in ${file}: ${slug}`,
      );
    }
  }
}
for (const file of [
  "feed.xml",
  "sitemap.xml",
  "robots.txt",
  ".nojekyll",
  "llm.html",
  "demos/image-classifier.html",
  "googlea3642c7d280c95c7.html",
])
  check(existsSync(join(root, file)), `Missing output: ${file}`);
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  `Checked ${pages.length} pages, ${papers.length} publications, internal links, metadata, and unpublished-post exclusion.`,
);
