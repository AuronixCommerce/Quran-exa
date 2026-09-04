"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const GUEST_LIMIT = 10;
const STORAGE_KEY = "quranexa-guest-message-count";

export default function GuestChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const typingTarget = useRef("");

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY) || "0");
    if (Number.isFinite(stored) && stored > 0) setGuestCount(stored);
  }, []);

  const remaining = Math.max(0, GUEST_LIMIT - guestCount);
  const latestAssistantIndex = useMemo(
    () => messages.map((message) => message.role).lastIndexOf("assistant"),
    [messages]
  );

  useEffect(() => {
    if (!typingTarget.current || typedLength >= typingTarget.current.length) return;
    const timer = window.setTimeout(() => {
      setTypedLength((value) => Math.min(value + 2, typingTarget.current.length));
    }, 12);
    return () => window.clearTimeout(timer);
  }, [typedLength]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading || guestCount >= GUEST_LIMIT) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    const nextCount = guestCount + 1;
    setMessages(nextMessages);
    setInput("");
    setGuestCount(nextCount);
    window.localStorage.setItem(STORAGE_KEY, String(nextCount));
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Quranexa could not answer right now.");

      const answer = String(data.answer || "I could not produce a verified answer.");
      typingTarget.current = answer;
      setTypedLength(0);
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Quranexa could not answer right now.";
      typingTarget.current = message;
      setTypedLength(message.length);
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatShell">
      <div className="guestNotice">
        <strong>Guest chat is not saved.</strong>
        <span>Sign in to save your reading and chat history. You have {remaining} guest message{remaining === 1 ? "" : "s"} remaining.</span>
      </div>

      <div className="chatMessages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="emptyChat">
            <span className="cardGlyph">✧</span>
            <strong>Ask a thoughtful question</strong>
            <p>Try: “What does Surah Ash-Sharh teach about hardship?”</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isTyping = message.role === "assistant" && index === latestAssistantIndex && typedLength < message.content.length;
            const content = isTyping ? message.content.slice(0, typedLength) : message.content;
            return (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <span className="messageLabel">{message.role === "user" ? "You" : "Quranexa"}</span>
                <p>{content}{isTyping ? <span className="typingCursor">▍</span> : null}</p>
              </div>
            );
          })
        )}
        {loading ? <div className="thinking"><span /> <span /> <span /></div> : null}
      </div>

      <form className="chatComposer" onSubmit={submit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={guestCount >= GUEST_LIMIT ? "Guest limit reached — sign in to continue" : "Ask Quranexa..."}
          rows={3}
          disabled={loading || guestCount >= GUEST_LIMIT}
          aria-label="Ask Quranexa"
        />
        <button className="primaryButton sendButton" type="submit" disabled={loading || !input.trim() || guestCount >= GUEST_LIMIT}>
          {loading ? "Thinking…" : "Ask Quranexa"}
        </button>
      </form>
    </div>
  );
}
