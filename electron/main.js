import { app, BrowserWindow, dialog, globalShortcut, Menu, Tray, ipcMain, nativeImage, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import Store from 'electron-store'

const store = new Store()

process.on('uncaughtException', (error) => {
  dialog.showErrorBox(
    '糟糕，Kitty的脑电波断开了！(主进程崩溃)',
    error?.stack || error?.message || String(error),
  )
})

ipcMain.on('renderer-crash', (_event, error) => {
  dialog.showErrorBox(
    '糟糕，Kitty的渲染进程出错了！',
    error?.stack || error?.message || String(error),
  )
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

if (isDev) {
  try {
    await import('dotenv/config')
  } catch (error) {
    console.warn('dotenv not loaded:', error?.message || error)
  }
}

/** @type {BrowserWindow | null} */
let mainWindow = null

/** @type {Tray | null} */
let tray = null

const VISIBLE_PX = 30
const SNAP_THRESHOLD = 20
const MAX_CHAT_MESSAGES = 12
const MAX_CHAT_CHARS = 500
let isSnapped = false
let snappedEdge = null
let savedVisibleBounds = null
let snapDebounceTimer = null
let isSnapping = false

function setWindowMousePassthrough(ignore) {
  if (!mainWindow) return

  if (ignore) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
  } else {
    mainWindow.setIgnoreMouseEvents(false)
  }
}

function applySnap() {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  const { width: waW, height: waH } = screen.getPrimaryDisplay().workAreaSize

  let tx = bounds.x
  let ty = bounds.y
  let edge = null

  if (bounds.x < SNAP_THRESHOLD) {
    tx = -(bounds.width - VISIBLE_PX)
    edge = 'left'
  } else if (bounds.x + bounds.width > waW - SNAP_THRESHOLD) {
    tx = waW - VISIBLE_PX
    edge = 'right'
  }

  if (!edge && bounds.y < SNAP_THRESHOLD) {
    ty = -(bounds.height - VISIBLE_PX)
    edge = 'top'
  }

  if (edge) {
    savedVisibleBounds = { x: bounds.x, y: bounds.y }
    isSnapped = true
    snappedEdge = edge
    isSnapping = true
    mainWindow.setBounds({ x: tx, y: ty, width: bounds.width, height: bounds.height })
    isSnapping = false
  } else {
    isSnapped = false
    snappedEdge = null
    savedVisibleBounds = null
  }
}

function createWindow() {
  const savedBounds = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    width: 300,
    height: 300,
    ...(savedBounds?.x != null && savedBounds?.y != null
      ? { x: savedBounds.x, y: savedBounds.y }
      : {}),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.on('moved', () => {
    if (isSnapping) return

    const { x, y } = mainWindow.getBounds()
    store.set('windowBounds', { x, y })

    if (snapDebounceTimer) clearTimeout(snapDebounceTimer)
    snapDebounceTimer = setTimeout(() => {
      applySnap()
    }, 200)
  })

  mainWindow.webContents.once('did-finish-load', () => {
    setWindowMousePassthrough(true)
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return mainWindow
}

function toggleWindowVisibility() {
  if (!mainWindow) return

  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
    setWindowMousePassthrough(true)
  }
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('我的桌面宠物')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '隐藏/显示宠物',
      click: toggleWindowVisibility,
    },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}

function sanitizeChatMessages(messages = []) {
  return messages
    .filter((message) => message?.content && !String(message.content).trim().startsWith('sk-'))
    .slice(-MAX_CHAT_MESSAGES)
    .map((message) => ({
      role: ['system', 'user', 'assistant'].includes(message.role) ? message.role : 'user',
      content: String(message.content).slice(0, MAX_CHAT_CHARS),
    }))
}

ipcMain.handle('set-ignore-mouse-events', (_event, ignore) => {
  setWindowMousePassthrough(Boolean(ignore))
})

ipcMain.on('hide-window', () => {
  mainWindow?.hide()
})

ipcMain.on('show-context-menu', (event) => {
  const menu = Menu.buildFromTemplate([
    {
      label: '隐藏宠物',
      click: () => { mainWindow?.hide() },
    },
    {
      label: '退出',
      click: () => { app.quit() },
    },
  ])
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
})

ipcMain.on('move-window-by', (_event, dx, dy) => {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy))
})

