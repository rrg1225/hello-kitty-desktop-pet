# Hello Kitty Desktop Pet

[简体中文](#简体中文) | [English](#english)

A polished Electron + Vue desktop companion with Hello Kitty styling, transparent floating-window behavior, drag interactions, sound effects, crash reporting, single-instance handling, and optional Qwen-powered chat.

> Resume and interview brief: [PORTFOLIO.md](PORTFOLIO.md)
> Enterprise architecture: [docs/ENTERPRISE_ARCHITECTURE.md](docs/ENTERPRISE_ARCHITECTURE.md)

---

## 简体中文

### 项目亮点

- **可爱透明桌宠**：Electron 无边框透明窗口，适合长期悬浮在桌面角落。
- **完整交互**：点击文案、拖拽移动、靠边吸附、自动隐藏、右键菜单和托盘控制。
- **稳定性增强**：主进程异常和渲染进程错误会弹窗报告，便于定位打包后问题。
- **单实例保护**：重复启动时聚焦已有窗口，避免多个桌宠实例互相干扰。
- **可选 AI 陪聊**：支持 Qwen streaming chat，流式结果逐字显示在气泡里。
- **Key 防误传**：`sk-` 消息会被本地保存，并从模型请求历史中移除。
- **可测试安全模块**：`electron/chatSafety.js` 覆盖密钥过滤、上下文截断和角色白名单。

### 快速开始

```bash
npm install
npm run dev
```

### 常用命令

```bash
npm test
npm run build:renderer
npm run build
```

### AI Key 设置

本地开发可复制 `.env.example` 为 `.env`：

```env
QWEN_API_KEY=YOUR_API_KEY_HERE
```

也可以在桌宠聊天框中发送 `sk-` 开头的 Key，应用会保存到本地 `electron-store`。

---

## English

### Highlights

- **Cute transparent desktop pet** powered by a frameless Electron window.
- **Complete interactions**: click quotes, dragging, edge snapping, auto-hide, context menu, and tray controls.
- **Stability diagnostics** for main-process and renderer errors.
- **Single-instance behavior** that focuses the existing app on relaunch.
- **Optional Qwen companion chat** with streaming responses.
- **Key filtering**: `sk-` messages are stored locally and removed from model-bound history.
- **Tested chat safety module** for API key filtering, role normalization, and context bounds.

### Repository Topics

`electron`, `vue`, `vite`, `desktop-pet`, `desktop-app`, `qwen`
