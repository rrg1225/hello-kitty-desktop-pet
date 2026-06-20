<template>
  <div class="pet-container">
    <div
      class="pet-hitbox"
      @mouseenter="onPetMouseEnter"
      @mouseleave="onPetMouseLeave"
    >
      <div class="pet-wrapper">
        <Transition name="bubble-fade">
          <div v-if="showBubble" class="speech-bubble">
            <p class="speech-text">{{ currentQuote }}</p>
            <span class="bubble-tail" aria-hidden="true" />
          </div>
        </Transition>
        <button
          class="close-btn"
          aria-label="隐藏宠物"
          @click="onHide"
        >&times;</button>
        <img
          class="pet-image"
          :src="petImg"
          alt="Desktop pet"
          draggable="false"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @contextmenu.prevent="onContextMenu"
        />
        <input
          v-model="inputText"
          class="chat-input"
          type="text"
          placeholder="和Hello Kitty聊聊呀~🎀"
          :disabled="isStreaming || isPenalized"
          @keydown.enter="onSend"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import petImg from '@/assets/hello-kitty.gif'
import clickSound from '@/assets/click.mp3'
import popSound from '@/assets/pop.mp3'
import angrySound from '@/assets/angry.mp3'
import hmmSound from '@/assets/hmm.mp3'
import laughSound from '@/assets/laugh.mp3'

const quotes = [
  '今天也要开心哦~',
  'Kitty给你一个大大的拥抱！',
  '主人辛苦啦，休息一下吧~',
  '甜甜时光一起过🎀',
]

const showBubble = ref(false)
const currentQuote = ref('')
const inputText = ref('')
const isStreaming = ref(false)
let hideTimer = null

const chatHistory = ref([
  {
    role: 'system',
    content:
      '你是一个可爱的 Hello Kitty 桌面宠物。你的任务是用甜美、温柔、治愈的话语陪伴主人。每次回复不超过30个字，可以适当使用可爱的emoji。',
  },
])

let clickCount = 0
let lastClickTime = 0
const isPenalized = ref(false)

function showErrorBubble(message) {
  currentQuote.value = 'Kitty出错啦：' + message
  showBubble.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    showBubble.value = false
    hideTimer = null
  }, 8000)
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    showErrorBubble(event.error?.message || event.message || '未知错误')
  })
  window.addEventListener('unhandledrejection', (event) => {
    showErrorBubble(event.reason?.message || '未处理的 Promise 拒绝')
  })
}

const audioMap = {
  click: new Audio(clickSound),
  pop: new Audio(popSound),
  angry: new Audio(angrySound),
  hmm: new Audio(hmmSound),
  laugh: new Audio(laughSound),
}

function playSound(type) {
  const audio = audioMap[type]
  if (!audio) return
  audio.currentTime = 0
  audio.play().catch(() => { /* ignore autoplay restriction */ })
}

function setMousePassthrough(ignore) {
  window.electronAPI?.setIgnoreMouseEvents(ignore)
}

function onPetMouseEnter() {
  setMousePassthrough(false)
  window.electronAPI?.windowMouseEnter()
}

function onPetMouseLeave() {
  setMousePassthrough(true)
  window.electronAPI?.windowMouseLeave()
}

function onHide() {
  window.electronAPI?.hideWindow()
}

function onContextMenu() {
  window.electronAPI?.showContextMenu()
}

// --- Custom drag via Pointer Events ---
let isDragging = false
let lastScreenX = 0
let lastScreenY = 0
let hasMoved = false

function onPointerDown(e) {
  isDragging = true
  hasMoved = false
  lastScreenX = e.screenX
  lastScreenY = e.screenY
  e.target.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!isDragging) return
  const dx = e.screenX - lastScreenX
  const dy = e.screenY - lastScreenY
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    hasMoved = true
  }
  if (hasMoved) {
    window.electronAPI?.moveWindowBy(dx, dy)
    lastScreenX = e.screenX
    lastScreenY = e.screenY
  }
}

function onPointerUp(e) {
  isDragging = false
  e.target.releasePointerCapture(e.pointerId)
  if (!hasMoved) {
    onPetClick()
  }
}

