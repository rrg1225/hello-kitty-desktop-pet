# Hello Kitty Desktop Pet

[简体中文](#简体中文) | [English](#english)

A polished Electron + Vue desktop companion with Hello Kitty styling, transparent floating-window behavior, drag interactions, sound effects, crash reporting, and optional Qwen-powered chat.

---

## 简体中文

### 项目亮点

- **可爱透明桌宠**：Electron 无边框透明窗口，适合长期悬浮在桌面角落。
- **交互完整**：点击文案、拖拽移动、靠边吸附、自动隐藏、右键菜单和托盘控制。
- **稳定性增强**：主进程 `uncaughtException` 和渲染进程错误会弹窗报告，方便定位打包后问题。
- **可选 AI 陪聊**：支持 Qwen streaming chat，流式结果逐字显示在气泡里。
- **Key 防误传**：`sk-` 消息会被本地保存并从请求历史中过滤，不会发给模型。
- **监听清理**：组件卸载时清理流式 IPC 监听，开发热更新更稳定。
- **打包配置完整**：Electron Builder 生成 Windows NSIS 安装包。

### 快速开始

```bash
npm install
npm run dev
```

### 打包

```bash
npm run build:renderer
npm run build
```

安装包输出到 `release/`。

### AI Key 设置

本地开发可复制 `.env.example` 为 `.env`：

```env
QWEN_API_KEY=YOUR_API_KEY_HERE
```

也可以在桌宠聊天框中发送 `sk-` 开头的 Key，应用会保存到本机 `electron-store`。

---

## English

### Highlights

- **Cute transparent desktop pet** powered by a frameless Electron window.
- **Complete interactions**: click quotes, dragging, edge snapping, auto-hide, context menu, and tray controls.
- **Better stability diagnostics** with main-process and renderer error reporting.
- **Optional AI companion chat** using Qwen streaming responses.
- **Key filtering**: `sk-` messages are stored locally and removed from model-bound history.
- **Listener cleanup** removes streaming IPC handlers on unmount for more stable development hot reloads.
- **Packaged Windows workflow** through Electron Builder and NSIS.

### Quick Start

```bash
npm install
npm run dev
```

### Build

```bash
npm run build:renderer
npm run build
```

Installer artifacts are generated in `release/`.

### AI Key Setup

For local development, copy `.env.example` to `.env`:

```env
QWEN_API_KEY=YOUR_API_KEY_HERE
```

You can also send an `sk-` key in the pet chat box. The app saves it locally with `electron-store`.

## Repository Topics

`electron`, `vue`, `vite`, `desktop-pet`, `desktop-app`, `qwen`
