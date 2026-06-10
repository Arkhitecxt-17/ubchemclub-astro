import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
    image: {
                domains: [],
        remotePatterns: [],
    },
    site: "https://ubchemclub-astro.202101335.workers.dev",
    integrations: [mdx(), sitemap(), react()],
    adapter: cloudflare({
        platformProxy: {
            enabled: true,
        },
    }),
    vite: {
        plugins: [tailwindcss()],
    },
});