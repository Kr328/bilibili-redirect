# Bilibili Redirect

重定向 [Bilibili](https://www.bilibili.com) 的视频播放到**本地文件**。

### 用法

1. 安装 userscript (需要 Tampermonkey 等浏览器插件)  

    [Install](https://github.com/Kr328/bilibili-redirect/releases/latest/download/bilibili-redirect.user.js)

2. 使用播放器内的 `使用本地源` 按钮  

    ![use-local-resource](./imgs/use-local-resource.png)

### 构建

1. 安装依赖
   ```bash
   npm install
   ```
   
2. 构建 
   ```bash
   npm run build
   ```
   
3. 获取文件 `dist/bilibili-redirect.user.js`