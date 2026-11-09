import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { ListingsMap } from "../components/Maps.jsx";
import Icon from "../components/Icons.jsx";
import { categoryLabel, errorMessage, formatDate, formatPhone } from "../utils.js";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [dates, setDates] = useState({ startDate: "", endDate: "" });
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/listings/" + id)
      .then((res) => setListing(res.data))
      .catch((err) => setLoadError(errorMessage(err)));
    api.get("/reviews/listing/" + id)
      .then((res) => setReviews(res.data))
      .catch(() => {}); // reviews are optional, so we ignore errors here
  }, [id]);

  if (loadError) {
    return (
      <div className="wrap page-pad">
        <div className="state-box">
          <h3>This space could not be loaded</h3>
          <p className="muted">{loadError}</p>
          <Link to="/" className="btn btn-dark">Back to explore</Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="wrap page-pad">
        <div className="skeleton" style={{ height: 380, borderRadius: 20 }} />
        <div className="skeleton skeleton-line" style={{ marginTop: 24, width: "50%" }} />
        <div className="skeleton skeleton-line short" />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // Price preview: number of days (both days count) x price per day
  let days = 0;
  if (dates.startDate && dates.endDate) {
    days = Math.round((new Date(dates.endDate) - new Date(dates.startDate)) / 86400000) + 1;
  }
  const total = days > 0 ? days * listing.pricePerDay : 0;

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const photos = listing.images.slice(0, 4);

  // Links to Google Maps (coordinates are saved as [lng, lat])
  const [spotLng, spotLat] = listing.location.coordinates;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${spotLat},${spotLng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spotLat},${spotLng}`;

  async function handleBook(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/bookings", { listingId: id, ...dates });
      alert(
        res.data.status === "approved"
          ? "Booked! Go to My bookings to pay."
          : "Request sent! You can pay once the owner approves it."
      );
      navigate("/my-bookings");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap page-pad">
      <Link to="/" className="back-link"><Icon name="back" size={16} /> Back to explore</Link>

      {photos.length > 0 ? (
        <div className={"gallery count-" + photos.length}>
          {photos.map((url) => (
            <img key={url} src={url} alt={listing.title} />
          ))}
        </div>
      ) : (
        <div className="gallery-empty"><Icon name="image" size={40} /> No photos added yet</div>
      )}

      <div className="details">
        <div>
          <div className="meta-row">
            <span className="badge badge-dark-solid">{categoryLabel(listing.category)}</span>
            {listing.instantBook && <span className="badge badge-lime-solid"><Icon name="bolt" size={12} /> Instant booking</span>}
          </div>
          <h1 className="detail-title">{listing.title}</h1>
          <p className="muted detail-sub">
            <Icon name="pin" size={16} /> {[listing.address, listing.city].filter(Boolean).join(", ")} · Hosted by {listing.owner.name}
          </p>

          <h2 className="h3">About this space</h2>
          <p className="description">{listing.description || "The host has not added a description yet."}</p>

          <h2 className="h3">Contact the host</h2>
          <div className="contact-card">
            {!user ? (
              <>
                <p>Log in to see {listing.owner.name}'s phone number.</p>
                <Link to="/login" className="btn btn-dark btn-sm">Log in</Link>
              </>
            ) : listing.contactPhone ? (
              <>
                <div>
                  <strong>{listing.owner.name}</strong>
                  <p className="phone">{formatPhone(listing.contactPhone)}</p>
                </div>
                <div className="map-links">
                  <a className="btn btn-dark btn-sm" href={"tel:+91" + listing.contactPhone}>
                    <Icon name="phone" size={16} /> Call
                  </a>
                  <a className="btn btn-ghost btn-sm" href={"https://wa.me/91" + listing.contactPhone} target="_blank" rel="noopener noreferrer">
                    <Icon name="chat" size={16} /> WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="muted">The host has not added a phone number yet. Send a booking request and use the booking chat to talk to them.</p>
            )}
          </div>

          <h2 className="h3">Location</h2>
          <ListingsMap listings={[listing]} />
          <div className="map-links">
            <a className="btn btn-dark btn-sm" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="map" size={16} /> Open in Google Maps
            </a>
            <a className="btn btn-ghost btn-sm" href={directionsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="arrow" size={16} /> Get directions
            </a>
          </div>

          <h2 className="h3">
            Reviews {averageRating && <span className="rating-pill">★ {averageRating} · {reviews.length}</span>}
          </h2>
          {reviews.length === 0 && <p className="muted">No reviews yet. Reviews appear after guests have paid for a booking.</p>}
          {reviews.map((r) => (
            <div key={r._id} className="review">
              <div className="review-head">
                <strong>{r.reviewer.name}</strong>
                <span>{"★".repeat(r.rating)}</span>
                <span className="muted">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>

        <form className="booking-box" onSubmit={handleBook}>
          <p className="booking-price"><strong>₹{listing.pricePerDay}</strong> <span>/ day</span></p>

          <div className="field">
            <label htmlFor="startDate">From</label>
            <input id="startDate" type="date" required min={today} value={dates.startDate} onChange={(e) => setDates({ ...dates, startDate: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="endDate">To</label>
            <input id="endDate" type="date" required min={dates.startDate || today} value={dates.endDate} onChange={(e) => setDates({ ...dates, endDate: e.target.value })} />
          </div>

          {total > 0 && (
            <div className="summary">
              <div><span>₹{listing.pricePerDay} × {days} {days === 1 ? "day" : "days"}</span><span>₹{total}</span></div>
              <div className="summary-total"><span>Total</span><span>₹{total}</span></div>
            </div>
          )}

          {error && <p className="error-box" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? "Please wait..." : listing.instantBook ? "Book now" : "Request booking"}
          </button>
          <p className="fine-print">You pay securely online from My bookings once the booking is confirmed.</p>
        </form>
      </div>
    </div>
  );
}
