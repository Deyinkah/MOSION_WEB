import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    image: z.string(),
    ogImage: z.string().optional(),
    category: z.string(),
    publishedAt: z.string(),
    readingTime: z.string(),
    author: z.string(),
  }),
});

export const collections = { blog };