function onPetClick() {
  const now = Date.now()

  if (now - lastClickTime < 400) {
    clickCount++
  } else {
    clickCount = 1
  }
  lastClickTime = now

  if (clickCount >= 5) {
    clickCount = 0
    isPenalized.value = true
    playSound('angry')
    currentQuote.value = '哎呀，主人不要一直戳Kitty的头啦~🎀'
    showBubble.value = true

    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      showBubble.value = false
      hideTimer = null
    }, 3000)

    setTimeout(() => {
      isPenalized.value = false
    }, 2000)
    return
  }

  playSound('click')
  currentQuote.value = quotes[Math.floor(Math.random() * quotes.length)]
  showBubble.value = true

  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  hideTimer = setTimeout(() => {
    showBubble.value = false
    hideTimer = null
  }, 3000)
}

function onSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  inputText.value = ''
  chatHistory.value.push({ role: 'user', content: text })

  currentQuote.value = '思考中...'
  showBubble.value = true
  isStreaming.value = true
  playSound('hmm')

  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  window.electronAPI?.chatWithQwen(
    chatHistory.value.map((m) => ({ role: m.role, content: m.content })),
  )
}

onMounted(() => {
  setMousePassthrough(true)

  window.electronAPI?.onQwenData((text) => {
    if (currentQuote.value === '思考中...') {
      currentQuote.value = ''
    }
    currentQuote.value += text
  })

  window.electronAPI?.onQwenEnd(() => {
    isStreaming.value = false
    chatHistory.value.push({
      role: 'assistant',
      content: currentQuote.value,
    })

    if (/哈|笑/.test(currentQuote.value)) {
      playSound('laugh')
    } else {
      playSound('pop')
    }

    hideTimer = setTimeout(() => {
      showBubble.value = false
      hideTimer = null
    }, 8000)
  })

  window.electronAPI?.onQwenError((msg) => {
    currentQuote.value = msg
    isStreaming.value = false

    hideTimer = setTimeout(() => {
      showBubble.value = false
      hideTimer = null
    }, 5000)
  })
})

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  setMousePassthrough(true)
})
</script>

<style scoped>
.pet-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  animation: float 3s ease-in-out infinite;
}

.pet-hitbox {
  position: relative;
  padding-top: 72px;
  -webkit-app-region: no-drag;
}

.pet-wrapper {
  position: relative;
  line-height: 0;
}

.speech-bubble {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  min-width: 140px;
  max-width: 220px;
  padding: 12px 16px;
  background: radial-gradient(circle at top left, #fff6fb, #ffe8f2);
  border: 2px solid #ffb6d5;
  border-radius: 22px;
  box-shadow: 0 8px 24px rgba(255, 182, 209, 0.28);
  -webkit-app-region: no-drag;
  pointer-events: auto;
}

.speech-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6f4964;
  text-align: center;
  font-weight: 600;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 110px;
  overflow-y: auto;
  padding-right: 4px;
}

.bubble-tail {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 11px solid #ffb6d5;
}

.bubble-tail::after {
  content: '';
  position: absolute;
  top: -13px;
  left: -8px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 9px solid #fff6fb;
}

.pet-image {
  width: 180px;
  height: auto;
  display: block;
  user-select: none;
  cursor: pointer;
  transition: transform 0.25s ease;
  touch-action: none;
}

.pet-image:hover {
  transform: scale(1.08);
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.18);
  color: #fff;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 30;
}

.pet-wrapper:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.45);
}

.chat-input {
  display: block;
  width: 190px;
  margin-top: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 244, 250, 0.88);
  font-size: 13px;
  color: #6f4c6b;
  text-align: center;
  outline: none;
  -webkit-app-region: no-drag;
  transition: background 0.25s ease, transform 0.25s ease;
  box-sizing: border-box;
}

.chat-input::placeholder {
  color: #c18aa8;
}

.chat-input:hover,
.chat-input:focus {
  background: rgba(255, 247, 252, 1);
  transform: scale(1.01);
}

.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

.speech-text::-webkit-scrollbar {
  width: 4px;
}
.speech-text::-webkit-scrollbar-track {
  background: transparent;
}
.speech-text::-webkit-scrollbar-thumb {
  background: #ffd6e8;
  border-radius: 4px;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
