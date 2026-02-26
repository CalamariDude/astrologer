import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

// react-reconciler@0.27 needs scheduler@0.21, but react-dom@18.3 installs
// scheduler@0.23 at the root.  Vite's pre-bundler (esbuild) deduplicates to
// the root copy, which has a different internal API → runtime crash.
// This plugin makes sure react-reconciler (and R3F, which re-exports it)
// always gets the nested scheduler@0.21 while react-dom keeps using 0.23.
const nestedSchedulerDir = path.resolve(
  __dirname,
  "node_modules/react-reconciler/node_modules/scheduler",
);

function fixSchedulerPlugin(): Plugin {
  return {
    name: "fix-scheduler-resolution",
    enforce: "pre",

    // Rollup phase (dev serve + production build)
    resolveId(source, importer) {
      if (!importer) return null;
      const needsNested =
        importer.includes("react-reconciler") ||
        importer.includes("@react-three");
      if (!needsNested) return null;

      if (source === "scheduler") {
        return path.join(nestedSchedulerDir, "index.js");
      }
      if (source.startsWith("scheduler/")) {
        return path.join(
          nestedSchedulerDir,
          source.slice("scheduler/".length),
        );
      }
      return null;
    },

    // esbuild phase (optimizeDeps pre-bundling)
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              {
                name: "fix-scheduler-esbuild",
                setup(build) {
                  build.onResolve({ filter: /^scheduler(\/.*)?$/ }, (args) => {
                    const fromR3F =
                      args.importer.includes("react-reconciler") ||
                      args.importer.includes("@react-three");
                    if (!fromR3F) return null;

                    if (args.path === "scheduler") {
                      return {
                        path: path.join(nestedSchedulerDir, "index.js"),
                      };
                    }
                    return {
                      path: path.join(
                        nestedSchedulerDir,
                        args.path.slice("scheduler/".length),
                      ),
                    };
                  });
                },
              },
            ],
          },
        },
      };
    },
  };
}

export default defineConfig({
  server: {
    host: "::",
    port: 3000,
    proxy: {
      "/nominatim": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/nominatim/, ""),
        headers: { "User-Agent": "Astrologer/1.0 (astrology chart app)" },
      },
    },
  },
  plugins: [fixSchedulerPlugin(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: [
            "@react-three/fiber",
            "@react-three/drei",
            "@react-three/postprocessing",
          ],
          pdf: ["jspdf"],
          mapbox: ["mapbox-gl"],
          posthog: ["posthog-js"],
        },
      },
    },
  },
});
