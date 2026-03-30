type GeminiGenerateResult = {
  raw: unknown;
  text: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
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

  const response = await fetch(
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
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    },
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
}): Promise<{ text: string; raw: unknown }> {
  const apiKey = getRequiredEnv("WHISPER_API_KEY");
  const model = getWhisperModel();

  const form = new FormData();
  form.append("model", model);
  form.append(
    "file",
    new Blob([new Uint8Array(params.audioBuffer)], { type: params.mimeType }),
    params.filename,
  );
  form.append("response_format", "json");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    },
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
