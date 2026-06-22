import assert from "node:assert/strict";
import test from "node:test";
import { buildQwenChatPayload, isApiKeyMessage, sanitizeChatMessages } from "../electron/chatSafety.js";

test("detects and filters API key messages", () => {
  assert.equal(isApiKeyMessage("sk-1234567890abcdef"), true);
  assert.equal(isApiKeyMessage("hello sk-1234567890abcdef"), false);

  const sanitized = sanitizeChatMessages([
    { role: "system", content: "be sweet" },
    { role: "user", content: "sk-1234567890abcdef" },
    { role: "tool", content: "hello" }
  ]);

  assert.deepEqual(sanitized, [
    { role: "system", content: "be sweet" },
    { role: "user", content: "hello" }
  ]);
});

test("builds bounded Qwen payloads", () => {
  const payload = buildQwenChatPayload(
    Array.from({ length: 20 }, (_, index) => ({ role: "user", content: `message-${index}` })),
    { maxMessages: 3, maxChars: 7 }
  );

  assert.equal(payload.model, "qwen-plus");
  assert.equal(payload.stream, true);
  assert.deepEqual(payload.messages.map((message) => message.content), ["message", "message", "message"]);
});
