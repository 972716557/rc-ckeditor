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
      assetsDir: "",
      outDir: "lib",
      plugins: [
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
