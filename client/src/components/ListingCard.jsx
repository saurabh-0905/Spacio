import { Link } from "react-router-dom";
import { categoryLabel } from "../utils.js";
import Icon from "./Icons.jsx";

export default function ListingCard({ listing }) {
  return (
    <Link to={"/listings/" + listing._id} className="card">
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
      </div>
      <div className="card-body">
        <h3>{listing.title}</h3>
        <p className="card-meta"><Icon name="pin" size={15} /> {listing.city || "Location on map"}</p>
        <p className="card-price"><strong>₹{listing.pricePerDay}</strong> <span>/ day</span></p>
      </div>
    </Link>
  );
}
