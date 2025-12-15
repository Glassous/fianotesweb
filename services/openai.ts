import i18n from "../i18n";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface StreamUpdate {
  content?: string;
  reasoning?: string;
  tool_calls?: any[];
}

export const getOpenAIConfig = (): OpenAIConfig => {
  return {
    baseUrl: (import.meta as any).env?.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: (import.meta as any).env?.VITE_OPENAI_API_KEY || "",
    model: (import.meta as any).env?.VITE_OPENAI_MODEL || "gpt-5",
  };
};

export const streamChatCompletion = async (
  messages: ChatMessage[],
  tools: any[] | undefined,
  onUpdate: (update: StreamUpdate) => void,
  onDone: () => void,
  onError: (error: Error) => void
) => {
  const config = getOpenAIConfig();

  if (!config.apiKey) {
    onError(new Error(i18n.t("errors.openai.apiKeyMissing")));
    return;
  }

  try {
    const body: any = {
      model: config.model,
      messages: messages,
      stream: true,
    };
    
    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || i18n.t("errors.openai.apiError", { statusText: response.statusText }));
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    if (!reader) {
      throw new Error(i18n.t("errors.openai.responseBodyNull"));
    }

    let isThinking = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (isThinking) {
          onUpdate({ reasoning: "</think>" });
          isThinking = false;
        }
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
            const delta = json.choices[0]?.delta || {};
            const content = delta.content || "";
            const reasoning = delta.reasoning_content || "";
            const tool_calls = delta.tool_calls;

            if (reasoning) {
              if (!isThinking) {
                onUpdate({ reasoning: "<think>" });
                isThinking = true;
              }
              onUpdate({ reasoning });
            }

            if (content) {
              if (isThinking) {
                onUpdate({ reasoning: "</think>" });
                isThinking = false;
              }
              onUpdate({ content });
            }

            if (tool_calls) {
              if (isThinking) {
                onUpdate({ reasoning: "</think>" });
                isThinking = false;
              }
              onUpdate({ tool_calls });
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
