import express from "express";
import { SYSTEM_PROMPT } from "../support/knowledge.js";

const router = express.Router();

// ---- Simple abuse protection: at most 15 messages per minute for each visitor ----
const visits = new Map();
function tooManyMessages(ip) {
  const now = Date.now();
  const recent = (visits.get(ip) || []).filter((time) => now - time < 60000);
  recent.push(now);
  visits.set(ip, recent);
  return recent.length > 15;
}

// POST /api/support/chat  { messages: [{ role: "user" | "assistant", content: "..." }] }
// Sends the question to Groq and streams the answer back piece by piece,
// so the first words appear on screen almost immediately.
router.post("/chat", async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ message: "The support assistant is not set up yet." });
  }
  if (tooManyMessages(req.ip)) {
    return res.status(429).json({ message: "You are sending messages too fast. Please wait a moment." });
  }

  // Keep only the last 8 messages, only real chat roles, and cut very long texts
  const incoming = Array.isArray(req.body.messages) ? req.body.messages : [];
  const messages = incoming
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ message: "Please type a question." });
  }

  // Stop asking Groq if the visitor closes the chat while the answer is coming
  const controller = new AbortController();
  res.on("close", () => controller.abort());

  const url = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b"; // fast and available on every Groq account

  const requestBody = {
    model,
    stream: true,
    temperature: 0.3,
    max_completion_tokens: 800, // the model's short "thinking" also counts here, so keep some room
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  };
  // The gpt-oss models think before answering. "low" keeps that very short so the first words come fast.
  if (model.startsWith("openai/gpt-oss")) {
    requestBody.reasoning_effort = "low";
    requestBody.include_reasoning = false;
  }

  const groqResponse = await fetch(url, {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(requestBody),
  });

  if (!groqResponse.ok || !groqResponse.body) {
    console.error("Groq error:", groqResponse.status, await groqResponse.text().catch(() => ""));
    return res.status(502).json({ message: "The assistant is busy right now. Please try again in a moment." });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no"); // stops proxies from holding back the stream
  res.flushHeaders();

  try {
    // Groq sends lines like:  data: {"choices":[{"delta":{"content":"Hello"}}]}
    // We pick out the text and pass it straight on to the browser.
    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // the last line may be unfinished, keep it for the next round

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const piece = JSON.parse(data).choices?.[0]?.delta?.content;
          if (piece) res.write(piece);
        } catch (err) {
          // ignore a broken line
        }
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") console.error("Support stream error:", err.message);
  }
  res.end();
});

export default router;