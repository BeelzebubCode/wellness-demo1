import { env } from "process";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export interface ChatOptions {
    model?: string;
    format?: "json" | string;
    keep_alive?: string | number; // "0" = unload immediately after response
    options?: {
        temperature?: number;
        num_ctx?: number;
        [key: string]: any;
    };
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}) {
    const model = opts.model || env.AI_MODEL || "qwen2.5:7b";
    const baseUrl = env.AI_BASE_URL || "http://localhost:11434";

    const payload: Record<string, any> = {
        model,
        messages,
        stream: false,
        options: opts.options || {},
    };
    if (opts.format) payload.format = opts.format;
    if (opts.keep_alive !== undefined) payload.keep_alive = opts.keep_alive;

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.message?.content || "";
}

/**
 * Unload a model from GPU memory so the next model can use the full VRAM.
 * Uses Ollama's keep_alive=0 trick with a minimal request.
 */
export async function unloadModel(model: string) {
    const baseUrl = env.AI_BASE_URL || "http://localhost:11434";
    try {
        await fetch(`${baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [],
                keep_alive: 0,
            }),
        });
        console.log(`[Ollama] Unloaded ${model} from GPU`);
    } catch (err) {
        console.warn(`[Ollama] Failed to unload ${model}:`, err);
    }
}
