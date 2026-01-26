export default function ChatMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[70%]
          rounded-[22px]
          px-4 py-3
          text-sm leading-relaxed
          ${
            isUser
              ? "bg-black text-white"
              : "bg-white border border-slate-200 text-slate-900"
          }
        `}
      >
        {content}
      </div>
    </div>
  );
}
