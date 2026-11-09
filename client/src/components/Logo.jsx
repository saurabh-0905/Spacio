import { Link } from "react-router-dom";

// Spacio wordmark. Made for dark backgrounds.
export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Spacio home">
      <span className="logo-mark" aria-hidden="true" />
      Spacio
    </Link>
  );
}
