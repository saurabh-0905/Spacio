import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { errorMessage } from "../utils.js";
import Icon from "../components/Icons.jsx";

// Profile & settings: change your name, email and mobile number
export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Get the latest details from the server (older logins do not have the phone number saved yet)
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        updateUser(res.data);
        setForm({ name: res.data.name, email: res.data.email, phone: res.data.phone || "" });
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    let value = e.target.value;
    if (e.target.name === "phone") {
      // digits only, and a pasted "+91..." prefix is dropped
      let digits = value.replace(/\D/g, "");
      if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
      value = digits.slice(0, 10);
    }
    setForm({ ...form, [e.target.name]: value });
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await api.put("/auth/me", form);
      updateUser(res.data);
      setForm({ name: res.data.name, email: res.data.email, phone: res.data.phone || "" });
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    setDeleteError("");
    setDeleting(true);
    try {
      await api.delete("/auth/me", { data: { confirm: confirmText, password: deletePassword } });
      logout();
      navigate("/");
      alert("Your account has been deleted.");
    } catch (err) {
      setDeleteError(errorMessage(err));
      setDeleting(false);
    }
  }

  function closeDelete() {
    setShowDelete(false);
    setConfirmText("");
    setDeletePassword("");
    setDeleteError("");
  }

  return (
    <div className="wrap page-pad">
      <div className="profile-head">
        <span className="avatar avatar-xl">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <h1>Profile & settings</h1>
          <p className="muted">Update the details people see and use to reach you.</p>
        </div>
      </div>

      <form className="panel narrow-lg" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required minLength={2} disabled={loading} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="field">
          <label htmlFor="phone">Mobile number</label>
          <div className="phone-input">
            <span>+91</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              pattern="[6-9][0-9]{9}"
              title="Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9"
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <small className="muted">Optional. It is filled in automatically when you list a space.</small>
        </div>

        {error && <p className="error-box" role="alert">{error}</p>}
        {saved && <p className="success-note"><Icon name="check" size={16} /> Your profile has been saved</p>}

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving || loading}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <section className="panel danger-zone narrow-lg">
        <h2 className="h3">Delete account</h2>
        <p className="muted">
          This permanently deletes your account, your spaces (with their bookings, chats and reviews), the bookings you made,
          and your reviews. This cannot be undone.
        </p>

        {!showDelete ? (
          <button type="button" className="btn btn-danger" onClick={() => setShowDelete(true)} disabled={loading}>
            <Icon name="trash" size={16} /> Delete my account
          </button>
        ) : (
          <form onSubmit={handleDelete} className="delete-form">
            {user.hasPassword && (
              <div className="field">
                <label htmlFor="deletePassword">Your password</label>
                <input
                  id="deletePassword"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="confirmText">Type DELETE to confirm</label>
              <input id="confirmText" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" autoComplete="off" />
            </div>

            {deleteError && <p className="error-box" role="alert">{deleteError}</p>}

            <div className="form-actions">
              <button type="submit" className="btn btn-danger-solid" disabled={confirmText !== "DELETE" || deleting}>
                {deleting ? "Deleting..." : "Permanently delete my account"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeDelete}>Keep my account</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
