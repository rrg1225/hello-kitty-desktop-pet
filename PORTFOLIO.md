# Portfolio Brief: Hello Kitty Desktop Pet

## Resume Bullets

- Built a polished Electron + Vue desktop companion with transparent floating UI, tray controls, edge snapping, sound feedback, crash reporting, and optional Qwen streaming chat.
- Added local API key filtering so `sk-` messages are stored locally and removed from model-bound chat history.
- Packaged the app with Electron Builder and verified renderer builds for a reliable desktop release workflow.

## What This Proves

- Desktop product development with Electron and Vue.
- Streaming chat integration and local secret handling.
- User-facing polish through window behavior, animations, sounds, and diagnostics.

## Verification

```bash
npm ci
npm run build:renderer
```

Full installer packaging is available through:

```bash
npm run build
```

## Interview Talking Points

- How streaming IPC listeners are cleaned up during hot reloads.
- How local-only API key handling reduces accidental leakage.
- How renderer builds and Electron packaging differ in CI cost.
