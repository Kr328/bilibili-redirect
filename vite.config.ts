import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      build: {
        metaFileName: true,
      },
      userscript: {
        namespace: "http://github.com/Kr328/bilibili-redirect",
        version: "1.5",
        name: "Bilibili Redirect",
        description: "Redirect bilibili video src to local file",
        author: "Kr328",
        icon: 'https://www.bilibili.com/favicon.ico',
        updateURL: "https://github.com/Kr328/bilibili-redirect/releases/latest/download/bilibili-redirect.meta.js",
        downloadURL: "https://github.com/Kr328/bilibili-redirect/releases/latest/download/bilibili-redirect.user.js",
        match: [
            '*://www.bilibili.com/video/*',
            '*://www.bilibili.com/bangumi/play/*',
        ],
      },
    }),
  ],
});
