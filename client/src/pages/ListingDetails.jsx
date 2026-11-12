import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { ListingsMap } from "../components/Maps.jsx";
import Icon from "../components/Icons.jsx";
import { categoryLabel, errorMessage, formatDate, formatPhone, hourLabel, hourValue, localToday, slotText } from "../utils.js";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [dates, setDates] = useState({ startDate: "", endDate: "" });
  const [times, setTimes] = useState({ from: "", to: "" }); // hours, for per-hour spaces
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

  const today = localToday();

  // A space is priced per day (guests pick dates) or per hour (guests pick one date and hours)
  const isHourly = listing.priceUnit === "hour";
  const unitWord = isHourly ? "hour" : "day";

  // Price preview: days (both days count) or hours, times the price
  let quantity = 0;
  if (isHourly) {
    if (times.from !== "" && times.to !== "" && Number(times.to) > Number(times.from)) {
      quantity = Number(times.to) - Number(times.from);
    }
  } else if (dates.startDate && dates.endDate) {
    quantity = Math.round((new Date(dates.endDate) - new Date(dates.startDate)) / 86400000) + 1;
  }
  const total = quantity > 0 ? quantity * listing.price : 0;

  // Hours to choose from. Hours that have already started today are left out.
  const firstHour = dates.startDate === today ? new Date().getHours() + 1 : 0;
  const startHours = Array.from({ length: Math.max(0, 24 - firstHour) }, (_, i) => firstHour + i);
  const endHours = times.from === "" ? [] : Array.from({ length: 24 - Number(times.from) }, (_, i) => Number(times.from) + 1 + i);
  const bookedSlots = listing.bookedSlotsToday || [];

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const photos = listing.images.slice(0, 4);
  const isOwner = Boolean(user) && listing.owner._id === user.id;

  // Links to Google Maps (coordinates are saved as [lng, lat])
  const [spotLng, spotLat] = listing.location.coordinates;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${spotLat},${spotLng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spotLat},${spotLng}`;

  async function handleDelete() {
    if (!confirm("Delete this space? Its bookings, chats and reviews will be deleted too. This cannot be undone.")) return;
    try {
      await api.delete("/listings/" + id);
      navigate("/my-spaces");
    } catch (err) {
      alert(errorMessage(err));
    }
  }

  async function handleBook(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    setError("");
    setSubmitting(true);
    try {
      const body = isHourly
        ? { listingId: id, startDate: dates.startDate, startTime: hourValue(times.from), endTime: hourValue(times.to) }
        : { listingId: id, ...dates };
      const res = await api.post("/bookings", body);
      alert(
        res.data.status === "approved"
          ? "Booked! Your booking is confirmed. Agree on payment with the host from My bookings."
          : "Request sent! The host will review it. You can follow it in My bookings."
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
            {listing.isDemo && <span className="badge badge-demo-solid">Demo listing</span>}
            {listing.unavailableToday && <span className="badge badge-unavailable-solid">Unavailable today</span>}
            {!listing.unavailableToday && bookedSlots.length > 0 && <span className="badge badge-partial-solid">Booked today</span>}
          </div>
          <h1 className="detail-title">{listing.title}</h1>
          <p className="muted detail-sub">
            <Icon name="pin" size={16} /> {[listing.address, listing.city].filter(Boolean).join(", ")} · Hosted by {listing.owner.name}
          </p>

          {listing.unavailableToday && (
            <div className="notice notice-warn">
              <Icon name="alert" size={18} />
              <span>This space already has a confirmed booking for today. You can still book other dates.</span>
            </div>
          )}
          {!listing.unavailableToday && bookedSlots.length > 0 && (
            <div className="notice notice-warn">
              <Icon name="alert" size={18} />
              <span>Already booked today: {bookedSlots.map(slotText).join(", ")}. You can still book other hours or dates.</span>
            </div>
          )}
          {listing.isDemo && (
            <div className="notice">
              <Icon name="alert" size={18} />
              <span>Demo listing: this space was added by the Spacio team to show how the app works. It is not a real offer.</span>
            </div>
          )}

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
          {reviews.length === 0 && <p className="muted">No reviews yet. Guests can review a space once their booking is confirmed.</p>}
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

        {isOwner ? (
          <div className="booking-box">
            <p className="booking-price"><strong>₹{listing.price}</strong> <span>/ {unitWord}</span></p>
            <p className="muted owner-note">This is your space.</p>
            <div className="stack-sm">
              <Link to={"/edit-space/" + id} className="btn btn-dark btn-block"><Icon name="edit" size={16} /> Edit space</Link>
              <button type="button" className="btn btn-danger btn-block" onClick={handleDelete}><Icon name="trash" size={16} /> Delete space</button>
            </div>
          </div>
        ) : (
          <form className="booking-box" onSubmit={handleBook}>
            <p className="booking-price"><strong>₹{listing.price}</strong> <span>/ {unitWord}</span></p>

            {isHourly ? (
              <>
                <div className="field">
                  <label htmlFor="startDate">Date</label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    min={today}
                    value={dates.startDate}
                    onChange={(e) => {
                      setDates({ ...dates, startDate: e.target.value });
                      setTimes({ from: "", to: "" }); // the hours that can be chosen depend on the date
                    }}
                  />
                </div>
                <div className="field-row-tight">
                  <div className="field">
                    <label htmlFor="fromHour">From</label>
                    <select id="fromHour" required disabled={!dates.startDate} value={times.from} onChange={(e) => setTimes({ from: e.target.value, to: "" })}>
                      <option value="">Select</option>
                      {startHours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="toHour">To</label>
                    <select id="toHour" required disabled={times.from === ""} value={times.to} onChange={(e) => setTimes({ ...times, to: e.target.value })}>
                      <option value="">Select</option>
                      {endHours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                  </div>
                </div>
                {dates.startDate && startHours.length === 0 && <p className="muted">No hours are left today. Please pick another date.</p>}
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="startDate">From</label>
                  <input id="startDate" type="date" required min={today} value={dates.startDate} onChange={(e) => setDates({ ...dates, startDate: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="endDate">To</label>
                  <input id="endDate" type="date" required min={dates.startDate || today} value={dates.endDate} onChange={(e) => setDates({ ...dates, endDate: e.target.value })} />
                </div>
              </>
            )}

            {total > 0 && (
              <div className="summary">
                <div><span>₹{listing.price} × {quantity} {unitWord}{quantity === 1 ? "" : "s"}</span><span>₹{total}</span></div>
                <div className="summary-total"><span>Total</span><span>₹{total}</span></div>
              </div>
            )}

            {error && <p className="error-box" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? "Please wait..." : listing.instantBook ? "Book now" : "Request booking"}
            </button>
            <p className="fine-print">Spacio does not take payments. After the booking is confirmed, agree on payment directly with the host.</p>
          </form>
        )}
      </div>
    </div>
  );
}
