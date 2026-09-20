export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets", public: "." });
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
