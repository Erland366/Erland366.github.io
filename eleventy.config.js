import markdownIt from "markdown-it";
import katex from "@vscode/markdown-it-katex";
import shiki from "@shikijs/markdown-it";

export default async function (eleventyConfig) {
  const md = markdownIt({ html: true }).use(katex.default ?? katex);
  md.use(
    await shiki({
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      fallbackLanguage: "text",
    }),
  );
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addPassthroughCopy({
    "src/assets": "assets",
    public: ".",
    "node_modules/katex/dist/katex.min.css": "assets/katex/katex.min.css",
    "node_modules/katex/dist/fonts": "assets/katex/fonts",
  });
  eleventyConfig.addFilter("displayDate", (value) =>
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value)),
  );
  eleventyConfig.addFilter("isoDate", (value) => new Date(value).toISOString());
  eleventyConfig.addFilter("rfcDate", (value) => new Date(value).toUTCString());
  eleventyConfig.addFilter("readingTime", (text) =>
    Math.max(
      1,
      Math.ceil(
        String(text)
          .replace(/<[^>]*>/g, " ")
          .split(/\s+/).length / 220,
      ),
    ),
  );
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/posts/*.md")
      .filter(
        (post) =>
          process.env.PREVIEW_DRAFTS === "true" ||
          (!post.data.draft && post.date <= new Date()),
      )
      .sort((a, b) => b.date - a.date),
  );
  eleventyConfig.addGlobalData("buildYear", new Date().getUTCFullYear());
  eleventyConfig.addGlobalData(
    "previewDrafts",
    process.env.PREVIEW_DRAFTS === "true",
  );
  return {
    dir: { input: "src", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
