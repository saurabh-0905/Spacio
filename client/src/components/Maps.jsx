import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "./Icons.jsx";

const PUNE = [18.5204, 73.8567];
const TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const CREDIT = "&copy; OpenStreetMap contributors";

// Address search by Photon: a free service built on OpenStreetMap data (no API key needed).
// The box below limits the search to India.
const SEARCH_URL = "https://photon.komoot.io/api/";
const INDIA_BOX = "68.1,6.7,97.4,35.7";

// A price tag pin for each space (styled in index.css)
function pricePin(price) {
  return L.divIcon({
    className: "price-pin",
    html: "₹" + price,
    iconSize: [64, 30],
    iconAnchor: [32, 30],
    popupAnchor: [0, -30],
  });
}

// A simple dot for the owner's chosen location
const pickPin = L.divIcon({ className: "pick-pin", html: "", iconSize: [22, 22], iconAnchor: [11, 11] });

function googleMapsLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Shows many listings as pins on a map
export function ListingsMap({ listings }) {
  // listing.location.coordinates is [lng, lat], but Leaflet wants [lat, lng]
  const toLatLng = (l) => [l.location.coordinates[1], l.location.coordinates[0]];
  const center = listings.length > 0 ? toLatLng(listings[0]) : PUNE;

  return (
    // "key" makes the map jump to the new results when the list changes
    <MapContainer key={center.join(",") + listings.length} center={center} zoom={listings.length === 1 ? 15 : 12} className="map">
      <TileLayer url={TILES} attribution={CREDIT} />
      {listings.map((l) => (
        <Marker key={l._id} position={toLatLng(l)} icon={pricePin(l.pricePerDay)}>
          <Popup>
            <Link to={"/listings/" + l._id}>{l.title}</Link>
            <br />₹{l.pricePerDay} / day
            <br />
            <a href={googleMapsLink(...toLatLng(l))} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// Listens for clicks on the map
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Moves the map to a place chosen from the search box
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16);
  }, [target]);
  return null;
}

// Turns one search result from Photon into the few things we need
function describe(feature) {
  const p = feature.properties;
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const title = p.name || street || p.district || p.city || "Unnamed place";
  const city = p.city || p.county || p.state || "";
  const details = [...new Set([street, p.district, city, p.state].filter((x) => x && x !== title))];
  return {
    title,
    subtitle: details.join(", "),
    lat: feature.geometry.coordinates[1], // Photon gives [lng, lat]
    lng: feature.geometry.coordinates[0],
    // used to fill the address and city boxes of the form
    address: [...new Set([title, street, p.district].filter(Boolean))].join(", "),
    city,
  };
}

// Owner searches for an address (like Google Maps), or clicks / drags on the map
// onPick(lat, lng, place) is called with place only when a search result is chosen
export function LocationPicker({ lat, lng, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);
  const lastChosen = useRef(""); // text we put in the box after a suggestion was chosen

  // Search while typing (waits 0.4 seconds after the last key press)
  useEffect(() => {
    if (query === lastChosen.current) return; // this text came from choosing a suggestion
    if (query.trim().length < 3) {
      setResults([]);
      setMessage("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setMessage("");
      try {
        // results closer to the current pin (or Pune) are listed first
        const near = lat !== "" ? [lat, lng] : PUNE;
        const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=6&lang=en&bbox=${INDIA_BOX}&lat=${near[0]}&lon=${near[1]}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const found = data.features.map(describe);
        setResults(found);
        setOpen(true);
        if (found.length === 0) setMessage("No places found. Try a nearby landmark or area name.");
      } catch (err) {
        if (err.name !== "AbortError") setMessage("Search is not available right now. You can still click on the map.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(place) {
    const text = [place.title, place.subtitle].filter(Boolean).join(", ");
    lastChosen.current = text;
    setQuery(text);
    setResults([]);
    setOpen(false);
    setFlyTarget([place.lat, place.lng]);
    onPick(place.lat, place.lng, place);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Enter must not submit the whole listing form
      if (results.length > 0) choose(results[0]);
    }
  }

  function locateMe() {
    if (!navigator.geolocation) return setMessage("Your browser cannot share your location.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTarget([pos.coords.latitude, pos.coords.longitude]);
        onPick(pos.coords.latitude, pos.coords.longitude);
      },
      () => setMessage("Could not get your location. Please allow location access.")
    );
  }

  return (
    <div className="locator">
      <div className="locator-bar" onBlur={() => setOpen(false)}>
        <div className="locator-input">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Search address, area or landmark"
            aria-label="Search for the location of your space"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {searching && <span className="spinner" aria-label="Searching" />}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={locateMe}>
          <Icon name="target" size={16} /> Use my location
        </button>

        {open && results.length > 0 && (
          // onMouseDown keeps the focus inside the search box, so the list stays open until the click is done
          <ul className="suggestions" onMouseDown={(e) => e.preventDefault()}>
            {results.map((r, i) => (
              <li key={i}>
                <button type="button" onClick={() => choose(r)}>
                  <Icon name="pin" size={16} />
                  <span>
                    <strong>{r.title}</strong>
                    {r.subtitle && <small>{r.subtitle}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {message && <p className="muted locator-msg">{message}</p>}

      <MapContainer center={lat ? [lat, lng] : PUNE} zoom={12} className="map">
        <TileLayer url={TILES} attribution={CREDIT} />
        <ClickHandler onPick={onPick} />
        <FlyTo target={flyTarget} />
        {lat !== "" && (
          <Marker
            position={[lat, lng]}
            icon={pickPin}
            draggable
            eventHandlers={{
              dragend(e) {
                const spot = e.target.getLatLng();
                onPick(spot.lat, spot.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
