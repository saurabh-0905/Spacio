import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { errorMessage } from "../utils.js";
import Icon from "../components/Icons.jsx";
import GoogleButton from "../components/GoogleButton.jsx";

// One page used for both login and sign up. mode is "login" or "register".
export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post(isLogin ? "/auth/login" : "/auth/register", form);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-aside">
        <h2>Share the space you have. Find the space you want.</h2>
        <ul>
          <li><Icon name="check" size={18} /> Earn from garages, parking, offices and terraces you are not using</li>
          <li><Icon name="check" size={18} /> Find affordable storage, parking, workspaces and event venues nearby</li>
          <li><Icon name="check" size={18} /> Book, pay, chat and review in one place</li>
        </ul>
      </aside>

      <section className="auth-main">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">{isLogin ? "Log in to manage your spaces and bookings." : "Join Spacio to list a space or book one."}</p>

          <GoogleButton onError={setError} />

          {!isLogin && (
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} required />
          </div>

          {error && <p className="error-box" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>

          <p className="muted center">
            {isLogin ? (
              <>New to Spacio? <Link to="/register">Create an account</Link></>
            ) : (
              <>Already have an account? <Link to="/login">Log in</Link></>
            )}
          </p>

          <p className="legal-note">
            By continuing, you agree to our <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms of Use</Link>.
          </p>
        </form>
      </section>
    </div>
  );
}
