function getEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : undefined;
}

function getMaxTokens() {
  const raw = getEnv("AI_MAX_TOKENS");
  const parsed = Number.parseInt(raw || "", 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 4000;
}

async function postJson(url, body, headers) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`AI response was not JSON: ${text}`);
  }
}

export async function generateTrip(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt must be a non-empty string.");
  }

  const groqApiKey = getEnv("GROQ_API_KEY");
  const openRouterApiKey =
    getEnv("OPENROUTER_API_KEY") || getEnv("VITE_OPENROUTER_API_KEY");

  const providerRaw = getEnv("AI_PROVIDER")?.toLowerCase();
  const maxTokens = getMaxTokens();
  const provider = providerRaw
    ? providerRaw
    : groqApiKey
      ? "groq"
      : openRouterApiKey
        ? "openrouter"
        : undefined;

  if (!provider) {
    throw new Error(
      "Missing API key. Set GROQ_API_KEY or OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY in root .env)."
    );
  }
  if (provider !== "groq" && provider !== "openrouter") {
    throw new Error('AI_PROVIDER must be "groq" or "openrouter".');
  }

  if (provider === "groq") {
    if (!groqApiKey) {
      throw new Error("Missing GROQ_API_KEY. Add it to your backend/.env.");
    }

    const model = getEnv("GROQ_MODEL") || "llama-3.1-8b-instant";

    const data = await postJson(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a travel planner AI. Respond ONLY with valid JSON (no markdown, no extra text).",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      },
      { Authorization: `Bearer ${groqApiKey}` }
    );

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned no message content.");
    return content;
  }

  if (!openRouterApiKey) {
    throw new Error("Missing OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY).");
  }

  const data = await postJson(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: getEnv("OPENROUTER_MODEL") || "x-ai/grok-2-1212",
      messages: [
        {
          role: "system",
          content:
            "You are a travel planner AI. Always respond ONLY in valid JSON (no markdown, no extra text).",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: maxTokens,
    },
    {
      Authorization: `Bearer ${openRouterApiKey}`,
      "HTTP-Referer": getEnv("OPENROUTER_REFERER") || "http://localhost:5173",
      "X-Title": getEnv("OPENROUTER_APP_TITLE") || "Destinex",
    }
  );

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no message content.");
  return content;
}
