import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { LocationPicker } from "../components/Maps.jsx";
import Icon from "../components/Icons.jsx";
import { CATEGORIES, errorMessage } from "../utils.js";

const MAX_PHOTOS = 4;

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", category: "storage", address: "", city: "", pricePerDay: "", instantBook: false,
    contactPhone: user?.phone || localStorage.getItem("spacio_phone") || "", // from your profile, or your last listing
  });
  const [position, setPosition] = useState({ lat: "", lng: "" });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Small previews of the chosen photos
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  // Add new photos to the ones already chosen (up to 4)
  function addPhotos(e) {
    const chosen = Array.from(e.target.files);
    setFiles((old) => [...old, ...chosen].slice(0, MAX_PHOTOS));
    e.target.value = ""; // lets you pick the same photo again later
  }

  function removePhoto(index) {
    setFiles(files.filter((_, i) => i !== index));
  }

  // direction is -1 (move left) or 1 (move right). The first photo is the cover.
  function movePhoto(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    const copy = [...files];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setFiles(copy);
  }

  // Called when the owner searches, clicks or drags on the map.
  // "place" exists only when a search result was chosen: we then replace the address and city boxes.
  function handlePick(lat, lng, place) {
    setPosition({ lat, lng });
    if (place) {
      setForm((old) => ({ ...old, address: place.address, city: place.city }));
    }
  }

  function handleChange(e) {
    let value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (e.target.name === "contactPhone") {
      // digits only, and a pasted "+91..." prefix is dropped
      let digits = value.replace(/\D/g, "");
      if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
      value = digits.slice(0, 10);
    }
    setForm({ ...form, [e.target.name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Photos can't go in normal JSON, so we use FormData
    const data = new FormData();
    for (const key in form) data.append(key, form[key]);
    data.append("lat", position.lat);
    data.append("lng", position.lng);
    for (const file of files) data.append("images", file);

    try {
      await api.post("/listings", data);
      localStorage.setItem("spacio_phone", form.contactPhone);
      navigate("/my-spaces");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap page-pad">
      <div className="page-head">
        <h1>List your space</h1>
        <p className="muted">Earn from what you share. Tell guests about your space in a few steps.</p>
      </div>

      <form className="stack narrow-lg" onSubmit={handleSubmit}>
        <section className="panel">
          <h2 className="h3">1. The basics</h2>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" placeholder="e.g. Clean garage near Kothrud" value={form.title} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows="4" placeholder="Size, access, rules, anything guests should know" value={form.description} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Category</label>
            <div className="pill-group">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={"pill" + (form.category === c.value ? " on" : "")}
                  onClick={() => setForm({ ...form, category: c.value })}
                  aria-pressed={form.category === c.value}
                >
                  <Icon name={c.icon} size={18} /> {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="h3">2. Location</h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="address">Address</label>
              <input id="address" name="address" placeholder="Street or landmark" value={form.address} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" placeholder="e.g. Pune" value={form.city} onChange={handleChange} required />
            </div>
          </div>
          <p className="muted">Search for the address, or click on the map. You can drag the pin to fine-tune the exact spot.</p>
          <LocationPicker lat={position.lat} lng={position.lng} onPick={handlePick} />
          {position.lat !== "" && <p className="success-note"><Icon name="check" size={16} /> Location selected</p>}
        </section>

        <section className="panel">
          <h2 className="h3">3. Price and booking</h2>
          <div className="field">
            <label htmlFor="pricePerDay">Price per day (₹)</label>
            <input id="pricePerDay" name="pricePerDay" type="number" min="1" placeholder="e.g. 70" value={form.pricePerDay} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="contactPhone">Your contact number</label>
            <div className="phone-input">
              <span>+91</span>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                pattern="[6-9][0-9]{9}"
                title="Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9"
                required
                value={form.contactPhone}
                onChange={handleChange}
              />
            </div>
            <small className="muted">Guests who are logged in can see this number on your space page.</small>
          </div>
          <label className="switch-row">
            <span>
              <strong>Allow instant booking</strong>
              <small>Guests can book without waiting for your approval.</small>
            </span>
            <input name="instantBook" type="checkbox" className="switch" checked={form.instantBook} onChange={handleChange} />
          </label>
        </section>

        <section className="panel">
          <h2 className="h3">4. Photos</h2>
          <p className="muted">Add up to 4 clear photos. The first one is the cover. Use the arrows to change the order.</p>
          <label className={"upload" + (files.length >= MAX_PHOTOS ? " disabled" : "")}>
            <Icon name="image" size={22} />
            <span>
              {files.length >= MAX_PHOTOS ? "Maximum 4 photos added" : files.length === 0 ? "Choose photos" : "Add more photos"}
            </span>
            <input type="file" accept="image/*" multiple disabled={files.length >= MAX_PHOTOS} onChange={addPhotos} />
          </label>
          <p className="muted photo-count">{files.length} / {MAX_PHOTOS} photos</p>
          {previews.length > 0 && (
            <div className="previews">
              {previews.map((url, i) => (
                <div key={url} className="preview">
                  <img src={url} alt={"Photo " + (i + 1)} />
                  {i === 0 && <span className="cover-tag">Cover</span>}
                  <button type="button" className="preview-remove" onClick={() => removePhoto(i)} aria-label={"Remove photo " + (i + 1)}>
                    <Icon name="close" size={14} />
                  </button>
                  <div className="preview-move">
                    <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} aria-label="Move left">
                      <Icon name="back" size={14} />
                    </button>
                    <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === previews.length - 1} aria-label="Move right">
                      <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="error-box" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? "Publishing..." : "Publish space"}
        </button>
      </form>
    </div>
  );
}