ipcMain.on('window-mouseenter', () => {
  if (!isSnapped || !mainWindow || !savedVisibleBounds) return
  isSnapping = true
  const b = mainWindow.getBounds()
  mainWindow.setBounds({
    x: savedVisibleBounds.x,
    y: savedVisibleBounds.y,
    width: b.width,
    height: b.height,
  })
  isSnapping = false
})

ipcMain.on('window-mouseleave', () => {
  if (!isSnapped || !mainWindow) return
  const b = mainWindow.getBounds()
  savedVisibleBounds = { x: b.x, y: b.y }
  isSnapping = true
  const { width: waW, height: waH } = screen.getPrimaryDisplay().workAreaSize
  let tx = b.x
  let ty = b.y
  if (snappedEdge === 'left') tx = -(b.width - VISIBLE_PX)
  else if (snappedEdge === 'right') tx = waW - VISIBLE_PX
  else if (snappedEdge === 'top') ty = -(b.height - VISIBLE_PX)
  mainWindow.setBounds({ x: tx, y: ty, width: b.width, height: b.height })
  isSnapping = false
})

ipcMain.on('chat-with-qwen', async (event, messages) => {
  try {
    // 1. 安全动态加载 electron-store
    const { default: Store } = await import('electron-store');
    const store = new Store();

    // 2. 获取用户最新的一条消息
    const lastMessage = messages[messages.length - 1]?.content || '';

    // 3. 拦截并吃掉 API Key
    if (lastMessage.startsWith('sk-')) {
      store.set('QWEN_API_KEY', lastMessage.trim());
      event.sender.send('qwen-stream-data', '吧唧吧唧...密钥吃掉啦！我现在有灵魂了，快和我聊天吧~ 🐾');
      event.sender.send('qwen-stream-end');
      return; // 拦截结束，不再请求大模型
    }

    // 4. 获取本地保存的 Key
    const apiKey = store.get('QWEN_API_KEY') || process.env.QWEN_API_KEY;
    if (!apiKey) {
      event.sender.send('qwen-stream-error', '我还是一只没有灵魂的Hello Kitty...请把 sk- 开头的 API Key 像聊天一样发给我吧！');
      return;
    }

    // 5. 过滤历史记录：千万不能把带 sk- 的密钥发给大模型，否则大模型会报错
    const cleanMessages = sanitizeChatMessages(messages);

    // 6. 发起正式请求（使用通义千问最稳的兼容端点）
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus', // 这里用 qwen-plus，如果你之前用的其他模型可以改
        messages: cleanMessages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 拒绝了请求 (${response.status}): ${errText}`);
    }

    // 7. Node.js 专用的流式响应解析 (最容易写错的地方，这里已做完美兼容)
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留最后一行不完整的片段

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr.trim() === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices[0]?.delta?.content;
            if (content) {
              event.sender.send('qwen-stream-data', content);
            }
          } catch (e) {
            // 忽略碎片化的 JSON
          }
        }
      }
    }

    // 8. 结束输出
    event.sender.send('qwen-stream-end');

  } catch (error) {
    console.error('Hello Kitty脑内短路:', error);
    // 即使出错，也要告诉前端，打破"思考中..."的死循环
    event.sender.send('qwen-stream-error', '罢工啦: ' + error.message);
  }
});

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
      setWindowMousePassthrough(true)
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  globalShortcut.register('CommandOrControl+Shift+P', () => {
    toggleWindowVisibility()
  })

  app.setLoginItemSettings({ openAtLogin: true })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
      setWindowMousePassthrough(true)
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // 保留托盘进程，通过托盘菜单退出
})
