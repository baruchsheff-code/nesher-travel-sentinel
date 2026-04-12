import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bird, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-chat`;

const TravelChat = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey! I'm **Nesher AI** ✈️ — your travel assistant. Ask me anything about flights, destinations, safety, visas, or points." },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Stream failed");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";

    // Add empty assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nlIdx);
        buffer = buffer.slice(nlIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantText += content;
            const text = assistantText;
            setMessages((prev) =>
              prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: text } : m))
            );
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsStreaming(true);

    try {
      await streamChat(updated.filter((m) => m.content)); // skip empty
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${e.message || "Something went wrong. Please try again."}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, backgroundColor: "hsl(var(--primary) / 0.1)" }}>
            <Bird size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Nesher AI</p>
            <p className="text-[10px] text-muted-foreground">Travel Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-card transition-colors">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
              style={
                msg.role === "user"
                  ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                  : { backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }
              }
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-strong:text-foreground text-foreground [&_a]:text-primary">
                  <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <Loader2 size={16} className="text-primary animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about flights, safety, visas..."
            disabled={isStreaming}
            className="flex-1 rounded-xl px-4 py-3 text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none"
            style={{ border: "1px solid hsl(var(--border))" }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="rounded-xl p-3 bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelChat;
