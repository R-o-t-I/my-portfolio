import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import babel from "@rolldown/plugin-babel";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      // Это позволит импортировать SVG как компоненты по умолчанию
      svgrOptions: { exportType: "default", dimensions: false },
      include: "**/*.svg",
    }),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Настраиваем алиас
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Указываем Vite использовать современный API компилятора
        api: "modern-compiler",
        additionalData: `
          @use "@/styles/_variables.scss" as *;
          @use "@/styles/_mixins.scss" as *;
        `,
      },
    },
  },
});
