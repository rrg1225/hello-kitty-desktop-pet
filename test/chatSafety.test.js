import test from "node:test";
import assert from "node:assert/strict";
import { buildQwenChatPayload, sanitizeChatMessages } from "../electron/chatSafety.js";

test("filters API keys and bounds chat history", () => {
  const messages = [
    { role: "system", content: " stay concise " },
    { role: "user", content: "sk-testsecret123456" },
    { role: "bad", content: "hello".repeat(200) },
    { role: "assistant", content: "ok" }
  ];

  const sanitized = sanitizeChatMessages(messages, { maxMessages: 2, maxChars: 20 });
  assert.equal(sanitized.length, 2);
  assert.equal(sanitized[0].role, "user");
  assert.equal(sanitized[0].content.length, 20);
  assert.equal(sanitized[1].content, "ok");
});

test("builds a streaming Qwen payload", () => {
  const payload = buildQwenChatPayload([{ role: "user", content: "hi" }], { model: "qwen-turbo" });
  assert.equal(payload.model, "qwen-turbo");
  assert.equal(payload.stream, true);
  assert.equal(payload.messages[0].content, "hi");
});
