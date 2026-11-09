import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import api, { API_URL } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Icon from "../components/Icons.jsx";
import { errorMessage } from "../utils.js";

// Live chat between the owner and the customer of one booking
export default function Chat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // old messages
    api.get("/bookings/" + bookingId)
      .then((res) => setBooking(res.data))
      .catch((err) => setLoadError(errorMessage(err)));
    api.get("/messages/" + bookingId)
      .then((res) => setMessages(res.data))
      .catch(() => {});

    // live messages
    const socket = io(API_URL, { auth: { token: localStorage.getItem("token") } });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.emit("join", bookingId);
    socket.on("message", (message) => setMessages((old) => [...old, message]));

    return () => socket.disconnect();
  }, [bookingId]);

  // scroll down when a new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current.emit("send", { bookingId, text });
    setText("");
  }

  if (loadError) {
    return (
      <div className="wrap page-pad">
        <div className="state-box">
          <h3>This chat could not be opened</h3>
          <p className="muted">{loadError}</p>
          <Link to="/my-bookings" className="btn btn-dark">Back to my bookings</Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="wrap page-pad">
        <div className="skeleton" style={{ height: 420, borderRadius: 20 }} />
      </div>
    );
  }

  const otherPerson = booking.customer._id === user.id ? booking.owner.name : booking.customer.name;

  return (
    <div className="wrap page-pad">
      <div className="chat">
        <Link to="/my-bookings" className="back-link"><Icon name="back" size={16} /> Back</Link>

        <div className="chat-head">
          <span className="avatar avatar-lg">{otherPerson.charAt(0).toUpperCase()}</span>
          <div>
            <h1>{otherPerson}</h1>
            <p className="muted">About: {booking.listing?.title}</p>
          </div>
          <span className={"live" + (connected ? " on" : "")}>{connected ? "Live" : "Connecting..."}</span>
        </div>

        <div className="messages">
          {messages.length === 0 && <p className="muted center">No messages yet. Say hello.</p>}
          {messages.map((m) => (
            <div key={m._id} className={"bubble " + (m.sender._id === user.id ? "mine" : "theirs")}>
              {m.text}
              <small>{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</small>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <input placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
          <button type="submit" className="btn btn-primary" aria-label="Send"><Icon name="send" size={18} /></button>
        </form>
      </div>
    </div>
  );
}
