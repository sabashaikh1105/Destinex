// src/lib/ai.js

const DEFAULT_AI_TIMEOUT_MS = 45000;

const resolveTimeoutMs = () => {
  const raw = import.meta.env?.VITE_AI_TIMEOUT_MS;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_AI_TIMEOUT_MS;
};

export async function generateAI(prompt) {
  const controller = new AbortController();
  const timeoutMs = resolveTimeoutMs();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch("http://localhost:5000/api/ai/generate-trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `AI request timed out after ${Math.round(timeoutMs / 1000)}s. Please try again.`
      );
    }
    throw new Error(
      "Unable to reach AI server at http://localhost:5000. Start backend and try again."
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let message = "";
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object") {
        message =
          data.message ||
          data.error ||
          (typeof data.content === "string" ? data.content : "");
      }
    } else {
      message = await res.text().catch(() => "");
    }
    throw new Error(message || `AI request failed (${res.status})`);
  }

  const data = await res.json();
  if (typeof data?.content === "string") return data.content;

  // Fallback: stringify unexpected shapes so callers expecting a string still work.
  return JSON.stringify(data);
}

export async function generateTripAI(prompt) {
  const text = await generateAI(prompt);
  return JSON.parse(text);
}
