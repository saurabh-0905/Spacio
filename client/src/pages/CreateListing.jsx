import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { LocationPicker } from "../components/Maps.jsx";
import Icon from "../components/Icons.jsx";
import { CATEGORIES, errorMessage } from "../utils.js";

const MAX_PHOTOS = 4;

// Every photo in the list gets its own id, so reordering and removing stay smooth
let photoCounter = 0;
const photoId = () => "photo-" + photoCounter++;

// One page for two jobs: "List your space" (/add-space) and "Edit your space" (/edit-space/:id)
export default function CreateListing() {
  const { id } = useParams(); // only present when editing
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "", description: "", category: "storage", address: "", city: "", pricePerDay: "", instantBook: false,
    contactPhone: user?.phone || localStorage.getItem("spacio_phone") || "", // from your profile, or your last listing
  });
  const [position, setPosition] = useState({ lat: "", lng: "" });
  // Each photo is either { id, url } (already saved) or { id, file } (just chosen)
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // When editing: load the space and fill the form with it
  useEffect(() => {
    if (!isEdit) return;
    api.get("/listings/" + id)
      .then((res) => {
        const l = res.data;
        if (l.owner._id !== user.id) {
          setLoadError("You can only edit your own spaces.");
          return;
        }
        setForm({
          title: l.title,
          description: l.description || "",
          category: l.category,
          address: l.address || "",
          city: l.city || "",
          pricePerDay: String(l.pricePerDay),
          instantBook: l.instantBook,
          contactPhone: l.contactPhone || user.phone || "",
        });
        setPosition({ lat: l.location.coordinates[1], lng: l.location.coordinates[0] });
        setPhotos(l.images.map((url) => ({ id: photoId(), url })));
      })
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  // Small previews: saved photos use their address, new photos get a temporary one
  const previews = useMemo(
    () => photos.map((p) => (p.url ? p.url : URL.createObjectURL(p.file))),
    [photos]
  );
  useEffect(
    () => () => previews.forEach((u, i) => u.startsWith("blob:") && URL.revokeObjectURL(u)),
    [previews]
  );

  // Add new photos to the ones already there (up to 4)
  function addPhotos(e) {
    const chosen = Array.from(e.target.files).map((file) => ({ id: photoId(), file }));
    setPhotos((old) => [...old, ...chosen].slice(0, MAX_PHOTOS));
    e.target.value = ""; // lets you pick the same photo again later
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  // direction is -1 (move left) or 1 (move right). The first photo is the cover.
  function movePhoto(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const copy = [...photos];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setPhotos(copy);
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

    const newPhotos = photos.filter((p) => p.file);
    newPhotos.forEach((p) => data.append("images", p.file));

    try {
      if (isEdit) {
        // Tell the server which photos to keep and in what order: a saved photo by its address,
        // a new one as "new:0", "new:1" ... (its position among the newly chosen files)
        let newCount = 0;
        const order = photos.map((p) => (p.file ? "new:" + newCount++ : p.url));
        data.append("imageOrder", JSON.stringify(order));
        await api.put("/listings/" + id, data);
      } else {
        await api.post("/listings", data);
      }
      localStorage.setItem("spacio_phone", form.contactPhone);
      navigate("/my-spaces");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="wrap page-pad">
        <div className="state-box">
          <h3>This space could not be opened for editing</h3>
          <p className="muted">{loadError}</p>
          <Link to="/my-spaces" className="btn btn-dark">Back to my spaces</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wrap page-pad">
        <div className="skeleton" style={{ height: 380, borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <div className="wrap page-pad">
      <div className="page-head">
        <h1>{isEdit ? "Edit your space" : "List your space"}</h1>
        <p className="muted">
          {isEdit ? "Change anything below, then save." : "Earn from what you share. Tell guests about your space in a few steps."}
        </p>
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
          <label className={"upload" + (photos.length >= MAX_PHOTOS ? " disabled" : "")}>
            <Icon name="image" size={22} />
            <span>
              {photos.length >= MAX_PHOTOS ? "Maximum 4 photos added" : photos.length === 0 ? "Choose photos" : "Add more photos"}
            </span>
            <input type="file" accept="image/*" multiple disabled={photos.length >= MAX_PHOTOS} onChange={addPhotos} />
          </label>
          <p className="muted photo-count">{photos.length} / {MAX_PHOTOS} photos</p>
          {photos.length > 0 && (
            <div className="previews">
              {photos.map((photo, i) => (
                <div key={photo.id} className="preview">
                  <img src={previews[i]} alt={"Photo " + (i + 1)} />
                  {i === 0 && <span className="cover-tag">Cover</span>}
                  <button type="button" className="preview-remove" onClick={() => removePhoto(i)} aria-label={"Remove photo " + (i + 1)}>
                    <Icon name="close" size={14} />
                  </button>
                  <div className="preview-move">
                    <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} aria-label="Move left">
                      <Icon name="back" size={14} />
                    </button>
                    <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === photos.length - 1} aria-label="Move right">
                      <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="error-box" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Publish space"}
          </button>
          {isEdit && <Link to="/my-spaces" className="btn btn-ghost btn-lg">Cancel</Link>}
        </div>
      </form>
    </div>
  );
}
