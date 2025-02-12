import vitejsPluginReact from "@vitejs/plugin-react";

export default {
  server: {
    open: "index.html",
  },
  plugins: [vitejsPluginReact()],
  css: {
    preprocessorOptions: {
      less: {
        // 可以根据需要添加 Less 配置选项
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};
