# 墨帖 InkPost

Markdown 写作工具，用优雅的方式撰写微信公众号文章。支持自定义 CSS 主题、LaTeX 数学公式、双向滚动同步。

## 功能

- **Markdown 编辑** — CodeMirror 6 编辑器，语法高亮、自动补全、搜索替换
- **实时预览** — unified + remark-rehype 渲染管线，支持 GFM、LaTeX 公式
- **自定义容器** — `::: block-1` 到 `::: block-3`、`::: info`、`::: tip`、`::: warning`、`::: danger`
- **CSS 主题** — 6 个内置预设主题，支持新建/导入/导出/编辑 CSS
- **双向滚动同步** — 基于 AST position 的精准同步，非简单百分比
- **微信安全检测** — CSS 属性兼容性扫描，提醒不支持的样式
- **主题管理** — 新建、复制、导入、导出、重命名、删除主题
- **图片处理** — 本地图片自动转 base64，内置 sharp 压缩
- **中英文切换** — 界面 + CodeMirror 搜索面板全量 i18n

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Electron + React + TypeScript |
| 编辑器 | CodeMirror 6 |
| Markdown 解析 | unified + remark-parse + remark-gfm |
| 数学公式 | remark-math + mathjax-node (SVG) |
| HTML 渲染 | remark-rehype + rehype-raw + rehype-sanitize + rehype-stringify |
| CSS 内联 | juice |
| 图片处理 | sharp |
| 构建 | electron-forge + webpack |
| 测试 | Vitest |

## 目录结构

```
src/
├── main/           # Electron 主进程
│   ├── main.ts     # 窗口管理、IPC、菜单
│   └── renderer.ts # Markdown 渲染（unified pipeline）
├── preload/        # contextBridge API
│   └── preload.ts
├── renderer/       # React 渲染进程
│   ├── App.tsx     # 主界面
│   ├── Editor.tsx  # CodeMirror 6 编辑器
│   ├── Preview.tsx # iframe 预览
│   ├── CssEditor.tsx    # CSS 编辑器 (CodeMirror)
│   ├── ThemeManager.tsx # 主题管理下拉菜单
│   ├── scroll-sync/     # 双向滚动同步
│   │   ├── ScrollSyncManager.ts
│   │   ├── buildScrollMap.ts
│   │   ├── findScrollMapItem.ts
│   │   └── rafThrottle.ts
│   └── hooks/           # React Hooks
├── shared/         # 共享代码
│   ├── types.ts    # 类型定义
│   ├── i18n/       # 国际化
│   ├── presets/    # 预设主题
│   └── css-scanner.ts # 微信 CSS 兼容性扫描
└── main/markdown/  # Markdown 处理
    ├── processor.ts           # unified pipeline 配置
    └── plugins/
        ├── remarkSourcePosition.ts  # AST → data-source-* 属性
        ├── rehypeSourcePosition.ts  # 属性位置修正（pre/code 等）
        ├── remarkMathToSvg.ts       # LaTeX → SVG
        └── remarkContainers.ts      # 自定义容器块
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发环境
npm start

# 运行测试
npm test

# 打包
npm run make
```

## License

MIT
