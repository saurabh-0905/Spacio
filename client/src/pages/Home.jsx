import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ListingCard from "../components/ListingCard.jsx";
import { ListingsMap } from "../components/Maps.jsx";
import Icon from "../components/Icons.jsx";
import { CATEGORIES, errorMessage, localToday } from "../utils.js";

const emptyFilters = { category: "", city: "", maxPrice: "", priceUnit: "day", startDate: "", endDate: "", lat: "", lng: "" };

const STEPS = [
  { title: "Discover", text: "Search by category, city, dates or distance, and compare spaces on a list or a map." },
  { title: "Book", text: "Send a booking request, or book instantly when the host allows it. Pay securely online once it is approved." },
  { title: "Connect", text: "Chat with your host, use the space, and leave a review afterwards." },
];

const FEATURES = [
  { icon: "search", title: "Search that fits", text: "Filter by category, city, budget and free dates, or find spaces within 10 km of you." },
  { icon: "map", title: "See it on a map", text: "Switch between a list and a map to see exactly where each space is." },
  { icon: "bolt", title: "Instant or on request", text: "Hosts can allow instant booking or approve each request themselves." },
  { icon: "card", title: "Secure online payment", text: "Pay through Razorpay once your booking is approved." },
  { icon: "chat", title: "Talk to your host", text: "Live chat for every booking, so questions never wait." },
  { icon: "star", title: "Honest reviews", text: "Only guests who have paid for a booking can leave a review." },
];

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "";

  const [filters, setFilters] = useState({ ...emptyFilters, category: categoryFromUrl });
  const [listings, setListings] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  const today = localToday();

  // Ask the server for spaces that match the filters (empty ones are skipped)
  async function search(f = filters) {
    setLoading(true);
    setError("");
    try {
      const params = {};
      for (const key in f) {
        if (f[key]) params[key] = f[key];
      }
      if (!params.maxPrice) delete params.priceUnit; // the price type only matters together with a maximum price
      const res = await api.get("/listings", { params });
      setListings(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Runs when the page opens, and when a footer link like /?category=parking is clicked
  useEffect(() => {
    const f = { ...filters, category: categoryFromUrl };
    setFilters(f);
    search(f);
    if (categoryFromUrl) scrollToResults();
  }, [categoryFromUrl]);

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    search();
    scrollToResults();
  }

  function pickCategory(value) {
    const f = { ...filters, category: filters.category === value ? "" : value };
    setFilters(f);
    search(f);
    scrollToResults();
  }

  function nearMe() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const f = { ...filters, lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFilters(f);
        search(f);
        scrollToResults();
      },
      () => alert("Could not get your location. Please allow location access.")
    );
  }

  function removeNearMe() {
    const f = { ...filters, lat: "", lng: "" };
    setFilters(f);
    search(f);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    search(emptyFilters);
  }

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="wrap hero-inner">
          <span className="eyebrow-pill fade-up">Peer-to-peer space rental</span>
          <h1 className="fade-up d1">
            Share the space you have.
            <br />
            <span className="accent">Find the space you want.</span>
          </h1>
          <p className="hero-sub fade-up d2">
            Make the most of every space. Earn from what you share and save on what you rent.
          </p>

          <form className="searchbar fade-up d3" onSubmit={handleSubmit}>
            <label className="sb-field">
              <span>Category</span>
              <select name="category" value={filters.category} onChange={handleChange}>
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="sb-field">
              <span>City</span>
              <input name="city" placeholder="Where? e.g. Pune" value={filters.city} onChange={handleChange} />
            </label>
            <label className="sb-field">
              <span>From</span>
              <input name="startDate" type="date" min={today} value={filters.startDate} onChange={handleChange} />
            </label>
            <label className="sb-field">
              <span>To</span>
              <input name="endDate" type="date" min={filters.startDate || today} value={filters.endDate} onChange={handleChange} />
            </label>
            <button type="submit" className="btn btn-primary sb-btn">
              <Icon name="search" size={18} /> Search
            </button>
          </form>

          <div className="hero-actions fade-up d4">
            <button type="button" className="btn btn-outline-light btn-sm" onClick={nearMe}>
              <Icon name="target" size={16} /> Near me
            </button>
            {filters.lat && (
              <button type="button" className="chip-btn" onClick={removeNearMe}>
                Within 10 km of you <Icon name="close" size={14} />
              </button>
            )}
            <button type="button" className="linklike" onClick={clearFilters}>Clear all filters</button>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="section section-white section-overlap">
        <div className="wrap">
          <span className="eyebrow">What can you rent?</span>
          <h2 className="section-title">Browse by category</h2>
          <div className="category-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={"category-card" + (filters.category === c.value ? " active" : "")}
                onClick={() => pickCategory(c.value)}
                aria-pressed={filters.category === c.value}
              >
                <span className="category-icon"><Icon name={c.icon} size={26} /></span>
                <strong>{c.label}</strong>
                <span>{c.blurb}</span>
                <span className="category-go">Browse <Icon name="arrow" size={16} /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Results ---------- */}
      <section className="section section-off" ref={resultsRef} id="explore">
        <div className="wrap">
          <div className="results-head">
            <div>
              <span className="eyebrow">Explore</span>
              <h2 className="section-title">Available spaces</h2>
              <p className="muted">
                {loading ? "Searching..." : `${listings.length} ${listings.length === 1 ? "space" : "spaces"} found`}
              </p>
            </div>

            <div className="results-tools">
              <form className="price-filter" onSubmit={handleSubmit}>
                <input
                  name="maxPrice"
                  type="number"
                  min="1"
                  placeholder="Max price (₹)"
                  aria-label="Maximum price"
                  value={filters.maxPrice}
                  onChange={handleChange}
                />
                <select name="priceUnit" value={filters.priceUnit} onChange={handleChange} aria-label="Price type">
                  <option value="day">per day</option>
                  <option value="hour">per hour</option>
                </select>
                <button type="submit" className="btn btn-dark btn-sm">Apply</button>
              </form>
              <div className="segmented" role="group" aria-label="View">
                <button type="button" className={!showMap ? "on" : ""} onClick={() => setShowMap(false)}>
                  <Icon name="grid" size={16} /> Grid
                </button>
                <button type="button" className={showMap ? "on" : ""} onClick={() => setShowMap(true)}>
                  <Icon name="map" size={16} /> Map
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="state-box">
              <h3>We could not load the spaces</h3>
              <p className="muted">{error}</p>
              <button className="btn btn-dark" onClick={() => search()}>Try again</button>
            </div>
          ) : loading ? (
            <div className="grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card-skeleton">
                  <div className="skeleton skeleton-img" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="state-box">
              <span className="state-icon"><Icon name="search" size={28} /></span>
              <h3>No spaces match your search</h3>
              <p className="muted">Try a different city or category, or remove some filters.</p>
              <button className="btn btn-dark" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : showMap ? (
            <ListingsMap listings={listings} />
          ) : (
            <div className="grid">
              {listings.map((l, i) => (
                <div key={l._id} className="fade-up" style={{ animationDelay: Math.min(i, 8) * 40 + "ms" }}>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section section-dark">
        <div className="wrap">
          <span className="eyebrow eyebrow-lime">Simple by design</span>
          <h2 className="section-title">How Spacio works</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="step">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="section section-white">
        <div className="wrap">
          <span className="eyebrow">Why Spacio</span>
          <h2 className="section-title">Everything you need to rent a space</h2>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <span className="feature-icon"><Icon name={f.icon} size={22} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Host call to action ---------- */}
      <section className="section-pad-sm">
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Got a space sitting empty?</h2>
              <p>Earn from what you share. List a garage, parking spot, office or terrace in minutes.</p>
            </div>
            <Link to={user ? "/add-space" : "/register"} className="btn btn-primary btn-lg">
              {user ? "List your space" : "Get started"} <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
