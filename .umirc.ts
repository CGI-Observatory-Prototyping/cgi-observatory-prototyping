import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", redirect: "/map" },
    { path: "/map", component: "@/pages/Map" },
    { path: "/map3d", component: "@/pages/Map3D" }
  ],
  title: "CGI Observatory",
  // GitHub Pages cannot rewrite application routes to index.html.
  history: { type: 'hash' },
  // Keep the router base at /: the repository path is before the hash.
  // Relative production assets work at both /<repository>/ and a custom domain.
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  define: {
    'process.env.TILE_API_BASE_URL': process.env.TILE_API_BASE_URL || '',
  },
  npmClient: 'pnpm',
  utoopack: {},
  plugins: [
    '@umijs/plugins/dist/antd',
    "@umijs/plugins/dist/locale",
    "@umijs/plugins/dist/model",
  ],
  model:{},
  antd: {
    theme: {
      token:{
        // colorPrimary: 'rgba(153,26,221,0.73)'
        colorPrimary: 'rgb(181,18,43)'
      }
    },
  },
  locale: {
    // Default to using src/locales/zh-CN.ts as a multilingual file
    default: 'zh-CN',
    baseSeparator: '-',
    antd: true,
    useLocalStorage: true
  },
});
