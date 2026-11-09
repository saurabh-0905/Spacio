import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import Icon from "../components/Icons.jsx";
import { errorMessage, formatDate } from "../utils.js";

// Small form to rate a space after paying
function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/reviews", { bookingId: booking._id, rating, comment });
      onDone();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <strong>How was your stay? Leave a review</strong>
      <div className="review-fields">
        <select value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Rating">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>
        <input placeholder="Write a short review" value={comment} onChange={(e) => setComment(e.target.value)} />
        <button type="submit" className="btn btn-dark btn-sm">Post review</button>
      </div>
    </form>
  );
}

// "My bookings": spaces I booked as a customer
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBookings() {
    try {
      const res = await api.get("/bookings/mine");
      setBookings(res.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function cancel(id) {
    try {
      await api.put(`/bookings/${id}/status`, { status: "cancelled" });
      loadBookings();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  async function pay(booking) {
    try {
      // 1. server creates a Razorpay order
      const res = await api.post("/payments/create-order", { bookingId: booking._id });

      // 2. open the Razorpay popup
      const options = {
        key: res.data.keyId,
        amount: res.data.amount,
        currency: "INR",
        name: "Spacio",
        description: booking.listing?.title,
        order_id: res.data.orderId,
        theme: { color: "#101211" },
        // 3. after payment, the server checks that it is real
        handler: async (response) => {
          await api.post("/payments/verify", { bookingId: booking._id, ...response });
          loadBookings();
        },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  return (
    <div className="wrap page-pad">
      <div className="page-head">
        <h1>My bookings</h1>
        <p className="muted">Spaces you have booked or requested.</p>
      </div>

      {error && <p className="error-box" role="alert">{error}</p>}

      {loading ? (
        <div className="skeleton" style={{ height: 110, borderRadius: 18 }} />
      ) : bookings.length === 0 ? (
        <div className="state-box">
          <span className="state-icon"><Icon name="calendar" size={28} /></span>
          <h3>No bookings yet</h3>
          <p className="muted">Find a storage, parking, workspace or event space and book it.</p>
          <Link to="/" className="btn btn-dark">Find a space</Link>
        </div>
      ) : (
        <div className="list">
          {bookings.map((b) => (
            <div key={b._id} className="item item-col">
              <div className="item-row">
                {b.listing?.images?.[0] ? (
                  <img className="thumb" src={b.listing.images[0]} alt="" />
                ) : (
                  <div className="thumb thumb-empty"><Icon name="image" size={22} /></div>
                )}
                <div className="item-main">
                  <strong className="item-title">{b.listing?.title}</strong>
                  <p className="muted">{b.listing?.city}</p>
                  <p className="muted">{formatDate(b.startDate)} to {formatDate(b.endDate)} · ₹{b.totalAmount}</p>
                </div>
                <span className={"chip chip-" + b.status}>{b.status}</span>
                <div className="item-actions">
                  {b.status === "approved" && (
                    <button className="btn btn-primary btn-sm" onClick={() => pay(b)}>Pay ₹{b.totalAmount}</button>
                  )}
                  {["pending", "approved"].includes(b.status) && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancel(b._id)}>Cancel</button>
                  )}
                  <Link to={"/chat/" + b._id} className="btn btn-ghost btn-sm"><Icon name="chat" size={16} /> Chat</Link>
                </div>
              </div>
              {b.status === "paid" && !b.reviewed && <ReviewForm booking={b} onDone={loadBookings} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
