import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { CATEGORIES } from "../utils.js";
import Logo from "./Logo.jsx";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p className="footer-tagline">Make the most of every space. Earn from what you share and save on what you rent.</p>
        </div>

        <div>
          <h4>Explore</h4>
          {CATEGORIES.map((c) => (
            <Link key={c.value} to={"/?category=" + c.value}>{c.label}</Link>
          ))}
        </div>

        <div>
          <h4>Hosting</h4>
          <Link to="/add-space">List a space</Link>
          <Link to="/my-spaces">My spaces</Link>
        </div>

        <div>
          <h4>Account</h4>
          {user ? (
            <>
              <Link to="/profile">Profile & settings</Link>
              <Link to="/my-bookings">My bookings</Link>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Spacio. Share the space you have. Find the space you want.</span>
        <span className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Use</Link>
        </span>
      </div>
    </footer>
  );
}
