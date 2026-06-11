import { glob, file } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
  }),
});

const team = defineCollection({
  loader: glob({ base: "./src/content/team", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    image: z.string(),
  }),
});

const events = defineCollection({
  loader: glob({ base: "./src/content/events", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    image: z.string().optional(),
    status: z.enum(["upcoming", "past"]),
    gallery: z.array(z.string()).optional(),
  }),
});

const opportunities = defineCollection({
  loader: glob({ base: "./src/content/opportunities", pattern: "**/*.{md,json}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    deadline: z.coerce.date().optional(),
    type: z.string(),
    link: z.string().optional(),
    contact: z.string().optional(),
  }),
});

const newsletter = defineCollection({
  loader: glob({ base: "./src/content/newsletter", pattern: "**/*.{md,json}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    file: z.string(),
    image: z.string().optional(),
  }),
});

const home = defineCollection({
  loader: file("src/content/settings/home.json"),
  schema: z.object({
    heroHeading: z.string(),
    heroSubheading: z.string(),
    heroImages: z.array(z.string()),
    aboutHeading: z.string(),
    aboutText: z.string(),
    statsItems: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })),
  }),
});

export const collections = { blog, team, events, opportunities, newsletter, home };