export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const getOpenAIConfig = (): OpenAIConfig => {
  return {
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
    model: import.meta.env.VITE_OPENAI_MODEL || "gpt-3.5-turbo",
  };
};

export const streamChatCompletion = async (
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
) => {
  const config = getOpenAIConfig();

  if (!config.apiKey) {
    onError(new Error("OpenAI API Key is missing. Please set VITE_OPENAI_API_KEY."));
    return;
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    if (!reader) {
      throw new Error("Response body is null");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line === "data: [DONE]") {
          break;
        }

        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");
          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices[0]?.delta?.content || "";
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error("Error parsing JSON chunk", e);
          }
        }
      }
    }
    
    onDone();
  } catch (error: any) {
    onError(error);
  }
};
