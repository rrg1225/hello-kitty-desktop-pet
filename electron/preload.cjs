const { contextBridge, ipcRenderer } = require('electron')

function reportRendererError(error) {
  ipcRenderer.send('renderer-crash', {
    message: error?.message || String(error),
    stack: error?.stack || '',
    filename: error?.filename || '',
    lineno: error?.lineno || null,
    colno: error?.colno || null,
  })
}

window.addEventListener('error', (event) => {
  reportRendererError(event.error || {
    message: event.message,
    stack: `${event.filename}:${event.lineno}:${event.colno}`,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  reportRendererError(event.reason || {
    message: 'Unhandled promise rejection',
  })
})

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * @param {boolean} ignore true = 鼠标穿透；false = 捕获鼠标
   */
  setIgnoreMouseEvents: (ignore) =>
    ipcRenderer.invoke('set-ignore-mouse-events', ignore),

  chatWithQwen: (messages) =>
    ipcRenderer.send('chat-with-qwen', messages),

  onQwenData: (callback) =>
    ipcRenderer.on('qwen-stream-data', (_event, data) => callback(data)),

  onQwenEnd: (callback) =>
    ipcRenderer.on('qwen-stream-end', () => callback()),

  onQwenError: (callback) =>
    ipcRenderer.on('qwen-stream-error', (_event, msg) => callback(msg)),

  offQwenEvents: () => {
    ipcRenderer.removeAllListeners('qwen-stream-data')
    ipcRenderer.removeAllListeners('qwen-stream-end')
    ipcRenderer.removeAllListeners('qwen-stream-error')
  },

  hideWindow: () => ipcRenderer.send('hide-window'),

  showContextMenu: () => ipcRenderer.send('show-context-menu'),

  windowMouseEnter: () => ipcRenderer.send('window-mouseenter'),

  windowMouseLeave: () => ipcRenderer.send('window-mouseleave'),

  moveWindowBy: (dx, dy) => ipcRenderer.send('move-window-by', dx, dy),
})
