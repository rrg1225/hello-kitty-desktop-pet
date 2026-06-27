# Hello Kitty Desktop Pet

[![CI](https://github.com/rrg1225/hello-kitty-desktop-pet/actions/workflows/ci.yml/badge.svg)](https://github.com/rrg1225/hello-kitty-desktop-pet/actions/workflows/ci.yml)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3-42B883?logo=vuedotjs)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![Qwen](https://img.shields.io/badge/Qwen-Optional%20Chat-FF6A00)

Hello Kitty Desktop Pet is a polished Electron + Vue desktop companion with a transparent floating window, drag interactions, sound effects, crash reporting, single-instance behavior, and optional Qwen-powered chat.

> Resume and interview brief: [PORTFOLIO.md](PORTFOLIO.md)
> Enterprise architecture: [docs/ENTERPRISE_ARCHITECTURE.md](docs/ENTERPRISE_ARCHITECTURE.md)

## Features

- Cute transparent frameless desktop pet.
- Click quotes, dragging, edge snapping, auto-hide, context menu, and tray controls.
- Main-process and renderer error reporting.
- Single-instance lock that focuses the existing app on relaunch.
- Optional Qwen streaming chat shown inside the speech bubble.
- API key storage through `electron-store`.
- Chat safety layer for `sk-` filtering, role normalization, and context truncation.
- Electron Builder NSIS packaging configuration.

## Architecture

```text
Vue renderer
  -> preload bridge
  -> Electron main process
  -> chat safety layer
  -> Qwen-compatible streaming API
```

Key files:

| Path | Purpose |
| --- | --- |
| `src/App.vue` | Pet UI, interactions, chat bubble |
| `electron/main.js` | Window, tray, single-instance, IPC, Qwen streaming |
| `electron/preload.cjs` | Safe IPC bridge and renderer error reporting |
| `electron/chatSafety.js` | Key filtering and message bounding |

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm test
npm run build:renderer
npm run build
```

Installer artifacts are written to `release/`.

## AI Key Setup

For local development, copy `.env.example` to `.env`:

```env
QWEN_API_KEY=YOUR_API_KEY_HERE
```

You can also send an `sk-` key in the pet chat box. The app saves it locally with `electron-store` and filters it from model requests.

## Quality Gates

- `npm test` syntax-checks Electron main, preload, and chat safety modules.
- `npm run build:renderer` validates the Vue renderer bundle.
- Release artifacts and local keys are ignored by Git.

## Roadmap

- Add signed auto-update metadata for distributable releases.
- Add configurable animation and notification preferences.
- Add renderer interaction tests for drag, snap, tray, and chat states.

## License

MIT
