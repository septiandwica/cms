import { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import { API_PATHS } from "../services/apiPaths";
import { AuthContext } from "../context/AuthContext";

export const useOrders = () => {
  const { user, loading: userLoading } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (userLoading) return;
      
      if (!user) {
        console.warn("⚠️ No logged in user found");
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Fetching orders for user:", user);
        const res = await axiosInstance.get(API_PATHS.ORDERS.MY_ORDERS);
        console.log("✅ Orders response:", res.data);
        setOrders(res.data.orders || []);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching my orders:", err);
        setError(err.response?.data?.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [user, userLoading]);

  return { orders, loading: loading || userLoading, error };
};