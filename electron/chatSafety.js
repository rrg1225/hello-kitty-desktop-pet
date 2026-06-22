const DEFAULT_MAX_MESSAGES = 12;
const DEFAULT_MAX_CHARS = 500;
const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);

export function isApiKeyMessage(value) {
  return /^sk-[A-Za-z0-9_-]{8,}/.test(String(value || "").trim());
}

export function sanitizeChatMessages(messages = [], options = {}) {
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  return messages
    .filter((message) => message?.content && !isApiKeyMessage(message.content))
    .slice(-maxMessages)
    .map((message) => ({
      role: ALLOWED_ROLES.has(message.role) ? message.role : "user",
      content: String(message.content).slice(0, maxChars)
    }));
}

export function buildQwenChatPayload(messages, options = {}) {
  return {
    model: options.model || "qwen-plus",
    messages: sanitizeChatMessages(messages, options),
    stream: true
  };
}
