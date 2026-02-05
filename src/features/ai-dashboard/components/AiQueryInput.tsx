import { useState } from "react";
import { Send, Sparkles } from "lucide-react"; // Using lucide-react as commonly available
import { cn } from "@/lib/cn";

interface AiQueryInputProps {
  onQuery: (query: string) => void;
  isLoading: boolean;
}

export function AiQueryInput({ onQuery, isLoading }: AiQueryInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onQuery(query);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition duration-500" />
        <div className="relative flex items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-full border border-white/50 dark:border-zinc-700/50 shadow-lg overflow-hidden ring-1 ring-black/5">
          <div className="pl-4 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์คำถามที่นี่..."
            className="flex-1 py-3 px-4 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="pr-4 pl-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-zinc-500" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
