import { defineCollection, f } from "../lib/schema";

export default defineCollection({
  name: "person",
  label: "People",
  labelField: "firstName",
  fields: [
    f.string("firstName", { required: true }),
    f.string("lastName", { required: true }),
    f.slug("slug", { from: "lastName" }),
    f.richtext("biography"),
    f.datetime("publishedAt"),
  ],
});
