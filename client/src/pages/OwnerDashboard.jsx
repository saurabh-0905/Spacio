import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import Icon from "../components/Icons.jsx";
import { categoryLabel, errorMessage, formatDate } from "../utils.js";

// "My spaces": the owner's listings and the booking requests they received
export default function OwnerDashboard() {
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const mine = await api.get("/listings/mine");
      const incoming = await api.get("/bookings/requests");
      setListings(mine.data);
      setRequests(incoming.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function changeStatus(bookingId, status) {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      loadData();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  async function deleteListing(id) {
    if (!confirm("Delete this space?")) return;
    try {
      await api.delete("/listings/" + id);
      loadData();
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  // Numbers for the top cards, worked out from the data we already have
  const pending = requests.filter((b) => b.status === "pending").length;
  const paid = requests.filter((b) => b.status === "paid");
  const earned = paid.reduce((sum, b) => sum + b.totalAmount, 0);

  const stats = [
    { icon: "home", label: "Your spaces", value: listings.length },
    { icon: "clock", label: "Waiting for approval", value: pending },
    { icon: "check", label: "Paid bookings", value: paid.length },
    { icon: "wallet", label: "Earned", value: "₹" + earned },
  ];

  return (
    <div className="wrap page-pad">
      <div className="page-head row-between">
        <div>
          <h1>My spaces</h1>
          <p className="muted">Manage your listings and booking requests.</p>
        </div>
        <Link to="/add-space" className="btn btn-primary"><Icon name="plus" size={18} /> List a space</Link>
      </div>

      {error && <p className="error-box" role="alert">{error}</p>}

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-icon"><Icon name={s.icon} size={20} /></span>
            <span className="stat-value">{loading ? "-" : s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <h2 className="h3">Your listings</h2>
      {loading ? (
        <div className="skeleton" style={{ height: 90, borderRadius: 18 }} />
      ) : listings.length === 0 ? (
        <div className="state-box">
          <span className="state-icon"><Icon name="home" size={28} /></span>
          <h3>You have not listed anything yet</h3>
          <p className="muted">List a garage, parking spot, office or terrace and start earning.</p>
          <Link to="/add-space" className="btn btn-dark">List your first space</Link>
        </div>
      ) : (
        <div className="list">
          {listings.map((l) => (
            <div key={l._id} className="item">
              {l.images[0] ? <img className="thumb" src={l.images[0]} alt="" /> : <div className="thumb thumb-empty"><Icon name="image" size={22} /></div>}
              <div className="item-main">
                <Link to={"/listings/" + l._id} className="item-title">{l.title}</Link>
                <p className="muted">{categoryLabel(l.category)} · {l.city} · ₹{l.pricePerDay} / day</p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteListing(l._id)}>
                <Icon name="trash" size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="h3">Booking requests</h2>
      {loading ? null : requests.length === 0 ? (
        <p className="muted">No requests yet. They will show up here when someone books your space.</p>
      ) : (
        <div className="list">
          {requests.map((b) => (
            <div key={b._id} className="item">
              <div className="item-main">
                <strong className="item-title">{b.listing?.title}</strong>
                <p className="muted">
                  {b.customer.name} · {formatDate(b.startDate)} to {formatDate(b.endDate)} · ₹{b.totalAmount}
                </p>
              </div>
              <span className={"chip chip-" + b.status}>{b.status}</span>
              <div className="item-actions">
                {b.status === "pending" && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => changeStatus(b._id, "approved")}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => changeStatus(b._id, "rejected")}>Reject</button>
                  </>
                )}
                <Link to={"/chat/" + b._id} className="btn btn-ghost btn-sm"><Icon name="chat" size={16} /> Chat</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
