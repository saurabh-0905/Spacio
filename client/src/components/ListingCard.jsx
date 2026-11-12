import { Link } from "react-router-dom";
import { categoryLabel } from "../utils.js";
import Icon from "./Icons.jsx";

export default function ListingCard({ listing }) {
  return (
    <Link to={"/listings/" + listing._id} className={"card" + (listing.unavailableToday ? " is-unavailable" : "")}>
      <div className="card-media">
        {listing.images[0] ? (
          <img src={listing.images[0]} alt={listing.title} loading="lazy" />
        ) : (
          <div className="no-photo"><Icon name="image" size={32} /></div>
        )}
        <span className="badge badge-dark">{categoryLabel(listing.category)}</span>
        {listing.instantBook && (
          <span className="badge badge-lime"><Icon name="bolt" size={12} /> Instant</span>
        )}
        {listing.isDemo && <span className="badge badge-demo">Demo listing</span>}
        {listing.unavailableToday && <span className="badge badge-unavailable">Unavailable today</span>}
        {!listing.unavailableToday && listing.bookedSlotsToday?.length > 0 && <span className="badge badge-partial">Booked today</span>}
      </div>
      <div className="card-body">
        <h3>{listing.title}</h3>
        <p className="card-meta"><Icon name="pin" size={15} /> {listing.city || "Location on map"}</p>
        <p className="card-price"><strong>₹{listing.price}</strong> <span>/ {listing.priceUnit === "hour" ? "hour" : "day"}</span></p>
      </div>
    </Link>
  );
}
