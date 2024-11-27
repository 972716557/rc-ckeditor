module.exports = {
  plugins: [
    // 将 CSS 中的 @import 规则转换为 index.css 中的 CSS 代码
    require("postcss-import")(),
    // 处理 CSS 中的 url(...)
    require("postcss-url")(),
    // 其他 PostCSS 插件...
  ],
};
