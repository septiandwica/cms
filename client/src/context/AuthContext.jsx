import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import { API_PATHS } from "../services/apiPaths";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    setLoading(false);
    return;
  }

  // Set dari localStorage dulu
  setUser(JSON.parse(storedUser));

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_PROFILE, {
        withCredentials: true,
      });

      // Pastikan konsisten: ambil langsung object user
      const normalizedUser = response.data.user || response.data;
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } catch (error) {
      console.error("User not authenticated.", error);
      clearUser();
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, []);

  const updateUser = (userData, token) => {
    setUser(userData);
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setLoading(false);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
