import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserById, addUser, getUserByCredentials, logAudit } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Local user state containing role, sellerId, etc.
  const [tgUser, setTgUser] = useState(null); // Telegram user data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initAuth = () => {
      // 1. Check if Telegram WebApp is available
      const tg = window.Telegram?.WebApp;
      if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        tg.ready();
        tg.expand();
        const telegramUser = tg.initDataUnsafe.user;
        setTgUser(telegramUser);
        
        // 2. Look up the user in our mock database
        let dbUser = getUserById(telegramUser.id);
        
        if (!dbUser) {
          dbUser = addUser({
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
            username: telegramUser.username,
            role: "pending",
            sellerId: null,
            sellerStockPercentages: {},
            permissions: [],
          });
        }
        
        setUser(dbUser);
        setLoading(false);
      } else {
        // Desktop / Browser session check
        const storedUserId = localStorage.getItem("auth_user_id");
        if (storedUserId) {
          const dbUser = getUserById(storedUserId);
          if (dbUser) {
            setUser(dbUser);
          }
        }
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (username, password) => {
    setError("");
    const foundUser = getUserByCredentials(username, password);
    if (foundUser) {
      localStorage.setItem("auth_user_id", foundUser.telegramId);
      setUser(foundUser);
      return true;
    } else {
      setError("Login yoki parol noto'g'ri");
      return false;
    }
  };

  const logout = () => {
    if (user) {
      logAudit(user.telegramId, "LOGOUT", "Tizimdan chiqdi");
    }
    localStorage.removeItem("auth_user_id");
    localStorage.removeItem("mock_tg_id"); // remove legacy mock
    setUser(null);
    setTgUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, tgUser, loading, login, logout, setUser, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
