import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      build: {
        metaFileName: true,
      },
      userscript: {
        namespace: "http://github.com/Kr328/bilibili-redirect",
        version: "1.8",
        name: "Bilibili Redirect",
        description: "允许使用 Bilibili 的播放器播放本地视频。",
        author: "Kr328",
        license: "GPLv3",
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
