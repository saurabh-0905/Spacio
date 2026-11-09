import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Logo from "./Logo.jsx";
import Icon from "./Icons.jsx";

// The round letter icon. Clicking it opens a small menu with Profile and Log out.
function AccountMenu({ onDone }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Close the menu when you click somewhere else, or press Escape
  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleLogout() {
    setOpen(false);
    onDone();
    logout();
    navigate("/");
  }

  function close() {
    setOpen(false);
    onDone();
  }

  return (
    <div className="account" ref={boxRef}>
      <button
        type="button"
        className="avatar-btn"
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <Link to="/profile" role="menuitem" onClick={close}>
            <Icon name="user" size={18} /> Profile & settings
          </Link>
          <button type="button" role="menuitem" className="menu-danger" onClick={handleLogout}>
            <Icon name="logout" size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false); // mobile menu

  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="wrap navbar-inner">
        <Logo />

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <Icon name={open ? "close" : "menu"} size={24} />
        </button>

        <nav className={"nav-links" + (open ? " open" : "")}>
          <NavLink to="/" end onClick={close}>Explore</NavLink>
          {user ? (
            <>
              <NavLink to="/my-spaces" onClick={close}>My spaces</NavLink>
              <NavLink to="/my-bookings" onClick={close}>My bookings</NavLink>
              <Link to="/add-space" className="btn btn-primary btn-sm" onClick={close}>
                <Icon name="plus" size={16} /> List a space
              </Link>
              <AccountMenu onDone={close} />
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Log in</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
