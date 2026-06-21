# Enterprise Architecture

## Enterprise Positioning

Hello Kitty Desktop Pet is a polished Electron + Vue desktop companion. It demonstrates desktop product engineering patterns such as transparent windows, tray control, streaming chat, local key filtering, crash reporting, and distributable packaging.

## Architecture Boundaries

- **Renderer**: Vue UI, pet animation, interaction logic, and chat display.
- **Main process**: native window lifecycle, tray integration, error reporting, and package entrypoint.
- **Preload bridge**: restricted IPC API for renderer-to-main communication.
- **Chat boundary**: optional Qwen streaming chat with local key capture.
- **Packaging layer**: Electron Builder with Windows NSIS output.

## Enterprise Extension Path

1. Add release channels and signed automatic updates.
2. Encrypt local secret storage and add key rotation UX.
3. Add opt-in crash analytics and redacted diagnostics.
4. Add policy controls for enterprise environments where external AI calls are restricted.
5. Add integration tests for IPC listener cleanup and streaming cancellation.

## SLO and Observability

- **Startup target**: window visible within 2 seconds.
- **Crash target**: main-process crash-free sessions above 99.5%.
- **Chat target**: streaming response starts within provider SLA and cleans up listeners after cancellation.
- **Core dashboards for production**: crash reports, startup time, stream errors, update failures.

## Security Model

- `sk-` keys are intercepted and stored locally before chat history reaches the model.
- Renderer does not receive broad Node capabilities.
- Secrets are not committed to Git.
- Future enterprise mode should add encrypted storage, managed policy config, and outbound network allowlists.

## Interview-Level Design Rationale

The strongest discussion point is local secret handling. The app treats key entry as a user workflow, filters it out of model-bound history, and keeps the storage boundary local to the desktop app.
