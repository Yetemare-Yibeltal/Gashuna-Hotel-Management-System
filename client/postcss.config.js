// postcss.config.js
// PostCSS configuration for Gashuna Hotel frontend.
//
// PostCSS processes CSS files through a chain of plugins.
// Two plugins are required for Tailwind CSS to work:
//
// 1. tailwindcss  — scans all files, finds Tailwind classes,
//                   and generates the corresponding CSS
//
// 2. autoprefixer — automatically adds vendor prefixes
//                   so CSS works across all browsers
//                   Example: adds -webkit-backdrop-filter
//                   alongside backdrop-filter

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
