import { useEffect, useState } from "react";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { errorMessage } from "../utils.js";
import Icon from "../components/Icons.jsx";

// Profile & settings: change your name, email and mobile number
export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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
    </div>
  );
}
