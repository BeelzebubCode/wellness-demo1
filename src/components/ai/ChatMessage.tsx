type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-black text-white"
            : "bg-white border border-gray-200 text-gray-900",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}
