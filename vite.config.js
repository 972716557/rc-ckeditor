import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "lib",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/index.jsx",
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
      plugins: [
        // 将 CSS 中的 @import 规则转换为 index.css 中的 CSS 代码
        require("postcss-import")(),
        // 处理 CSS 中的 url(...)
        require("postcss-url")(),
        babel({
          exclude: "node_modules/**",
          presets: ["@babel/preset-env", "@babel/preset-react"],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        }),
        commonjs(),
      ],
    },
  },
});
