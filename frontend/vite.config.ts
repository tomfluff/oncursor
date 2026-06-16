import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Copies dist/index.html -> dist/404.html after build. GitHub Pages serves
// 404.html for any unknown path, so this makes client-side routes (e.g.
// /oncursor/embed) and refreshes load the SPA instead of a hard 404.
const spaFallback = {
    name: "spa-github-pages-404",
    closeBundle() {
        const index = resolve("dist", "index.html");
        if (existsSync(index)) {
            copyFileSync(index, resolve("dist", "404.html"));
        }
    },
};

// https://vite.dev/config/
export default defineConfig({
    // Served from https://tomfluff.github.io/oncursor/
    base: "/oncursor/",
    plugins: [react(), spaFallback],
    resolve: {
        alias: {
            "@tabler/icons-react":
                "@tabler/icons-react/dist/esm/icons/index.mjs",
        },
    },
    server: { port: 3000, host: true },
    preview: { port: 3000, host: true },
});
