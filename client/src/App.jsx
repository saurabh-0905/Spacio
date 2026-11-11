import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import SupportChat from "./components/SupportChat.jsx";
import Home from "./pages/Home.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ListingDetails from "./pages/ListingDetails.jsx";
import CreateListing from "./pages/CreateListing.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Chat from "./pages/Chat.jsx";
import Profile from "./pages/Profile.jsx";
import { Privacy, Terms } from "./pages/Legal.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

// Pages that need login: send visitors to the login page instead
function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/listings/:id" element={<ListingDetails />} />
          <Route path="/add-space" element={<Private><CreateListing /></Private>} />
          <Route path="/edit-space/:id" element={<Private><CreateListing /></Private>} />
          <Route path="/my-spaces" element={<Private><OwnerDashboard /></Private>} />
          <Route path="/my-bookings" element={<Private><MyBookings /></Private>} />
          <Route path="/profile" element={<Private><Profile /></Private>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/chat/:bookingId" element={<Private><Chat /></Private>} />
        </Routes>
      </main>
      <Footer />
      <SupportChat />
    </>
  );
}
