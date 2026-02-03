export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export function coerceMessages(input: any): ChatMsg[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: m.content }) as ChatMsg);
}

export function lastUserText(msgs: ChatMsg[]) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i]?.role === "user") return msgs[i].content || "";
  }
  return "";
}
