import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { CATEGORIES } from "../utils.js";
import { SUPPORT_EMAIL, SUPPORT_PHONE_TEL, SUPPORT_PHONE_DISPLAY, LINKEDIN_URL } from "../siteInfo.js";
import Logo from "./Logo.jsx";
import Icon from "./Icons.jsx";

// The LinkedIn logo
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p className="footer-tagline">Make the most of every space. Earn from what you share and save on what you rent.</p>
          <a
            className="social-btn"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spacio on LinkedIn"
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d={LINKEDIN_PATH} />
            </svg>
          </a>
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

        <div>
          <h4>Contact us</h4>
          <a className="contact-link" href={"mailto:" + SUPPORT_EMAIL}>
            <Icon name="mail" size={16} /> {SUPPORT_EMAIL}
          </a>
          <a className="contact-link" href={"tel:" + SUPPORT_PHONE_TEL}>
            <Icon name="phone" size={16} /> {SUPPORT_PHONE_DISPLAY}
          </a>
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
