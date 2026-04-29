function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getTimeoutMs(envName: string, fallback: number) {
  const raw = process.env[envName]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3-flash-preview";
}

export function getWhisperModel() {
  return process.env.WHISPER_MODEL?.trim() || "whisper-1";
}

export async function generateGeminiJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  schemaHint?: string;
}): Promise<{ data: T; raw: unknown }> {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");
  const model = getGeminiModel();
  const timeoutMs = getTimeoutMs("GEMINI_TIMEOUT_MS", 90_000);

  const prompt = params.schemaHint
    ? `${params.prompt}\n\nSchema hint:\n${params.schemaHint}`
    : params.prompt;

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const raw = (await response.json()) as any;
  const text =
    raw?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("") || "";

  if (!text.trim()) {
    throw new Error("Gemini returned empty JSON text");
  }

  try {
    return {
      data: JSON.parse(text) as T,
      raw,
    };
  } catch (error) {
    throw new Error(`Gemini JSON parse failed: ${(error as Error).message}`);
  }
}

export async function transcribeWithWhisper(params: {
  audioBuffer: Buffer;
  filename: string;
  mimeType: string;
  language?: string;
}): Promise<{ text: string; raw: unknown }> {
  const apiKey = getRequiredEnv("WHISPER_API_KEY");
  const model = getWhisperModel();
  const timeoutMs = getTimeoutMs("WHISPER_TIMEOUT_MS", 120_000);

  const form = new FormData();

  form.append("model", model);
  form.append(
    "file",
    new Blob([new Uint8Array(params.audioBuffer)], {
      type: params.mimeType,
    }),
    params.filename,
  );
  form.append("response_format", "verbose_json");

  if (params.language) {
    form.append("language", params.language);
  }

  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    },
    timeoutMs,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper request failed: ${response.status} ${errorText}`);
  }

  const raw = (await response.json()) as any;

  return {
    text: raw?.text || "",
    raw,
  };
}
