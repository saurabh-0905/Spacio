import { createContext, useContext, useState } from "react";

// Keeps the logged-in user available to every page
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  function login(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  // After the profile is edited, keep the saved user in step with the server
  function updateUser(newUser) {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}
