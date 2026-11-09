import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// When you open another page (for example from the footer), start at the top of it.
// Links like /?category=parking are left alone, because the home page scrolls to the results by itself.
export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!search) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
