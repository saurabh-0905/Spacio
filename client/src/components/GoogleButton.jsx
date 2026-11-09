import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { errorMessage } from "../utils.js";

// Your Google Client ID is set in client/.env as VITE_GOOGLE_CLIENT_ID.
// If it is missing, the Google button (and the "or" line) is simply not shown.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_URL = "https://accounts.google.com/gsi/client";

// Loads Google's sign-in script once
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    let script = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Could not load Google sign-in. Check your internet connection.")));
  });
}

export default function GoogleButton({ onError }) {
  const buttonRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          // Google calls this after the user picks an account. We send the proof to our server.
          callback: async (response) => {
            try {
              const res = await api.post("/auth/google", { credential: response.credential });
              login(res.data);
              navigate("/");
            } catch (err) {
              onError(errorMessage(err));
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: Math.min(400, Math.max(220, buttonRef.current.offsetWidth)),
        });
      })
      .catch((err) => onError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <>
      <div ref={buttonRef} className="google-btn" />
      <div className="divider"><span>or</span></div>
    </>
  );
}
