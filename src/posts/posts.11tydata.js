const isHidden = (data) =>
  process.env.PREVIEW_DRAFTS !== "true" &&
  (data.draft || new Date(data.date) > new Date());
export default {
  layout: "layouts/post.njk",
  isPost: true,
  eleventyComputed: {
    permalink: (data) =>
      isHidden(data) ? false : `/blog/${data.page.fileSlug}/index.html`,
    eleventyExcludeFromCollections: (data) => isHidden(data),
  },
};
