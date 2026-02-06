import { defineCollection, defineBlock, f } from "../lib/schema";

// Reusable image block with metadata
const imageBlock = defineBlock({
  name: "image",
  label: "Image",
  fields: [
    f.image("src", { label: "Image", required: true }),
    f.string("alt", { label: "Alt text" }),
    f.string("caption"),
    f.select("size", {
      label: "Size",
      options: ["small", "medium", "large", "full"],
      default: "large",
    }),
  ],
});

export default defineCollection({
  name: "post",
  label: "Blog Posts",
  fields: [
    f.string("title", { required: true }),
    f.slug("slug", { from: "title" }),
    f.block("featuredImage", { block: imageBlock, label: "Featured Image" }),
    f.richtext("content"),
    f.datetime("publishedAt"),
    f.boolean("isGood"),
  ],
});
