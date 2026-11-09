import { useEffect, useRef, useState } from "react";
import { API_URL } from "../api.js";
import Icon from "./Icons.jsx";

const GREETING = "Hi! I'm Spacio's support assistant. Ask me anything about listing, booking or paying for a space.";

// Quick questions. These answers are built into the app, so they appear instantly (no waiting at all).
const QUICK_QUESTIONS = [
  {
    q: "How do I book a space?",
    a: "Open a space, choose your From and To dates, and click Request booking (or Book now for instant booking). If the host must approve it, you can pay from My bookings once it is approved.",
  },
  {
    q: "How do I pay?",
    a: "Go to My bookings. When a booking says Approved, click Pay and finish the secure Razorpay window. The booking then changes to Paid.",
  },
  {
    q: "How do I list my space?",
    a: "Log in and click List a space. Add the details, up to 4 photos and the location (search the address or click the map), then click Publish space. You can manage it from My spaces.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes, while it is Pending or Approved: click Cancel in My bookings. After payment, cancelling is not available in the app yet, so please chat with the host from that booking.",
  },
  {
    q: "What is instant booking?",
    a: "Hosts can allow instant booking. Then your booking is approved straight away, without waiting for the host, and you can pay right away.",
  },
];

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  // Escape closes the chat
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Stop any answer that is still coming when the page is closed
  useEffect(() => () => abortRef.current?.abort(), []);

  // Quick question: show the question and its ready answer immediately
  function askQuick(item) {
    if (busy) return;
    setMessages((old) => [...old, { role: "user", content: item.q }, { role: "assistant", content: item.a }]);
  }

  // Typed question: show it at once, then show the AI's answer word by word as it arrives
  async function handleSend(e) {
    e.preventDefault();
    const question = text.trim();
    if (!question || busy) return;

    setText("");
    setBusy(true);
    const history = [...messages.filter((m) => !m.error).slice(1), { role: "user", content: question }]; // slice(1) skips the greeting
    setMessages([...messages, { role: "user", content: question }, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;
    let received = false;

    try {
      const res = await fetch(API_URL + "/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-8).map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "The assistant is not available right now.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        if (piece) received = true;
        // add the new piece to the last (assistant) message
        setMessages((old) => {
          const copy = [...old];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + piece };
          return copy;
        });
      }
      if (!received) throw new Error("Sorry, I could not answer that. Please try asking in a different way.");
    } catch (err) {
      if (err.name !== "AbortError") {
        const reason = err.message === "Failed to fetch" ? "I could not reach the server. Please check your connection and try again." : err.message;
        setMessages((old) => {
          const copy = [...old];
          copy[copy.length - 1] = { role: "assistant", content: reason, error: true };
          return copy;
        });
      }
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    setBusy(false);
    setMessages([{ role: "assistant", content: GREETING }]);
  }

  return (
    <>
      {open && (
        <section className="support-panel" role="dialog" aria-label="Spacio support chat">
          <header className="support-head">
            <span className="avatar"><Icon name="bot" size={20} /></span>
            <div>
              <strong>Spacio support</strong>
              <small><span className="support-dot" /> Ask me anything</small>
            </div>
            <button type="button" className="support-icon-btn" onClick={clearChat} title="Start a new chat" aria-label="Start a new chat">
              <Icon name="trash" size={16} />
            </button>
            <button type="button" className="support-icon-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="support-body">
            {messages.map((m, i) => (
              <div key={i} className={"support-msg " + (m.role === "user" ? "user" : "bot") + (m.error ? " error" : "")}>
                {m.content === "" ? <span className="typing"><i /><i /><i /></span> : m.content}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="support-chips">
                {QUICK_QUESTIONS.map((item) => (
                  <button key={item.q} type="button" onClick={() => askQuick(item)}>{item.q}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="support-input" onSubmit={handleSend}>
            <input
              placeholder="Type your question"
              aria-label="Type your question"
              maxLength={300}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()} aria-label="Send">
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="support-note">AI assistant. It can make mistakes. For booking problems, use the Chat button on your booking to talk to the host.</p>
        </section>
      )}

      <button
        type="button"
        className={"support-fab" + (open ? " is-open" : "")}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        title={open ? "Close chat" : "Chat with Spacio support"}
      >
        <Icon name={open ? "close" : "bot"} size={open ? 26 : 32} />
      </button>
    </>
  );
}
